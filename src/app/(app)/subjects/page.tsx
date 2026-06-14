import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { mergedSubjectBanners } from "@/lib/subjectImage";

export default async function SubjectsPage() {
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

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("classroom_id", classroomId)
    .order("created_at", { ascending: true })
    .limit(50);

  const banners = mergedSubjectBanners(subjects ?? []);

  return (
    <main className="flex w-full flex-col gap-5 overflow-x-hidden px-5 pb-7 pt-10">
      <h1 className="outlined-title text-5xl font-black leading-none">
        <span className="outlined-title-blue">วิชา</span>ทั้งหมด
      </h1>

      <section className="rounded-[1.25rem] border-[2.5px] border-outline bg-mint p-4 shadow-[3px_3px_0_#080808]">
        <div className="grid grid-cols-2 gap-4">
          {banners.map((banner) => (
            <Link
              key={banner.name}
              href={banner.id ? `/notes?subject=${banner.id}` : "/subjects"}
              className="overflow-hidden rounded-[0.75rem] border-[2.5px] border-outline bg-paper shadow-soft-drop transition-all active:translate-x-0.5 active:translate-y-0.5"
            >
              <Image
                src={banner.src}
                alt={banner.name}
                width={300}
                height={220}
                className="aspect-[4/3] w-full object-cover"
              />
              <p className="flex min-h-12 items-center gap-2 px-3 py-2 text-base font-black leading-tight">
                <BookOpen className="h-5 w-5 flex-none stroke-[3]" />
                <span className="min-w-0 break-words">{banner.name}</span>
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
