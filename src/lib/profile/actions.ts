"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadToR2, isR2Configured } from "@/lib/storage/r2";
import {
  AVATAR_KEY_PREFIX,
  AVATAR_MIME,
  MAX_AVATAR_BYTES,
  avatarKeyToUrl,
} from "@/lib/avatars";

export type AvatarActionState = { error?: string; avatarUrl?: string };

const CARD_THEMES = ["classic", "sunny", "mint"];

// บันทึกธีมสีการ์ดของผู้ใช้ลง user_metadata (ต่อผู้ใช้, คงอยู่ข้ามหน้า/รีเฟรช/ล็อกอินใหม่)
// เลือกเก็บใน user_metadata เพราะ profiles ถูกล็อกด้วย trigger guard_profile_update
// จึงไม่ต้องแก้ schema/RLS — ผู้ใช้แก้ metadata ของตัวเองได้ผ่าน auth.updateUser
export async function saveCardTheme(theme: string): Promise<{ ok: boolean }> {
  if (!CARD_THEMES.includes(theme)) return { ok: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.auth.updateUser({
    data: { card_theme: theme },
  });
  return { ok: !error };
}

// อัปโหลดรูปโปรไฟล์ของผู้ใช้ขึ้น R2 แล้วบันทึก path ลง profiles.avatar_url
// - ไม่เชื่อ user id จาก client: ใช้ auth.getUser() ฝั่ง server
// - ตรวจชนิด/ขนาดไฟล์ซ้ำฝั่ง server (กัน client ส่งของแปลก)
// - คืน avatarUrl ให้ client อัปเดตการ์ดได้ทันที
export async function uploadAvatar(
  formData: FormData,
): Promise<AvatarActionState> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "ไม่พบไฟล์รูป กรุณาเลือกใหม่" };
  }

  const meta = AVATAR_MIME[file.type];
  if (!meta) return { error: "รองรับเฉพาะรูป PNG, JPG หรือ WEBP" };
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "รูปใหญ่เกินไป (ไม่เกิน 5MB)" };
  }
  if (!isR2Configured) {
    return { error: "ระบบรูปโปรไฟล์ยังไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อน" };

  const key = `${AVATAR_KEY_PREFIX}${user.id}-${crypto.randomUUID()}.${meta.ext}`;

  let uploaded = false;
  try {
    uploaded = await uploadToR2(key, file, file.type);
  } catch {
    uploaded = false;
  }
  if (!uploaded) return { error: "อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่" };

  const avatarUrl = avatarKeyToUrl(key);
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);
  if (error) return { error: "บันทึกรูปไม่สำเร็จ กรุณาลองใหม่" };

  revalidatePath("/profile");
  return { avatarUrl };
}
