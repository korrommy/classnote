"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadToR2, deleteR2Prefix, isR2Configured } from "@/lib/storage/r2";
import type { NoteVisibility } from "@/types/database.types";

export type NoteActionState = {
  error?: string;
};

const VALID_VISIBILITY: NoteVisibility[] = ["classroom", "public", "both"];

const MAX_FILE_BYTES = 30 * 1024 * 1024; // 30MB — ต้องน้อยกว่า bodySizeLimit ใน next.config.ts
const ALLOWED_FILE_TYPES: Record<string, { ext: string; kind: "image" | "pdf" }> = {
  "image/png": { ext: "png", kind: "image" },
  "image/jpeg": { ext: "jpg", kind: "image" },
  "image/webp": { ext: "webp", kind: "image" },
  "application/pdf": { ext: "pdf", kind: "pdf" },
};

export async function createNote(
  _prev: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const subjectId = String(formData.get("subject_id") ?? "");
  const visibilityRaw = String(formData.get("visibility") ?? "classroom");
  const visibility: NoteVisibility = VALID_VISIBILITY.includes(
    visibilityRaw as NoteVisibility,
  )
    ? (visibilityRaw as NoteVisibility)
    : "classroom";

  if (!title) return { error: "กรุณาใส่ชื่อเรื่อง" };

  // ตรวจไฟล์แนบก่อน insert note เพื่อให้ reject ได้โดยไม่มีโน้ตค้าง
  const fileEntry = formData.get("file");
  const file =
    fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;
  if (file) {
    if (!ALLOWED_FILE_TYPES[file.type]) {
      return { error: "แนบได้เฉพาะรูปภาพ (PNG/JPG/WebP) หรือ PDF" };
    }
    if (file.size > MAX_FILE_BYTES) {
      return { error: "ไฟล์ใหญ่เกินไป (ไม่เกิน 30MB)" };
    }
    // ถ้า R2 ยังตั้งค่าไม่ครบ ให้ reject ตั้งแต่ต้น (ก่อน insert note)
    // เพื่อไม่ให้ผู้ใช้ที่ตั้งใจแนบไฟล์ได้โน้ตที่ไม่มีไฟล์โดยไม่รู้ตัว
    if (!isR2Configured) {
      return { error: "ระบบไฟล์แนบยังไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง" };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อน" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("classroom_id")
    .eq("id", user.id)
    .single();

  const classroomId = profile?.classroom_id;
  if (!classroomId) return { error: "ไม่พบห้องเรียนของคุณ" };

  const { data: note, error } = await supabase
    .from("notes")
    .insert({
      classroom_id: classroomId,
      subject_id: subjectId || null,
      author_id: user.id,
      title,
      content: content || null,
      visibility,
    })
    .select("id")
    .single();

  if (error || !note) {
    return { error: "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
  }

  // อัปโหลดไฟล์แนบ — ถ้าพลาด (เช่น เครือข่ายล่ม/คีย์ผิด) ให้ลบโน้ตที่เพิ่งสร้าง
  // แล้วแจ้ง error เพื่อไม่ให้ผู้ใช้เข้าใจผิดว่าโพสต์พร้อมไฟล์สำเร็จทั้งที่ไฟล์หาย
  if (file) {
    const meta = ALLOWED_FILE_TYPES[file.type];
    // ชื่อไฟล์ต้นฉบับ (อาจเป็นภาษาไทย) เก็บใน file_name
    // ส่วน storage key ใช้ชื่อสุ่มที่ปลอดภัยเสมอ
    const storagePath = `${note.id}/file-${crypto.randomUUID()}.${meta.ext}`;

    let uploaded = false;
    try {
      uploaded = await uploadToR2(storagePath, file, file.type);
    } catch {
      uploaded = false;
    }

    if (!uploaded) {
      // ลบโน้ตที่เพิ่งสร้าง (ยังไม่มีแถว note_files ชี้มา) เพื่อไม่ให้มีโน้ตค้าง
      await supabase.from("notes").delete().eq("id", note.id);
      return { error: "อัปโหลดไฟล์แนบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
    }

    // ตรวจผล insert ด้วย — ถ้าแถว note_files ไม่ถูกบันทึก (เช่น policy/RLS ผิด)
    // โน้ตจะโพสต์สำเร็จแต่ไม่มีแถวไฟล์ ทำให้หน้ารายละเอียดไม่โชว์ไฟล์เลย
    // กรณีนี้ให้เก็บกวาดไฟล์ใน R2 + ลบโน้ต แล้วแจ้ง error ชัดเจน (ไม่โพสต์ค้างแบบไม่มีไฟล์)
    const { error: fileRowError } = await supabase.from("note_files").insert({
      note_id: note.id,
      file_url: storagePath,
      file_type: meta.kind === "image" ? "image" : "pdf",
      file_name: file.name || null,
    });

    if (fileRowError) {
      try {
        await deleteR2Prefix(`${note.id}/`);
      } catch {
        // ลบไฟล์ค้างไม่สำเร็จ — เก็บกวาดภายหลังได้ ไม่ขวางการแจ้ง error
      }
      await supabase.from("notes").delete().eq("id", note.id);
      return { error: "บันทึกไฟล์แนบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
    }
  }

  revalidatePath("/notes");
  revalidatePath("/public");
  revalidatePath("/");
  redirect(visibility === "classroom" ? "/notes" : "/public");
}

export async function deleteNote(noteId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/welcome");

  // RLS เป็นด่านหลักอยู่แล้ว — เช็คความเป็นเจ้าของซ้ำตรงนี้เพื่อไม่ให้
  // ผู้ที่ไม่ใช่เจ้าของถูก redirect เหมือนลบสำเร็จทั้งที่ไม่มีอะไรถูกลบ
  const { data: note } = await supabase
    .from("notes")
    .select("id, author_id")
    .eq("id", noteId)
    .maybeSingle();
  if (!note || note.author_id !== user.id) redirect("/notes");

  // ลบไฟล์ใน R2 ก่อน — ถ้าโน้ตถูกลบก่อน แถว note_files
  // จะ cascade หายแต่ object ใน bucket จะค้างเป็นขยะ
  // ไฟล์ทุกใบของโน้ตอยู่ใต้ prefix "<noteId>/"
  try {
    await deleteR2Prefix(`${noteId}/`);
  } catch {
    // ถ้าลบไฟล์พลาด ยังลบโน้ตต่อ — ไฟล์ค้างเก็บกวาดได้ภายหลัง
  }

  // .select() ให้รู้ว่ามีแถวถูกลบจริงไหม — ถ้า 0 แถว/มี error แปลว่า RLS บล็อก
  // หรือเครือข่ายล้มเหลว จะได้เห็นใน log แทนที่จะ "เหมือนลบสำเร็จ" แบบเงียบ ๆ
  const { data: deleted, error: deleteError } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .select("id");
  if (deleteError || !deleted || deleted.length === 0) {
    console.error("[deleteNote] delete failed or blocked", {
      noteId,
      error: deleteError?.message,
      deletedCount: deleted?.length ?? 0,
    });
  }

  revalidatePath("/notes");
  revalidatePath("/public");
  revalidatePath("/");
  redirect("/notes");
}
