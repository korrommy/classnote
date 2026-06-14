"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  iconSrc: string;
};

const leftItems: NavItem[] = [
  { href: "/", label: "หน้าหลัก", iconSrc: "/icons/nav/home.png" },
  { href: "/notes", label: "โน้ต", iconSrc: "/icons/nav/write.png" },
];

const rightItems: NavItem[] = [
  { href: "/public", label: "สาธารณะ", iconSrc: "/icons/nav/members.png" },
  { href: "/profile", label: "โปรไฟล์", iconSrc: "/icons/nav/user.png" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      className="flex min-w-0 flex-1 cursor-pointer items-center justify-center py-1"
    >
      <span
        className={cn(
          "flex h-[48px] w-[48px] items-center justify-center rounded-full transition-all",
          active && "border-2 border-outline bg-soft-yellow shadow-[2px_3px_0_rgba(8,8,8,0.35)]",
        )}
      >
        <Image
          src={item.iconSrc}
          alt=""
          width={34}
          height={34}
          className={cn(
            "h-[34px] w-[34px] object-contain transition-transform",
            active && "scale-105",
          )}
        />
      </span>
      <span className="sr-only">{item.label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const postActive = pathname === "/post" || pathname.startsWith("/post/");

  return (
    <nav className="sticky bottom-0 z-30 mt-auto px-2 pb-2">
      <div className="relative mx-auto flex h-[74px] max-w-md items-stretch rounded-[1rem] border-[2.5px] border-outline bg-card px-3 shadow-brutal">
        {leftItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        <div className="flex w-[76px] flex-none items-center justify-center" />

        {rightItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        <Link
          href="/post"
          aria-label="เพิ่มโพสต์"
          className={cn(
            "absolute left-1/2 top-0 flex h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-[5px] border-pink-accent bg-paper text-sky-accent shadow-[0_0_0_3px_#080808,0_7px_0_#080808] transition-all active:translate-y-[calc(-50%+2px)] active:shadow-[0_0_0_3px_#080808,0_4px_0_#080808]",
            postActive && "bg-soft-yellow text-outline",
          )}
        >
          <Plus className="h-9 w-9 stroke-[2.5]" />
        </Link>
      </div>
    </nav>
  );
}
