import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { relativeThai } from "@/lib/time";
import { PublicFeed, type PublicPost } from "@/components/public/PublicFeed";
import { loadNoteInteractions } from "@/lib/interactions/feed";
import { resolveNoteCover } from "@/lib/notes/cover";

export default async function PublicPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/welcome");

  const { data: notes, error: notesError } = await supabase
    .from("notes")
    .select(
      "id, title, created_at, author:profiles!notes_author_id_fkey(full_name, avatar_url), subject:subjects(name), files:note_files(file_url, file_type)",
    )
    .in("visibility", ["public", "both"])
    .order("created_at", { ascending: false })
    .limit(30);

  // กัน bug เงียบ — ถ้า query โน้ตสาธารณะล้มเหลว ให้เห็นใน log ทันที
  if (notesError) {
    console.error("[PublicPage] notes query failed:", notesError.message);
  }

  const { likeCounts, likedByMe, savedByMe } = await loadNoteInteractions(
    supabase,
    user.id,
    (notes ?? []).map((note) => note.id),
  );

  const posts: PublicPost[] = await Promise.all(
    (notes ?? []).map(async (note) => {
      const author = Array.isArray(note.author) ? note.author[0] : note.author;
      const subject = Array.isArray(note.subject) ? note.subject[0] : note.subject;
      const cover = await resolveNoteCover(note.files);

      return {
        id: note.id,
        title: note.title,
        subject: (subject as { name?: string } | null)?.name ?? null,
        authorName:
          (author as { full_name?: string | null } | null)?.full_name ?? "ผู้ใช้",
        authorAvatarUrl:
          (author as { avatar_url?: string | null } | null)?.avatar_url ?? null,
        timeAgo: relativeThai(note.created_at),
        likeCount: likeCounts.get(note.id) ?? 0,
        likedByMe: likedByMe.has(note.id),
        savedByMe: savedByMe.has(note.id),
        coverUrl: cover.coverUrl,
        fileKind: cover.kind,
      };
    }),
  );

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden px-[18px] pb-3 pt-[31px]">
      <section className="relative h-[86px] w-[255px] flex-none overflow-hidden rounded-[0.95rem] border-2 border-outline bg-[#48b8b4] shadow-[3px_4px_0_rgba(8,8,8,0.45)]">
        <Image
          src="/banner/public-banner.png"
          alt="Share your notes for public"
          fill
          priority
          sizes="255px"
          className="object-cover object-left"
        />
      </section>

      <PublicFeed posts={posts} />
    </main>
  );
}
