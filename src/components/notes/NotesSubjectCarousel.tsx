"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { SubjectBanner } from "@/lib/subjectImage";

function hrefForSubject(id: string | null | undefined, queryText: string) {
  const query = queryText ? `q=${encodeURIComponent(queryText)}` : "";
  if (!id) return query ? `/notes?${query}` : "/notes";

  const params = new URLSearchParams();
  params.set("subject", id);
  if (queryText) params.set("q", queryText);
  return `/notes?${params.toString()}`;
}

export function NotesSubjectCarousel({
  banners,
  activeSubjectId,
  queryText,
}: {
  banners: SubjectBanner[];
  activeSubjectId?: string;
  queryText: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    const handleWheel = (event: WheelEvent) => {
      if (scroller.scrollWidth <= scroller.clientWidth) return;
      const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      scroller.scrollLeft += delta;
      event.preventDefault();
    };

    scroller.addEventListener("wheel", handleWheel, { passive: false });
    return () => scroller.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div className="mb-7 flex-none">
      <div
        ref={scrollRef}
        aria-label="ตัวกรองวิชา"
        className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Link
          href={hrefForSubject(null, queryText)}
          className={`flex h-10 w-[86px] flex-none snap-start items-center justify-center rounded-[0.5rem] border-2 border-outline px-2 text-xs font-normal shadow-[2px_2px_0_#080808] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
            !activeSubjectId ? "bg-soft-yellow" : "bg-card"
          }`}
        >
          ดูทั้งหมด
        </Link>

        {banners.map((banner) => (
          <Link
            key={banner.name}
            href={hrefForSubject(banner.id, queryText)}
            className={`flex h-10 w-[100px] flex-none snap-start items-center justify-center overflow-hidden rounded-[0.5rem] border-2 border-outline bg-paper shadow-[2px_2px_0_#080808] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
              activeSubjectId === banner.id ? "ring-2 ring-pink-accent ring-offset-2 ring-offset-mint" : ""
            }`}
          >
            <Image
              src={banner.src}
              alt={banner.name}
              width={272}
              height={80}
              className="h-full w-full scale-[2] object-contain"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
