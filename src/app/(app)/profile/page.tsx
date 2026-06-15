import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { ProfileCardCustomizer } from "@/components/profile/ProfileCardCustomizer";
import {
  CARD_THEMES,
  type ProfileCardTheme,
} from "@/components/profile/ProfileStudentCard";

const menuItems = [
  { label: "โน้ตของฉัน", href: "/my-notes", iconSrc: "/icons/profile-menu/notes.png" },
  { label: "โพสต์ที่บันทึก", href: "/saved", iconSrc: "/icons/profile-menu/saved.png" },
  { label: "โพสต์สาธารณะ", href: "/my-public-posts", iconSrc: "/icons/profile-menu/public-post.png" },
  { label: "เพื่อนในห้อง", href: "/members", iconSrc: "/icons/profile-menu/classmates.png" },
];

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/welcome");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, student_no, grade_level, classroom_id, is_super_admin")
    .eq("id", user.id)
    .single();

  // โชว์เมนู "จัดการห้อง" เฉพาะ class_admin ของห้องตัวเอง หรือ super_admin
  let isAdmin = profile?.is_super_admin ?? false;
  if (!isAdmin && profile?.classroom_id) {
    const { data: membership } = await supabase
      .from("classroom_members")
      .select("role")
      .eq("classroom_id", profile.classroom_id)
      .eq("user_id", user.id)
      .maybeSingle();
    isAdmin = membership?.role === "class_admin";
  }

  // ดึง "ชื่อห้อง" จริง (เช่น "ม.6/1") จากตาราง classrooms ตาม classroom_id ของผู้ใช้เอง
  // classrooms RLS เปิดให้ผู้ login อ่านได้ — และ classroom_id มาจากโปรไฟล์ของ user.id
  // ที่ผ่าน auth.getUser() แล้ว จึงไม่ใช้ user_id จากฝั่ง client
  let classroomName: string | null = null;
  if (profile?.classroom_id) {
    const { data: classroom } = await supabase
      .from("classrooms")
      .select("name")
      .eq("id", profile.classroom_id)
      .single();
    classroomName = classroom?.name ?? null;
  }

  const fullName = profile?.full_name ?? "ชื่อ user";
  const avatarUrl = profile?.avatar_url ?? user?.user_metadata?.avatar_url ?? null;
  const studentNo = profile?.student_no ?? null;
  // โชว์ชื่อห้องเต็ม (ม.6/1) ถ้ามี ไม่งั้น fallback เป็น grade_level (ม.6)
  const gradeLevel = classroomName ?? profile?.grade_level ?? null;

  // ธีมสีการ์ดเก็บใน user_metadata (ต่อผู้ใช้) — อ่านค่าที่บันทึกไว้ ถ้าไม่มี/ไม่ถูกต้องใช้ "classic"
  const savedTheme = user.user_metadata?.card_theme;
  const initialTheme: ProfileCardTheme = CARD_THEMES.includes(savedTheme)
    ? savedTheme
    : "classic";

  return (
    <main className="relative h-full min-h-[660px] w-full overflow-hidden bg-cream px-[22px]">
      <section className="absolute left-[42px] right-[22px] top-[40px]">
        <h1 className="outlined-title whitespace-nowrap text-[62px] leading-none">
          <span className="outlined-title-pink">โปร</span>ไฟล์
        </h1>
      </section>

      <section className="absolute left-1/2 top-[107px] z-10 w-[304px] -translate-x-1/2">
        <ProfileCardCustomizer
          fullName={fullName}
          avatarUrl={avatarUrl}
          gradeLevel={gradeLevel}
          studentNo={studentNo}
          initialTheme={initialTheme}
        />

        <Image
          src="/mascot/star-sitting.png"
          alt="มาสคอตดาว"
          width={142}
          height={142}
          priority
          className="absolute -right-4 -top-[83px] z-30 h-[122px] w-[122px] object-contain"
        />
      </section>

      <section className="absolute left-1/2 top-[376px] z-20 w-[330px] -translate-x-1/2 rounded-[1rem] border-2 border-outline bg-paper px-[20px] py-[9px] shadow-[4px_5px_0_rgba(0,0,0,0.35)]">
        {menuItems.map((item) => (
          <MenuLink
            key={item.label}
            href={item.href}
            label={item.label}
            iconSrc={item.iconSrc}
          />
        ))}

        {isAdmin && (
          <Link
            href="/admin"
            className="flex h-[30px] items-center gap-[10px] text-[20px] font-normal leading-none"
          >
            <span className="flex h-[28px] w-[28px] flex-none items-center justify-center rounded-full bg-soft-yellow">
              <Settings className="h-[20px] w-[20px] stroke-[2.4]" />
            </span>
            <span className="flex-1 border-b border-dark-text/35 pb-[5px]">
              จัดการห้อง
            </span>
          </Link>
        )}

        <form action={signOut}>
          <button
            type="submit"
            className="flex h-[30px] w-full items-center gap-[10px] text-left text-[20px] font-normal leading-none"
          >
            <span className="flex h-[28px] w-[28px] flex-none items-center justify-center rounded-full bg-soft-yellow">
              <span
                aria-hidden
                className="h-[24px] w-[24px] bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/icons/profile-menu/logout.png')" }}
              />
            </span>
            <span className="flex-1 border-b border-dark-text/35 pb-[5px]">
              ออกจากระบบ
            </span>
          </button>
        </form>
      </section>

      <Image
        src="/doodles/profile-doodles.gif"
        alt="หนังสือ กาแฟ และดินสอ"
        width={356}
        height={200}
        unoptimized
        className="absolute left-1/2 top-[502px] h-auto w-[190px] -translate-x-1/2 object-contain"
      />
    </main>
  );
}

function MenuLink({
  href,
  label,
  iconSrc,
}: {
  href: string;
  label: string;
  iconSrc: string;
}) {
  return (
    <Link
      href={href}
      className="flex h-[30px] items-center gap-[10px] text-[20px] font-normal leading-none"
    >
      <span className="flex h-[28px] w-[28px] flex-none items-center justify-center rounded-full bg-soft-yellow">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconSrc}
          alt=""
          aria-hidden
          className="block h-[24px] w-[24px] object-contain"
        />
      </span>
      <span className="flex-1 border-b border-dark-text/35 pb-[5px]">{label}</span>
    </Link>
  );
}
