import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PostForm } from "@/components/notes/PostForm";
import { Mascot } from "@/components/ui/Mascot";

export default async function CreatePostPage() {
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

  return (
    <main className="relative flex w-full flex-col gap-3 overflow-x-hidden px-5 pb-7 pt-6">
      <Link
        href="/post"
        className="inline-flex w-fit items-center gap-2 rounded-[0.75rem] border-[2.5px] border-outline bg-paper px-3 py-2 text-sm shadow-brutal-sm"
      >
        <ArrowLeft className="h-4 w-4 stroke-[3]" />
        กลับ
      </Link>

      <header className="relative min-h-[80px]">
        <h1 className="outlined-title text-[2.6rem] leading-none">
          <span className="outlined-title-pink">โพสต์</span>
          <span className="outlined-title-green">งาน</span>
        </h1>
        <Mascot
          pose="add"
          size={120}
          priority
          className="absolute right-[60px] -top-10"
        />
      </header>

      <PostForm subjects={subjects ?? []} />
    </main>
  );
}
