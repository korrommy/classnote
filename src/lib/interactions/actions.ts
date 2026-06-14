"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ToggleResult = {
  ok: boolean;
  active?: boolean;
  error?: string;
};

export type CommentActionState = {
  error?: string;
  success?: number;
};

const COMMENT_MAX_LENGTH = 500;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function toggleLike(noteId: string): Promise<ToggleResult> {
  if (!UUID_PATTERN.test(noteId)) {
    return { ok: false, error: "ไม่พบโน้ตนี้" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "กรุณาเข้าสู่ระบบก่อน" };

  const { data: existing, error: lookupError } = await supabase
    .from("note_likes")
    .select("note_id")
    .eq("note_id", noteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError) {
    return { ok: false, error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" };
  }

  if (existing) {
    const { error } = await supabase
      .from("note_likes")
      .delete()
      .eq("note_id", noteId)
      .eq("user_id", user.id);
    if (error) return { ok: false, error: "ยกเลิกถูกใจไม่สำเร็จ" };

    // ไม่ revalidate ฟีด — หน้า /public และ /saved เป็น optimistic อยู่แล้ว
    // ถ้า revalidate จะทำให้ count จาก server (+1) ซ้อนกับ optimistic delta (+1) = +2
    return { ok: true, active: false };
  }

  const { error } = await supabase
    .from("note_likes")
    .insert({ note_id: noteId, user_id: user.id });

  // 23505 = unique violation (กดซ้ำพร้อมกัน) ถือว่า like สำเร็จแล้ว
  if (error && error.code !== "23505") {
    return { ok: false, error: "ถูกใจไม่สำเร็จ" };
  }

  return { ok: true, active: true };
}

export async function toggleSave(noteId: string): Promise<ToggleResult> {
  if (!UUID_PATTERN.test(noteId)) {
    return { ok: false, error: "ไม่พบโน้ตนี้" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "กรุณาเข้าสู่ระบบก่อน" };

  const { data: existing, error: lookupError } = await supabase
    .from("saved_notes")
    .select("id")
    .eq("note_id", noteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError) {
    return { ok: false, error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" };
  }

  if (existing) {
    const { error } = await supabase
      .from("saved_notes")
      .delete()
      .eq("note_id", noteId)
      .eq("user_id", user.id);
    if (error) return { ok: false, error: "ยกเลิกบันทึกไม่สำเร็จ" };

    // ไม่ revalidate ฟีด — เป็น optimistic อยู่แล้ว (กันปัญหา like count ซ้อน +2)
    // /saved ตั้งใจให้การ์ดที่ยกเลิกยังอยู่จนกว่าจะ reload เพื่อกดบันทึกกลับได้
    return { ok: true, active: false };
  }

  const { error } = await supabase
    .from("saved_notes")
    .insert({ note_id: noteId, user_id: user.id });

  if (error && error.code !== "23505") {
    return { ok: false, error: "บันทึกไม่สำเร็จ" };
  }

  return { ok: true, active: true };
}

export async function createComment(
  noteId: string,
  prev: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  if (!UUID_PATTERN.test(noteId)) {
    return { error: "ไม่พบโน้ตนี้" };
  }

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "กรุณาพิมพ์ความคิดเห็นก่อน" };
  if (content.length > COMMENT_MAX_LENGTH) {
    return { error: `ความคิดเห็นยาวเกินไป (ไม่เกิน ${COMMENT_MAX_LENGTH} ตัวอักษร)` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อน" };

  const { error } = await supabase.from("comments").insert({
    note_id: noteId,
    author_id: user.id,
    content,
  });

  if (error) {
    return { error: "ส่งความคิดเห็นไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
  }

  revalidatePath(`/notes/${noteId}`);
  // success เป็นตัวเลขนับครั้ง เพื่อให้ client รู้ว่าต้อง reset form แม้ส่งสำเร็จติดกัน
  return { success: (prev.success ?? 0) + 1 };
}

export async function deleteComment(commentId: string): Promise<void> {
  if (!UUID_PATTERN.test(commentId)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: comment } = await supabase
    .from("comments")
    .select("id, note_id, author_id")
    .eq("id", commentId)
    .maybeSingle();

  if (!comment || comment.author_id !== user.id) return;

  // .select() เพื่อยืนยันว่าลบจริง — ถ้า 0 แถว/error แปลว่า RLS บล็อกหรือเน็ตล้ม
  // จะได้เห็นใน log แทนที่จะเงียบ
  const { data: deleted, error: deleteError } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", user.id)
    .select("id");
  if (deleteError || !deleted || deleted.length === 0) {
    console.error("[deleteComment] delete failed or blocked", {
      commentId,
      error: deleteError?.message,
      deletedCount: deleted?.length ?? 0,
    });
  }

  revalidatePath(`/notes/${comment.note_id}`);
}
