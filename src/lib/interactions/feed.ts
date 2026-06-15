import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type NoteInteractions = {
  likeCounts: Map<string, number>;
  likedByMe: Set<string>;
  savedByMe: Set<string>;
};

const EMPTY: NoteInteractions = {
  likeCounts: new Map(),
  likedByMe: new Set(),
  savedByMe: new Set(),
};

// โหลดสถานะ like/save ของชุดโน้ตในครั้งเดียว เพื่อให้ทุกฟีด
// (/notes, /public, /saved, /my-notes, /my-public-posts) แมป isLiked/isSaved/likeCount
// ด้วยตรรกะเดียวกัน — ไม่ทำซ้ำในแต่ละหน้า
//
// RLS: likes_select คืนเฉพาะ like ของโน้ตที่ผู้ใช้เข้าถึงได้,
// saves_select_own คืนเฉพาะ bookmark ของตัวเอง — ความเป็นส่วนตัวจึงคงอยู่
export async function loadNoteInteractions(
  supabase: ServerClient,
  userId: string,
  noteIds: string[],
): Promise<NoteInteractions> {
  if (noteIds.length === 0) return EMPTY;

  const [likesRes, savesRes] = await Promise.all([
    supabase.from("note_likes").select("note_id, user_id").in("note_id", noteIds),
    supabase
      .from("saved_notes")
      .select("note_id")
      .eq("user_id", userId)
      .in("note_id", noteIds),
  ]);

  const likeCounts = new Map<string, number>();
  const likedByMe = new Set<string>();
  for (const like of likesRes.data ?? []) {
    likeCounts.set(like.note_id, (likeCounts.get(like.note_id) ?? 0) + 1);
    if (like.user_id === userId) likedByMe.add(like.note_id);
  }
  const savedByMe = new Set((savesRes.data ?? []).map((save) => save.note_id));

  return { likeCounts, likedByMe, savedByMe };
}
