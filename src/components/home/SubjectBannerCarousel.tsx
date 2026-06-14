"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";
import type { SubjectBanner } from "@/lib/subjectImage";

export function SubjectBannerCarousel({ banners }: { banners: SubjectBanner[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);
  const dragDistance = useRef(0);
  const isPointerDown = useRef(false);

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

    return () => {
      scroller.removeEventListener("wheel", handleWheel);
    };
  }, []);

  function scrollByCard(direction: "left" | "right") {
    scrollRef.current?.scrollBy({
      left: direction === "right" ? 156 : -156,
      behavior: "smooth",
    });
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        aria-label="รายการ banner วิชา"
        className="-mx-1 flex cursor-grab snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-1 pb-2 active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onPointerDown={(event) => {
          const scroller = scrollRef.current;
          if (!scroller) return;

          isPointerDown.current = true;
          dragDistance.current = 0;
          dragStartX.current = event.clientX;
          dragStartScrollLeft.current = scroller.scrollLeft;
          scroller.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const scroller = scrollRef.current;
          if (!scroller || !isPointerDown.current) return;

          const distance = event.clientX - dragStartX.current;
          dragDistance.current = Math.max(dragDistance.current, Math.abs(distance));
          scroller.scrollLeft = dragStartScrollLeft.current - distance;
          event.preventDefault();
        }}
        onPointerUp={(event) => {
          isPointerDown.current = false;
          scrollRef.current?.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          isPointerDown.current = false;
        }}
      >
        {banners.map((banner) => (
          <Link
            key={banner.name}
            href={banner.id ? `/notes?subject=${banner.id}` : "/subjects"}
            draggable={false}
            onClick={(event) => {
              if (dragDistance.current > 8) event.preventDefault();
            }}
            className="group flex h-[82px] w-[146px] flex-none snap-start cursor-grab select-none items-center justify-center overflow-hidden rounded-[0.55rem] border-[2.5px] border-outline bg-paper shadow-[3px_5px_0_rgba(8,8,8,0.22)] transition-transform focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-outline active:cursor-grabbing active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <Image
              src={banner.src}
              alt={banner.name}
              width={320}
              height={180}
              draggable={false}
              className="h-full w-full object-cover object-center transition-transform duration-200 group-hover:scale-[1.03]"
            />
          </Link>
        ))}
      </div>

      <button
        type="button"
        aria-label="เลื่อนไปทางซ้าย"
        onClick={() => scrollByCard("left")}
        className="absolute -left-1.5 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[0.45rem] border-2 border-outline bg-paper shadow-[2px_2px_0_#080808] transition-transform active:translate-x-0.5 active:translate-y-[calc(-50%+2px)] active:shadow-none"
      >
        <ChevronLeft className="h-4 w-4 stroke-[3]" />
      </button>
      <button
        type="button"
        aria-label="เลื่อนไปทางขวา"
        onClick={() => scrollByCard("right")}
        className="absolute -right-1.5 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[0.45rem] border-2 border-outline bg-paper shadow-[2px_2px_0_#080808] transition-transform active:translate-x-0.5 active:translate-y-[calc(-50%+2px)] active:shadow-none"
      >
        <ChevronRight className="h-4 w-4 stroke-[3]" />
      </button>
    </div>
  );
}
