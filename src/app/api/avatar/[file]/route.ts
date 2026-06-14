import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getR2Object } from "@/lib/storage/r2";
import { AVATAR_KEY_PREFIX } from "@/lib/avatars";

export const runtime = "nodejs";

// เสิร์ฟรูป avatar จาก R2 (bucket private) เฉพาะผู้ใช้ที่ login แล้ว
// avatar_url เก็บเป็น /api/avatar/<file> เพื่อให้ render ผ่าน url() ได้ทุกหน้า
// โดยไม่ต้องเปิด bucket ให้เป็น public และไม่ส่ง secret ออกฝั่ง client
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ file: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { file } = await params;
  // อนุญาตเฉพาะชื่อไฟล์ปลอดภัย (ตัวอักษร/ตัวเลข/._-) กัน path traversal
  if (!/^[A-Za-z0-9._-]+$/.test(file)) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const object = await getR2Object(`${AVATAR_KEY_PREFIX}${file}`);
  if (!object) return new NextResponse("Not found", { status: 404 });

  // คัดลอกลง ArrayBuffer ปกติ (กันปัญหา type ArrayBufferLike/SharedArrayBuffer)
  const bytes = new Uint8Array(object.body);
  return new NextResponse(bytes.buffer, {
    headers: {
      "Content-Type": object.contentType,
      // cache เฉพาะเครื่องผู้ใช้ (เป็นรูปหลัง auth) ลดการดึงซ้ำ
      "Cache-Control": "private, max-age=3600",
    },
  });
}
