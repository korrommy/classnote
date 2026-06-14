import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type MemberRow = {
  role: string;
  profile: {
    full_name: string | null;
    student_no: string | null;
    grade_level: string | null;
    avatar_url: string | null;
  } | null;
};

export default async function MembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/welcome");

  const { data: profile } = await supabase
    .from("profiles")
    .select("classroom_id")
    .eq("id", user.id)
    .single();

  const classroomId = profile?.classroom_id;
  if (!classroomId) redirect("/verify");

  const { data: members } = await supabase
    .from("classroom_members")
    .select(
      "role, profile:profiles!classroom_members_user_id_fkey(full_name, student_no, grade_level, avatar_url)",
    )
    .eq("classroom_id", classroomId)
    .order("joined_at", { ascending: true })
    .limit(100);

  const rows = ((members ?? []) as MemberRow[]).map((member, index) => ({
    name: member.profile?.full_name || `เพื่อนคนที่ ${index + 1}`,
    number: member.profile?.student_no || "-",
    grade: member.profile?.grade_level || "นักเรียน",
    avatarUrl: member.profile?.avatar_url,
    role: member.role === "class_admin" ? "หัวหน้าห้อง" : "สมาชิก",
  }));

  return (
    <main className="relative h-full min-h-0 w-full overflow-hidden bg-cream px-[24px] pt-[64px]">
      <h1 className="outlined-title whitespace-nowrap text-[54px] leading-none">
        <span className="outlined-title-pink">เพื่อน</span>ในห้อง
      </h1>

      <section className="mt-5 h-[590px] rounded-[1.25rem] border-2 border-outline bg-[#cfe8f7] px-4 py-4 shadow-[4px_5px_0_rgba(0,0,0,0.25)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[22px] font-normal leading-none">สมาชิกในห้อง</p>
          <span className="rounded-full border-2 border-outline bg-soft-yellow px-3 py-1 text-[16px] leading-none">
            {rows.length} คน
          </span>
        </div>

        <div className="flex h-[520px] flex-col gap-3 overflow-y-auto pr-1">
          {rows.length > 0 ? (
            rows.map((member) => <MemberCard key={`${member.name}-${member.number}`} {...member} />)
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Image
                src="/mascot/star-duo.png"
                alt=""
                width={170}
                height={170}
                className="h-[150px] w-[150px] object-contain"
              />
              <p className="mt-3 text-[21px] font-normal leading-tight">
                ยังไม่พบรายชื่อเพื่อนในห้อง
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function MemberCard({
  name,
  number,
  grade,
  avatarUrl,
  role,
}: {
  name: string;
  number: string;
  grade: string;
  avatarUrl: string | null | undefined;
  role: string;
}) {
  return (
    <article className="flex h-[82px] items-center gap-3 rounded-[0.9rem] border-2 border-outline bg-paper px-3 shadow-[3px_4px_0_rgba(0,0,0,0.18)]">
      <div
        className="h-[54px] w-[54px] flex-none rounded-full border-2 border-outline bg-[#f5a0cf] bg-cover bg-center"
        style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[21px] font-normal leading-none">{name}</p>
        <p className="mt-1 text-[15px] font-normal leading-none text-dark-text/70">
          {grade} · เลขที่ {number}
        </p>
      </div>
      <span className="rounded-full border-2 border-outline bg-[#e7d9fb] px-2 py-1 text-[13px] leading-none">
        {role}
      </span>
    </article>
  );
}
