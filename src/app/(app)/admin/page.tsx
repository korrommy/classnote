import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminAssignmentForm } from "@/components/admin/AdminAssignmentForm";
import { AdminSubjectForm } from "@/components/admin/AdminSubjectForm";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/welcome");

  const { data: profile } = await supabase
    .from("profiles")
    .select("classroom_id, is_super_admin")
    .eq("id", user.id)
    .maybeSingle();

  const classroomId = profile?.classroom_id;
  if (!classroomId) redirect("/verify");

  // เฉพาะหัวหน้าห้อง (class_admin) ของห้องตัวเอง หรือ super_admin
  if (!profile?.is_super_admin) {
    const { data: membership } = await supabase
      .from("classroom_members")
      .select("role")
      .eq("classroom_id", classroomId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership?.role !== "class_admin") redirect("/profile");
  }

  const [{ data: classroom }, { data: subjects }] = await Promise.all([
    supabase
      .from("classrooms")
      .select("name, room")
      .eq("id", classroomId)
      .maybeSingle(),
    supabase
      .from("subjects")
      .select("id, name")
      .eq("classroom_id", classroomId)
      .order("created_at", { ascending: true })
      .limit(100),
  ]);

  return (
    <main className="flex w-full flex-col gap-5 px-[24px] pb-7 pt-[56px]">
      <div>
        <h1 className="outlined-title whitespace-nowrap text-[54px] leading-none">
          <span className="outlined-title-pink">จัดการ</span>ห้อง
        </h1>
        <span className="mt-3 inline-block rounded-full border-2 border-outline bg-soft-yellow px-3 py-1 text-[14px] leading-none">
          {classroom?.name ?? "ห้องเรียนของฉัน"}
          {classroom?.room ? ` · ห้อง ${classroom.room}` : ""}
        </span>
      </div>

      <section className="rounded-[1.25rem] border-2 border-outline bg-mint px-4 py-4 shadow-[4px_5px_0_rgba(0,0,0,0.25)]">
        <p className="mb-3 text-[20px] font-normal leading-none">เพิ่มงานใหม่</p>
        <AdminAssignmentForm subjects={subjects ?? []} />
      </section>

      <section className="rounded-[1.25rem] border-2 border-outline bg-lavender px-4 py-4 shadow-[4px_5px_0_rgba(0,0,0,0.25)]">
        <p className="mb-3 text-[20px] font-normal leading-none">เพิ่มวิชาใหม่</p>
        <AdminSubjectForm />
        {(subjects ?? []).length > 0 && (
          <p className="mt-3 text-[13px] font-normal leading-snug text-dark-text/65">
            วิชาในห้องตอนนี้: {(subjects ?? []).map((s) => s.name).join(", ")}
          </p>
        )}
      </section>
    </main>
  );
}
