"use client";

import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { Bookmark, Heart, MessageCircle } from "lucide-react";
import { toggleLike, toggleSave } from "@/lib/interactions/actions";

// แถบปุ่ม หัวใจ / คอมเมนต์ / บันทึก ที่ใช้ร่วมกันทุกการ์ดฟีด
// (NoteCard ใน /notes, /my-notes, /my-public-posts และ PublicPostCard ใน /public, /saved)
// เก็บ state แบบ optimistic ต่อการ์ด — แหล่งความจริงเดียว ไม่ทำซ้ำตรรกะในแต่ละฟีด
//
// กันนับซ้ำ (+2): server action ตั้งใจไม่ revalidate ฟีด เราจึง toggle ฝั่ง client
// ทีละครั้ง (มี pending guard) และ revert เฉพาะตอน error เท่านั้น
export function NoteActions({
  noteId,
  initialLiked,
  initialSaved,
  initialLikeCount,
}: {
  noteId: string;
  initialLiked: boolean;
  initialSaved: boolean;
  initialLikeCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [saved, setSaved] = useState(initialSaved);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [likePending, setLikePending] = useState(false);
  const [savePending, setSavePending] = useState(false);

  async function onLike(event: MouseEvent) {
    // การ์ดบางจุดถูกห่อด้วย Link — กันไม่ให้กดหัวใจแล้วเด้งเข้าหน้าโน้ต
    event.preventDefault();
    event.stopPropagation();
    if (likePending) return;
    setLikePending(true);

    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((count) => Math.max(0, count + (wasLiked ? -1 : 1)));

    try {
      const result = await toggleLike(noteId);
      if (!result.ok) throw new Error(result.error);
    } catch {
      // revert ทั้งสถานะและตัวเลขเมื่อ server ล้มเหลว
      setLiked(wasLiked);
      setLikeCount((count) => Math.max(0, count + (wasLiked ? 1 : -1)));
    } finally {
      setLikePending(false);
    }
  }

  async function onSave(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (savePending) return;
    setSavePending(true);

    const wasSaved = saved;
    setSaved(!wasSaved);

    try {
      const result = await toggleSave(noteId);
      if (!result.ok) throw new Error(result.error);
    } catch {
      setSaved(wasSaved);
    } finally {
      setSavePending(false);
    }
  }

  return (
    <div className="-mt-2 flex items-center justify-end gap-4 text-outline">
      <button
        type="button"
        onClick={onLike}
        aria-pressed={liked}
        aria-label={liked ? "เลิกถูกใจโน้ตนี้" : "ถูกใจโน้ตนี้"}
        title={liked ? "เลิกถูกใจ" : "ถูกใจ"}
        className="flex items-center gap-1 transition-transform active:scale-90"
      >
        {/* เส้นขอบดำตลอด (นีโอบรูทัล) — เติมสีชมพูเมื่อถูกใจ */}
        <Heart
          className="h-6 w-6 stroke-[2.4]"
          fill={liked ? "var(--color-hot-pink)" : "none"}
        />
        {likeCount > 0 && (
          <span className="text-sm font-normal text-dark-text/80">{likeCount}</span>
        )}
      </button>

      <Link
        href={`/notes/${noteId}`}
        aria-label="ดูความคิดเห็น"
        title="ความคิดเห็น"
        className="transition-transform active:scale-90"
      >
        <MessageCircle className="h-6 w-6 stroke-[2.4]" />
      </Link>

      <button
        type="button"
        onClick={onSave}
        aria-pressed={saved}
        aria-label={saved ? "เลิกบันทึกโน้ตนี้" : "บันทึกโน้ตนี้"}
        title={saved ? "เลิกบันทึก" : "บันทึก"}
        className="transition-transform active:scale-90"
      >
        {/* เส้นขอบดำตลอด — เติมสีเหลืองเมื่อบันทึก */}
        <Bookmark
          className="h-6 w-6 stroke-[2.4]"
          fill={saved ? "var(--color-yellow-accent)" : "none"}
        />
      </button>
    </div>
  );
}
