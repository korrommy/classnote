"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isKnownClassroomId } from "@/lib/classrooms";
import { uploadToR2, isR2Configured } from "@/lib/storage/r2";
import {
  AVATAR_KEY_PREFIX,
  AVATAR_MIME,
  MAX_AVATAR_BYTES,
  avatarKeyToUrl,
} from "@/lib/avatars";

async function getOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

export type ActionState = {
  error?: string;
  message?: string;
};

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
  // ต้องเช็ค "email not confirmed" ก่อนเงื่อนไข email ทั่วไป (ข้อความมีคำว่า email)
  if (m.includes("not confirmed") || m.includes("confirm"))
    return "อีเมลนี้ยังไม่ได้ยืนยัน กรุณากดลิงก์ยืนยันในอีเมลก่อนเข้าสู่ระบบ";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "อีเมลนี้ถูกใช้สมัครไปแล้ว";
  if (m.includes("password"))
    return "รหัสผ่านไม่ปลอดภัยพอ (อย่างน้อย 6 ตัวอักษร)";
  if (m.includes("email")) return "อีเมลไม่ถูกต้อง";
  return "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
}

export async function signIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "กรุณากรอกอีเมลและรหัสผ่าน" };
  }

  const supabase = await createClient();
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: translateAuthError(error.message) };
    }
  } catch {
    // เน็ต/DNS หลุด (เช่น ENOTFOUND) ทำให้ fetch ไป Supabase ล้มเหลว
    return {
      error: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่",
    };
  }

  // redirect ต้องอยู่นอก try (มันทำงานด้วยการ throw NEXT_REDIRECT)
  redirect("/loading");
}

export async function signUp(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const classroomId = String(formData.get("classroom_id") ?? "").trim();
  const studentNo = String(formData.get("student_no") ?? "").trim();
  const accept = String(formData.get("accept") ?? "");

  if (!fullName) {
    return { error: "กรุณากรอกชื่อ-นามสกุล" };
  }
  if (!email || !password) {
    return { error: "กรุณากรอกอีเมลและรหัสผ่าน" };
  }
  if (password.length < 6) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
  }
  if (password !== confirm) {
    return { error: "รหัสผ่านทั้งสองช่องไม่ตรงกัน" };
  }
  if (!classroomId || !studentNo) {
    return { error: "กรุณาเลือกห้อง และกรอกเลขที่" };
  }
  // ไม่เชื่อค่าจาก client — ต้องเป็น id ห้องที่รู้จักเท่านั้น
  if (!isKnownClassroomId(classroomId)) {
    return { error: "ห้องเรียนไม่ถูกต้อง" };
  }
  if (!accept) {
    return { error: "กรุณายอมรับข้อตกลงการใช้งาน" };
  }

  // รูปโปรไฟล์ (ไม่บังคับ) — อัปโหลดขึ้น R2 ก่อนสมัคร แล้วพก path ผ่าน metadata
  // ไปใส่ profiles.avatar_url หลังยืนยันตัวตน (callback) หรือทันทีถ้ามี session
  let avatarPath: string | null = null;
  const avatarFile = formData.get("avatar");
  if (avatarFile instanceof File && avatarFile.size > 0) {
    const avatarMeta = AVATAR_MIME[avatarFile.type];
    if (!avatarMeta) {
      return { error: "รูปโปรไฟล์รองรับเฉพาะ PNG, JPG หรือ WEBP" };
    }
    if (avatarFile.size > MAX_AVATAR_BYTES) {
      return { error: "รูปโปรไฟล์ใหญ่เกินไป (ไม่เกิน 5MB)" };
    }
    if (isR2Configured) {
      const key = `${AVATAR_KEY_PREFIX}${crypto.randomUUID()}.${avatarMeta.ext}`;
      try {
        if (await uploadToR2(key, avatarFile, avatarFile.type)) {
          avatarPath = avatarKeyToUrl(key);
        }
      } catch {
        avatarPath = null;
      }
    }
  }

  const supabase = await createClient();
  const origin = await getOrigin();

  // ห่อ network-call ของ Supabase ด้วย try/catch (แบบเดียวกับ signIn)
  // ถ้าเน็ต/DNS หลุด (เช่น ENOTFOUND) fetch จะ throw — แปลงเป็นข้อความไทยที่ชัดเจน
  // แทนที่จะโยน error ขึ้นไปหรือโชว์ข้อความ generic
  let data: Awaited<ReturnType<typeof supabase.auth.signUp>>["data"];
  try {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/loading`,
        data: {
          full_name: fullName,
          pending_classroom_id: classroomId,
          pending_student_no: studentNo,
          ...(avatarPath ? { pending_avatar: avatarPath } : {}),
        },
      },
    });
    if (result.error) {
      return { error: translateAuthError(result.error.message) };
    }
    data = result.data;
  } catch {
    return {
      error: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่",
    };
  }

  // ถ้าได้ session ทันที (ไม่ต้องยืนยันอีเมล) ใส่รูปโปรไฟล์ได้เลย
  // ไม่ critical — ถ้าพลาด รูปจะถูกใส่อีกครั้งใน /auth/callback จาก pending_avatar
  if (data.session && avatarPath && data.user) {
    try {
      await supabase
        .from("profiles")
        .update({ avatar_url: avatarPath })
        .eq("id", data.user.id);
    } catch {
      // ปล่อยผ่าน — callback จะตั้ง avatar ให้ภายหลัง
    }
  }

  if (!data.session) {
    return {
      message:
        "สมัครสำเร็จ! เราส่งลิงก์ยืนยันไปที่อีเมลของคุณแล้ว กดลิงก์ในเมลเพื่อเข้าห้องอัตโนมัติ",
    };
  }

  redirect("/loading");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/welcome");
}

export async function claimRoster(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const classroomId = String(formData.get("classroom_id") ?? "").trim();
  const studentNo = String(formData.get("student_no") ?? "").trim();

  if (!classroomId) return { error: "กรุณาเลือกห้องเรียน" };
  if (!studentNo) return { error: "กรุณากรอกเลขประจำตัว" };
  // ไม่เชื่อค่าจาก client — รับเฉพาะห้องที่รองรับจริง (ชุดเดียวกับ /register)
  if (!isKnownClassroomId(classroomId)) {
    return { error: "ไม่พบห้องเรียนที่เลือก" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("claim_roster", {
    p_classroom_id: classroomId,
    p_student_no: studentNo,
  });

  if (error) {
    const msg = error.message || "";
    if (msg.includes("NOT_FOUND"))
      return {
        error:
          "ไม่พบเลขประจำตัวนี้ในห้องที่เลือก กรุณาตรวจสอบอีกครั้ง",
      };
    if (msg.includes("ALREADY_CLAIMED"))
      return {
        error:
          "เลขประจำตัวนี้ถูกใช้ไปแล้ว หากเป็นของคุณกรุณาติดต่อแอดมิน",
      };
    if (msg.includes("CLASSROOM_NOT_FOUND"))
      return { error: "ไม่พบห้องเรียนที่เลือก" };
    if (msg.includes("NOT_AUTHENTICATED"))
      return { error: "กรุณาเข้าสู่ระบบก่อน" };
    return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" };
  }

  redirect("/loading");
}
