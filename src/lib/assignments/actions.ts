"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AssignmentToggleResult = {
  ok: boolean;
  completed?: boolean;
  error?: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function toggleAssignmentStatus(
  assignmentId: string,
): Promise<AssignmentToggleResult> {
  if (!UUID_PATTERN.test(assignmentId)) {
    return { ok: false, error: "ไม่พบงานนี้" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "กรุณาเข้าสู่ระบบก่อน" };

  // ต้องมองเห็นงานนี้จริง (RLS กรองตามห้องเรียน) ก่อนบันทึกสถานะ
  const { data: assignment } = await supabase
    .from("assignments")
    .select("id")
    .eq("id", assignmentId)
    .maybeSingle();
  if (!assignment) return { ok: false, error: "ไม่พบงานนี้" };

  const { data: existing, error: lookupError } = await supabase
    .from("assignment_status")
    .select("id, status")
    .eq("assignment_id", assignmentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError) {
    return { ok: false, error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" };
  }

  if (!existing) {
    const { error } = await supabase.from("assignment_status").insert({
      assignment_id: assignmentId,
      user_id: user.id,
      status: "completed",
      completed_at: new Date().toISOString(),
    });
    // 23505 = แถวถูกสร้างพร้อมกันจากอีก request — ถือว่าทำเสร็จแล้ว
    if (error && error.code !== "23505") {
      return { ok: false, error: "บันทึกสถานะไม่สำเร็จ" };
    }
    revalidatePath("/assignments");
    revalidatePath("/");
    return { ok: true, completed: true };
  }

  const nextCompleted = existing.status !== "completed";
  const { error } = await supabase
    .from("assignment_status")
    .update({
      status: nextCompleted ? "completed" : "pending",
      completed_at: nextCompleted ? new Date().toISOString() : null,
    })
    .eq("id", existing.id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: "บันทึกสถานะไม่สำเร็จ" };

  revalidatePath("/assignments");
  revalidatePath("/");
  return { ok: true, completed: nextCompleted };
}
