"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/notes?q=${encodeURIComponent(trimmed)}` : "/notes");
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex h-[40px] w-full max-w-[282px] items-center gap-3 rounded-[0.85rem] border-[2.5px] border-outline bg-paper px-4 text-dark-text shadow-[4px_5px_0_#080808]"
    >
      <Search className="h-7 w-7 flex-none stroke-[2.5] text-outline" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="ค้นหาโน้ต วิชา หรือเพื่อน..."
        className="min-w-0 flex-1 bg-transparent text-sm font-normal outline-none placeholder:text-dark-text/45"
      />
    </form>
  );
}
