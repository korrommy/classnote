"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AdminActionState = {
  error?: string;
  success?: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_TITLE = 200;
const MAX_DESCRIPTION = 1000;
const MAX_SUBJECT_NAME = 100;

type AdminContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  classroomId: string;
};

// ตรวจสิทธิ์ admin ฝั่ง server (RLS เป็นด่านหลัก — ตรงนี้เพื่อ error ที่อ่านรู้เรื่อง)
// อนุญาตเฉพาะ class_admin ของห้องตัวเอง หรือ super_admin
async function requireClassAdmin(): Promise<
  { ok: true; ctx: AdminContext } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "กรุณาเข้าสู่ระบบก่อน" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("classroom_id, is_super_admin")
    .eq("id", user.id)
    .maybeSingle();

  const classroomId = profile?.classroom_id;
  if (!classroomId) return { ok: false, error: "ไม่พบห้องเรียนของคุณ" };

  if (!profile?.is_super_admin) {
    const { data: membership } = await supabase
      .from("classroom_members")
      .select("role")
      .eq("classroom_id", classroomId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership?.role !== "class_admin") {
      return { ok: false, error: "เฉพาะหัวหน้าห้องเท่านั้น" };
    }
  }

  return { ok: true, ctx: { supabase, userId: user.id, classroomId } };
}

export async function createAssignment(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueDateRaw = String(formData.get("due_date") ?? "").trim();
  const subjectId = String(formData.get("subject_id") ?? "").trim();

  if (!title) return { error: "กรุณาใส่ชื่องาน" };
  if (title.length > MAX_TITLE) return { error: "ชื่องานยาวเกินไป" };
  if (description.length > MAX_DESCRIPTION) {
    return { error: "รายละเอียดยาวเกินไป" };
  }

  let dueDate: string | null = null;
  if (dueDateRaw) {
    const parsed = new Date(dueDateRaw);
    if (Number.isNaN(parsed.getTime())) {
      return { error: "วันกำหนดส่งไม่ถูกต้อง" };
    }
    dueDate = parsed.toISOString();
  }

  const access = await requireClassAdmin();
  if (!access.ok) return { error: access.error };
  const { supabase, userId, classroomId } = access.ctx;

  // subject_id ต้องเป็นวิชาของห้องตัวเองเท่านั้น (RLS ฝั่ง assignments ไม่เช็คข้อนี้)
  if (subjectId) {
    if (!UUID_PATTERN.test(subjectId)) return { error: "ไม่พบวิชานี้" };
    const { data: subject } = await supabase
      .from("subjects")
      .select("id")
      .eq("id", subjectId)
      .eq("classroom_id", classroomId)
      .maybeSingle();
    if (!subject) return { error: "ไม่พบวิชานี้ในห้องของคุณ" };
  }

  const { error } = await supabase.from("assignments").insert({
    classroom_id: classroomId,
    subject_id: subjectId || null,
    title,
    description: description || null,
    due_date: dueDate,
    created_by: userId,
  });

  if (error) return { error: "เพิ่มงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };

  revalidatePath("/assignments");
  revalidatePath("/admin");
  revalidatePath("/");
  return { success: "เพิ่มงานเรียบร้อยแล้ว" };
}

export async function createSubject(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) return { error: "กรุณาใส่ชื่อวิชา" };
  if (name.length > MAX_SUBJECT_NAME) return { error: "ชื่อวิชายาวเกินไป" };

  const access = await requireClassAdmin();
  if (!access.ok) return { error: access.error };
  const { supabase, classroomId } = access.ctx;

  // escape wildcard ของ ilike กัน pattern หลุดจาก input
  const escapedName = name.replace(/[\\%_]/g, (ch) => `\\${ch}`);
  const { data: existing } = await supabase
    .from("subjects")
    .select("id")
    .eq("classroom_id", classroomId)
    .ilike("name", escapedName)
    .maybeSingle();
  if (existing) return { error: "มีวิชานี้ในห้องอยู่แล้ว" };

  const { error } = await supabase.from("subjects").insert({
    classroom_id: classroomId,
    name,
  });

  if (error) return { error: "เพิ่มวิชาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };

  revalidatePath("/subjects");
  revalidatePath("/notes");
  revalidatePath("/post");
  revalidatePath("/admin");
  revalidatePath("/");
  return { success: "เพิ่มวิชาเรียบร้อยแล้ว" };
}
