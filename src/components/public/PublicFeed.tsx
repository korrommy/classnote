"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { NoteActions } from "@/components/notes/NoteActions";

export type PublicPost = {
  id: string;
  title: string;
  subject: string | null;
  authorName: string;
  authorAvatarUrl?: string | null;
  timeAgo: string;
  likeCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
};

const SUBJECT_COLORS: Record<string, string> = {
  คณิตศาสตร์: "bg-tag-blue",
  ชีววิทยา: "bg-green-accent",
  ฟิสิกส์: "bg-lavender",
  ภาษาอังกฤษ: "bg-pink-accent",
  สังคมศึกษา: "bg-soft-yellow",
};

function subjectColor(name: string): string {
  return SUBJECT_COLORS[name] ?? "bg-tag-blue";
}

export function PublicFeed({ posts }: { posts: PublicPost[] }) {
  const [query, setQuery] = useState("");

  const filtered = posts.filter(
    (post) =>
      !query ||
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      (post.subject ?? "").toLowerCase().includes(query.toLowerCase()) ||
      post.authorName.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <div className="mt-[10px] flex h-[40px] w-[238px] flex-none items-center gap-3 rounded-[0.85rem] border-[2.5px] border-outline bg-paper px-4 text-dark-text shadow-[7px_8px_0_#080808]">
        <Search className="h-7 w-7 flex-none stroke-[2.4] text-outline" aria-hidden />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ค้นหาโน้ต วิชา หรือเพื่อน..."
          className="min-w-0 flex-1 bg-transparent text-[16px] font-normal outline-none placeholder:text-dark-text/45"
        />
      </div>

      <section className="ml-[3px] mt-[22px] flex min-h-0 w-[342px] flex-1 flex-col overflow-hidden rounded-[1.25rem] border-2 border-outline bg-hot-pink px-[25px] pb-4 pt-[24px]">
        <div className="flex min-h-0 flex-1 flex-col gap-[23px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filtered.length === 0 ? (
            <EmptyPublicState hasQuery={Boolean(query.trim())} />
          ) : (
            filtered.map((post) => <PublicPostCard key={post.id} post={post} />)
          )}
        </div>
      </section>
    </>
  );
}

function EmptyPublicState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-[1rem] border-2 border-dashed border-outline/45 bg-paper/55 px-5 text-center">
      <p className="text-[22px] font-normal leading-tight text-dark-text">
        {hasQuery ? "ไม่พบโพสต์ที่ค้นหา" : "ยังไม่มีโพสต์สาธารณะ"}
      </p>
      <p className="mt-2 text-[15px] font-normal leading-snug text-dark-text/60">
        เมื่อมีคนโพสต์สาธารณะ การ์ดจะขึ้นในหน้านี้
      </p>
    </div>
  );
}

export function PublicPostCard({ post }: { post: PublicPost }) {
  return (
    <article className="flex-none rounded-[1.25rem] border-[2.5px] border-outline bg-paper p-3 shadow-soft-drop">
      <Link href={`/notes/${post.id}`} className="block">
        <div className="flex gap-3">
          <div className="aspect-square w-[76px] flex-none rounded-[0.8rem] border-2 border-outline bg-cream" />
          <div className="min-w-0 flex-1">
            {post.subject && (
              <span
                className={`inline-block rounded-[0.45rem] border-2 border-outline px-3 py-0.5 text-xs font-normal ${subjectColor(post.subject)}`}
              >
                {post.subject}
              </span>
            )}
            <h3 className="mt-1 truncate text-xl font-normal leading-tight">
              {post.title}
            </h3>
            <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm font-normal text-dark-text/75">
              <span
                className="inline-block h-4 w-4 flex-none rounded-full border border-outline/25 bg-[#d8cfbf] bg-cover bg-center"
                style={post.authorAvatarUrl ? { backgroundImage: `url(${post.authorAvatarUrl})` } : undefined}
                aria-hidden
              />
              <span className="min-w-0 truncate">โดย {post.authorName}</span>
            </p>
            <p className="text-sm font-normal text-dark-text/80">{post.timeAgo}</p>
          </div>
        </div>
      </Link>
      <NoteActions
        noteId={post.id}
        initialLiked={post.likedByMe}
        initialSaved={post.savedByMe}
        initialLikeCount={post.likeCount}
      />
    </article>
  );
}
