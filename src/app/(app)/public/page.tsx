import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { relativeThai } from "@/lib/time";
import { PublicFeed, type PublicPost } from "@/components/public/PublicFeed";

export default async function PublicPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/welcome");

  const { data: notes, error: notesError } = await supabase
    .from("notes")
    .select(
      "id, title, created_at, author:profiles!notes_author_id_fkey(full_name, avatar_url), subject:subjects(name)",
    )
    .in("visibility", ["public", "both"])
    .order("created_at", { ascending: false })
    .limit(30);

  // กัน bug เงียบ — ถ้า query โน้ตสาธารณะล้มเหลว ให้เห็นใน log ทันที
  if (notesError) {
    console.error("[PublicPage] notes query failed:", notesError.message);
  }

  const noteIds = (notes ?? []).map((note) => note.id);

  const [likesRes, savesRes] = noteIds.length
    ? await Promise.all([
        supabase.from("note_likes").select("note_id, user_id").in("note_id", noteIds),
        supabase
          .from("saved_notes")
          .select("note_id")
          .eq("user_id", user.id)
          .in("note_id", noteIds),
      ])
    : [{ data: [] }, { data: [] }];

  const likeCounts = new Map<string, number>();
  const likedByMe = new Set<string>();
  for (const like of likesRes.data ?? []) {
    likeCounts.set(like.note_id, (likeCounts.get(like.note_id) ?? 0) + 1);
    if (like.user_id === user.id) likedByMe.add(like.note_id);
  }
  const savedByMe = new Set((savesRes.data ?? []).map((save) => save.note_id));

  const posts: PublicPost[] = (notes ?? []).map((note) => {
    const author = Array.isArray(note.author) ? note.author[0] : note.author;
    const subject = Array.isArray(note.subject) ? note.subject[0] : note.subject;

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
    };
  });

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
