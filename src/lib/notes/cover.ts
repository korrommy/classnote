import "server-only";
import { getR2SignedUrl } from "@/lib/storage/r2";

// ตัวช่วยสร้าง "ภาพหน้าปก" ของการ์ดโน้ตจากไฟล์แนบ (note_files)
// - ถ้ามีไฟล์รูป -> เซ็น signed URL (R2 เป็น bucket private) มาโชว์เป็นปก
// - ถ้าไม่มีรูปแต่มี PDF -> คืน kind = "pdf" ให้การ์ดวาง placeholder แบบ PDF
//   (ยังเรนเดอร์หน้าแรกของ PDF จริงไม่ได้ด้วยสถาปัตยกรรมปัจจุบัน)
// - ไม่มีไฟล์เลย -> kind = null ให้การ์ดวาง placeholder อ่อน ๆ
type RawNoteFile = { file_url: string; file_type: string };

export type NoteCoverKind = "image" | "pdf" | null;
export type NoteCover = { coverUrl: string | null; kind: NoteCoverKind };

export const EMPTY_COVER: NoteCover = { coverUrl: null, kind: null };

function isNoteFile(value: unknown): value is RawNoteFile {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as RawNoteFile).file_url === "string" &&
    typeof (value as RawNoteFile).file_type === "string"
  );
}

// รับ unknown เพราะ embed `files:note_files(...)` ถูก type หลวม ๆ ในฝั่ง client
// (hand-written Database type ไม่ได้ประกาศความสัมพันธ์นี้) — narrow ให้ปลอดภัยเอง
export async function resolveNoteCover(files: unknown): Promise<NoteCover> {
  const list = Array.isArray(files) ? files.filter(isNoteFile) : [];

  const image = list.find((file) => file.file_type === "image");
  if (image) {
    const coverUrl = await getR2SignedUrl(image.file_url, 3600);
    if (coverUrl) return { coverUrl, kind: "image" };
  }

  if (list.some((file) => file.file_type === "pdf")) {
    return { coverUrl: null, kind: "pdf" };
  }

  return EMPTY_COVER;
}
