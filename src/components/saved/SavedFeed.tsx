"use client";

import Link from "next/link";
import { useState } from "react";
import { Mascot } from "@/components/ui/Mascot";
import { PublicPostCard, type PublicPost } from "@/components/public/PublicFeed";
import { toggleLike, toggleSave } from "@/lib/interactions/actions";

export function SavedFeed({ posts }: { posts: PublicPost[] }) {
  const [likedIds, setLikedIds] = useState<Set<string>>(
    () => new Set(posts.filter((post) => post.likedByMe).map((post) => post.id)),
  );
  // ทุกโพสต์ในหน้านี้ถูกบันทึกไว้แล้ว — ยกเลิกแล้วการ์ดยังอยู่จนกว่าจะ reload
  // เพื่อให้กดบันทึกกลับได้ (undo)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(
    () => new Set(posts.map((post) => post.id)),
  );
  const [likeDelta, setLikeDelta] = useState<Record<string, number>>({});
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  function setPending(id: string, pending: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleLike(id: string) {
    if (pendingIds.has(id)) return;
    setPending(id, true);

    const wasLiked = likedIds.has(id);
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(id);
      else next.add(id);
      return next;
    });
    setLikeDelta((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + (wasLiked ? -1 : 1) }));

    try {
      const result = await toggleLike(id);
      if (!result.ok) throw new Error(result.error);
    } catch {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(id);
        else next.delete(id);
        return next;
      });
      setLikeDelta((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + (wasLiked ? 1 : -1) }));
    } finally {
      setPending(id, false);
    }
  }

  async function handleBookmark(id: string) {
    if (pendingIds.has(id)) return;
    setPending(id, true);

    const wasSaved = bookmarkedIds.has(id);
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      const result = await toggleSave(id);
      if (!result.ok) throw new Error(result.error);
    } catch {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(id);
        else next.delete(id);
        return next;
      });
    } finally {
      setPending(id, false);
    }
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <Mascot pose="reading" size={200} />
        <p className="text-base font-normal text-dark-text/60">
          ยังไม่มีโพสต์ที่บันทึกไว้
        </p>
        <Link
          href="/public"
          className="rounded-[0.9rem] border-[2.5px] border-outline bg-pink-accent px-4 py-2 text-sm font-normal shadow-brutal-sm"
        >
          ไปดูโพสต์สาธารณะ
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[23px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {posts.map((post) => (
        <PublicPostCard
          key={post.id}
          post={post}
          liked={likedIds.has(post.id)}
          bookmarked={bookmarkedIds.has(post.id)}
          likeCount={Math.max(0, post.likeCount + (likeDelta[post.id] ?? 0))}
          onLike={() => handleLike(post.id)}
          onBookmark={() => handleBookmark(post.id)}
        />
      ))}
    </div>
  );
}
