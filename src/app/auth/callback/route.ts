import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// client ที่ถือ Database generic ไว้ — ถ้าใช้ SupabaseClient เปล่าๆ
// type ของ rpc/from จะหายและต้อง cast
type TypedClient = Awaited<ReturnType<typeof createClient>>;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const explicitNext = searchParams.get("next");

  const supabase = await createClient();

  let confirmed = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    confirmed = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    confirmed = !error;
  }

  if (!confirmed) {
    return NextResponse.redirect(`${origin}/login?error=confirm_failed`);
  }

  const claimedNext = await autoClaim(supabase);
  const next = explicitNext && claimedNext === "/" ? explicitNext : claimedNext;
  return NextResponse.redirect(`${origin}${next}`);
}

async function autoClaim(supabase: TypedClient): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "/verify";

  const { data: profile } = await supabase
    .from("profiles")
    .select("classroom_id, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const meta = user.user_metadata ?? {};

  // ใส่รูปโปรไฟล์ที่เลือกตอนสมัคร (อัปโหลดขึ้น R2 แล้ว เก็บ path ไว้ใน metadata)
  // ทำก่อนเช็คห้อง เพื่อให้ผู้ใช้ที่มีห้องอยู่แล้วก็ยังได้รูป
  const pendingAvatar = String(meta.pending_avatar ?? "").trim();
  if (pendingAvatar.startsWith("/api/avatar/") && !profile?.avatar_url) {
    await supabase
      .from("profiles")
      .update({ avatar_url: pendingAvatar })
      .eq("id", user.id);
  }

  if (profile?.classroom_id) return "/";

  // ห้องถูกเลือกเป็น dropdown ตอนสมัคร จึงได้ classroom_id ตรง ๆ
  // ไม่ต้องเดา/แปลงจากข้อความห้องอีก (เดิม match พลาดบ่อย เลยตกไป /verify)
  const classroomId = String(meta.pending_classroom_id ?? "").trim();
  const studentNo = String(meta.pending_student_no ?? "").trim();
  if (!classroomId || !studentNo) return "/verify";

  const { error } = await supabase.rpc("claim_roster", {
    p_classroom_id: classroomId,
    p_student_no: studentNo,
  });
  if (error) return "/verify";

  return "/";
}
