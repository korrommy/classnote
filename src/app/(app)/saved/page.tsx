import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { relativeThai } from "@/lib/time";
import type { PublicPost } from "@/components/public/PublicFeed";
import { SavedFeed } from "@/components/saved/SavedFeed";
import { loadNoteInteractions } from "@/lib/interactions/feed";
import { resolveNoteCover } from "@/lib/notes/cover";

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/welcome");

  const { data: saves, error: savesError } = await supabase
    .from("saved_notes")
    .select(
      "created_at, note:notes(id, title, created_at, author:profiles!notes_author_id_fkey(full_name, avatar_url), subject:subjects(name), files:note_files(file_url, file_type))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // กัน bug เงียบ — ถ้า query โพสต์ที่บันทึกล้มเหลว ให้เห็นใน log ทันที
  if (savesError) {
    console.error("[SavedPage] saved_notes query failed:", savesError.message);
  }

  type JoinedNote = {
    id: string;
    title: string;
    created_at: string;
    author: { full_name?: string | null; avatar_url?: string | null } | null;
    subject: { name?: string } | null;
    files: unknown;
  };

  // โน้ตที่เข้าถึงไม่ได้แล้ว (เช่น เปลี่ยน visibility) RLS จะคืน null — กรองทิ้ง
  const notes = (saves ?? [])
    .map((save) => {
      const note = Array.isArray(save.note) ? save.note[0] : save.note;
      if (!note) return null;
      const author = Array.isArray(note.author) ? note.author[0] : note.author;
      const subject = Array.isArray(note.subject) ? note.subject[0] : note.subject;
      return { ...note, author, subject } as JoinedNote;
    })
    .filter((note): note is JoinedNote => note !== null);

  const { likeCounts, likedByMe } = await loadNoteInteractions(
    supabase,
    user.id,
    notes.map((note) => note.id),
  );

  const posts: PublicPost[] = await Promise.all(
    notes.map(async (note) => {
      const cover = await resolveNoteCover(note.files);
      return {
        id: note.id,
        title: note.title,
        subject: note.subject?.name ?? null,
        authorName: note.author?.full_name ?? "ผู้ใช้",
        authorAvatarUrl: note.author?.avatar_url ?? null,
        timeAgo: relativeThai(note.created_at),
        likeCount: likeCounts.get(note.id) ?? 0,
        likedByMe: likedByMe.has(note.id),
        savedByMe: true,
        coverUrl: cover.coverUrl,
        fileKind: cover.kind,
      };
    }),
  );

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden px-[24px] pb-3 pt-[64px]">
      <h1 className="outlined-title whitespace-nowrap text-[54px] leading-none">
        <span className="outlined-title-pink">โพสต์</span>ที่บันทึก
      </h1>

      <section className="mt-[20px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.25rem] border-2 border-outline bg-lavender px-[20px] pb-4 pt-[20px]">
        <SavedFeed posts={posts} />
      </section>
    </main>
  );
}
