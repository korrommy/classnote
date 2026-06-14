import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Mascot } from "@/components/ui/Mascot";
import { NoteCard, type NoteCardData } from "@/components/notes/NoteCard";
import { NotesSubjectCarousel } from "@/components/notes/NotesSubjectCarousel";
import { mergedSubjectBanners } from "@/lib/subjectImage";
import { resolveNoteCover } from "@/lib/notes/cover";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; q?: string }>;
}) {
  const { subject: subjectFilter, q: queryParam } = await searchParams;
  const queryText = (queryParam ?? "").trim();
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

  const [{ data: subjects }, notesRes] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name")
      .eq("classroom_id", classroomId)
      .order("created_at", { ascending: true }),
    (async () => {
      let request = supabase
        .from("notes")
        .select(
          "id, title, content, created_at, author:profiles!notes_author_id_fkey(full_name, avatar_url), subject:subjects(name), files:note_files(file_url, file_type)",
        )
        .eq("classroom_id", classroomId)
        // ฟีดห้องเรียนโชว์เฉพาะ classroom + both — โพสต์ public อย่างเดียวไม่ขึ้นที่นี่
        .in("visibility", ["classroom", "both"])
        .order("created_at", { ascending: false })
        .limit(100);

      if (subjectFilter) request = request.eq("subject_id", subjectFilter);
      if (queryText) {
        const escaped = queryText.replaceAll("%", "\\%").replaceAll("_", "\\_");
        request = request.or(`title.ilike.%${escaped}%,content.ilike.%${escaped}%`);
      }

      return request;
    })(),
  ]);

  // กัน bug เงียบ — ถ้า query โน้ตล้มเหลว (embedding/RLS/เครือข่าย) ให้เห็นใน log
  if (notesRes.error) {
    console.error("[NotesPage] notes query failed:", notesRes.error.message);
  }

  const notes: NoteCardData[] = await Promise.all(
    (notesRes.data ?? []).map(async (note) => {
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
  const banners = mergedSubjectBanners(subjects ?? []);

  return (
    <main className="flex h-full min-h-0 w-full flex-col gap-[27px] overflow-hidden px-[27px] pb-3 pt-[52px]">
      <form
        action="/notes"
        role="search"
        className="flex h-[40px] w-[285px] flex-none items-center gap-3 rounded-[0.85rem] border-[2.5px] border-outline bg-paper px-4 text-dark-text shadow-[7px_8px_0_#080808]"
      >
        <Search className="h-7 w-7 flex-none stroke-[2.4] text-outline" />
        <input
          name="q"
          defaultValue={queryText}
          placeholder="ค้นหาโน้ตที่ต้องการ..."
          className="min-w-0 flex-1 bg-transparent text-sm font-normal outline-none placeholder:text-dark-text/45"
        />
      </form>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.25rem] border-2 border-outline bg-mint px-4 pb-4 pt-5">
        <NotesSubjectCarousel
          banners={banners}
          activeSubjectId={subjectFilter}
          queryText={queryText}
        />

        {notes.length > 0 ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-20 flex-1 flex-col items-center justify-start gap-3 pt-[0px] text-center">
            <Mascot pose="reading" size={250} />
            <p className="text-sm font-normal text-dark-text/60">ยังไม่มีโน้ต</p>
            <Link
              href="/post"
              className="rounded-[0.9rem] border-[2.5px] border-outline bg-pink-accent px-4 py-2 text-sm font-normal shadow-brutal-sm"
            >
              เขียนโน้ตแรก
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
