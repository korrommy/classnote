"use client";

import Link from "next/link";
import { Mascot } from "@/components/ui/Mascot";
import { PublicPostCard, type PublicPost } from "@/components/public/PublicFeed";

export function SavedFeed({ posts }: { posts: PublicPost[] }) {
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

  // การ์ดแต่ละใบจัดการสถานะ like/save ของตัวเองผ่าน NoteActions —
  // ยกเลิกบันทึกแล้วการ์ดยังอยู่จนกว่าจะ reload เพื่อให้กดบันทึกกลับได้ (undo)
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[23px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {posts.map((post) => (
        <PublicPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
