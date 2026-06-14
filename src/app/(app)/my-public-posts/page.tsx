import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Mascot } from "@/components/ui/Mascot";
import { NoteCard, type NoteCardData } from "@/components/notes/NoteCard";
import { resolveNoteCover } from "@/lib/notes/cover";

export default async function MyPublicPostsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/welcome");

  // ประวัติ "โพสต์สาธารณะของฉัน" — เฉพาะโพสต์ที่ฉันสร้างเอง และเป็น public/both
  // author_id มาจาก auth.getUser() ฝั่ง server (ไม่เชื่อ id จาก client)
  // ต่างจาก /public ที่โชว์โพสต์สาธารณะของ "ทุกคน"
  const { data: notesData, error: notesError } = await supabase
    .from("notes")
    .select(
      "id, title, created_at, author:profiles!notes_author_id_fkey(full_name, avatar_url), subject:subjects(name), files:note_files(file_url, file_type)",
    )
    .eq("author_id", user.id)
    .in("visibility", ["public", "both"])
    .order("created_at", { ascending: false })
    .limit(100);

  if (notesError) {
    console.error("[MyPublicPostsPage] notes query failed:", notesError.message);
  }

  const notes: NoteCardData[] = await Promise.all(
    (notesData ?? []).map(async (note) => {
      const author = Array.isArray(note.author) ? note.author[0] : note.author;
      const subject = Array.isArray(note.subject) ? note.subject[0] : note.subject;
      const cover = await resolveNoteCover(note.files);

      return {
        id: note.id,
        title: note.title,
        created_at: note.created_at,
        authorName:
          (author as { full_name?: string } | null)?.full_name ?? "ไม่ระบุ",
        subjectName: (subject as { name?: string } | null)?.name ?? null,
        avatarUrl:
          (author as { avatar_url?: string | null } | null)?.avatar_url ?? null,
        coverUrl: cover.coverUrl,
        fileKind: cover.kind,
      };
    }),
  );

  return (
    <main className="flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden px-[27px] pb-3 pt-[42px]">
      <Link
        href="/profile"
        className="inline-flex w-fit flex-none items-center gap-2 rounded-[0.75rem] border-[2.5px] border-outline bg-paper px-3 py-2 text-sm font-normal shadow-brutal-sm"
      >
        <ArrowLeft className="h-4 w-4 stroke-[3]" />
        กลับ
      </Link>

      <h1 className="outlined-title flex-none max-w-full break-words text-[2.4rem] leading-tight">
        <span className="outlined-title-pink">โพสต์สาธารณะ</span>ของฉัน
      </h1>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.25rem] border-2 border-outline bg-mint px-4 pb-4 pt-5">
        {notes.length > 0 ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-20 flex-1 flex-col items-center justify-start gap-3 pt-2 text-center">
            <Mascot pose="reading" size={220} />
            <p className="text-sm font-normal text-dark-text/60">
              คุณยังไม่มีโพสต์สาธารณะ
            </p>
            <Link
              href="/post"
              className="rounded-[0.9rem] border-[2.5px] border-outline bg-pink-accent px-4 py-2 text-sm font-normal shadow-brutal-sm"
            >
              สร้างโพสต์สาธารณะ
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
