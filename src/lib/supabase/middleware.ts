import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // มี cookie auth ของ Supabase อยู่หรือไม่ (sb-<ref>-auth-token หรือชิ้นย่อย .0/.1)
  // ใช้แยกกรณี "ไม่มี session จริง" ออกจาก "เชื่อมต่อ Supabase ไม่ได้ชั่วคราว"
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

  // IMPORTANT: ห้ามมีโค้ดคั่นระหว่าง createServerClient กับ getUser()
  let user = null;
  let authUnavailable = false;
  try {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    user = u;
  } catch {
    // เน็ต/DNS หลุดชั่วคราว (เช่น ENOTFOUND) ทำให้ getUser() โยน error
    // อย่าเพิ่งถือว่าผู้ใช้ logout — ให้ proxy ตัดสินใจโดยดู cookie ประกอบ
    authUnavailable = true;
  }

  return { supabaseResponse, user, hasAuthCookie, authUnavailable };
}
