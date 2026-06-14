import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/welcome", "/login", "/register", "/auth"];

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user, hasAuthCookie, authUnavailable } =
    await updateSession(request);
  const path = request.nextUrl.pathname;

  const isPublic = PUBLIC_PATHS.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );

  // redirect ที่ "พก cookie ที่เพิ่ง refresh" ไปด้วยเสมอ — ไม่งั้น token ที่หมุนใหม่
  // จะหายไปกับ response เดิม ทำให้ session หลุด (อาการ: ล็อกอินใหม่แล้วยังหลุด)
  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const res = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  // เชื่อมต่อ Supabase ไม่ได้ชั่วคราว แต่ยังมี cookie auth อยู่ —
  // อย่าเตะผู้ใช้ออกไป /welcome (กันอาการ "กดย้อนกลับแล้วหลุดไปหน้า login"
  // ตอนเน็ต/DNS สะดุด) ปล่อยให้ผ่าน แล้วให้หน้า/RLS ฝั่ง server จัดการต่อ
  if (!user && authUnavailable && hasAuthCookie) {
    return supabaseResponse;
  }

  // ยังไม่ login + เข้าหน้าที่ต้องล็อกอิน -> ไป /welcome
  if (!user && !isPublic) {
    return redirectTo("/welcome");
  }

  // login แล้ว + อยู่หน้า auth -> ไปหน้าหลัก
  if (user && isPublic) {
    return redirectTo("/");
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * จับทุก path ยกเว้น:
     * - _next/static, _next/image (ไฟล์ static)
     * - favicon.ico, manifest.json
     * - ไฟล์รูป/asset
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|assets|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
