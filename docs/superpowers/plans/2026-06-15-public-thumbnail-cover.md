# `/public` & `/saved` Document-Style Thumbnails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/public` and `/saved` post cards show real document-style covers (image / PDF placeholder / soft placeholder) by reusing the existing `/notes` cover system.

**Architecture:** Extract the private `NoteThumb` from `NoteCard.tsx` into a shared, size-parameterized presentational component. Feed it cover data by adding `note_files` to the `/public` and `/saved` queries and resolving covers with the existing server-only `resolveNoteCover`. Only the thumbnail content and upstream cover data change; `NoteActions`, `<Link>` navigation, DB schema, and RLS are untouched.

**Tech Stack:** Next.js 16 (App Router, server components), TypeScript, Tailwind CSS v4, Supabase, lucide-react.

**Testing note:** No unit-test harness exists in this repo and this is presentational wiring, so each task is verified with `npm run lint` + `npm run build` (the same gate the existing cover system uses) and the manual checklist at the end.

---

### Task 1: Extract shared `NoteThumb` component

**Files:**
- Create: `src/components/notes/NoteThumb.tsx`

- [ ] **Step 1: Create the shared component**

Create `src/components/notes/NoteThumb.tsx` with this exact content. It is pure render (no hooks, no server-only imports), so it works inside both the server `NoteCard` and the client `PublicPostCard`. `colorForSubject` is exported because `NoteCard` also uses it for its subject tag. Width is driven by a `size` prop (default 96) via inline style so any size is supported without dynamic Tailwind classes.

```tsx
import type { NoteCoverKind } from "@/lib/notes/cover";

const SUBJECT_COLORS = [
  "bg-tag-blue",
  "bg-pink-accent",
  "bg-tag-purple",
  "bg-soft-yellow",
  "bg-aqua",
];

export function colorForSubject(subjectName: string | null) {
  if (!subjectName) return "bg-tag-blue";
  const seed = [...subjectName].reduce((total, char) => total + char.charCodeAt(0), 0);
  return SUBJECT_COLORS[seed % SUBJECT_COLORS.length];
}

// พื้นที่สี่เหลี่ยมหน้าปก: รูปจริง > placeholder PDF > placeholder อ่อน ๆ
// size = ความกว้าง (px) ของกล่องสี่เหลี่ยมจัตุรัส (ค่าเริ่มต้น 96 = w-24 เดิม)
export function NoteThumb({
  title,
  coverUrl,
  fileKind,
  subjectName,
  size = 96,
}: {
  title: string;
  coverUrl?: string | null;
  fileKind?: NoteCoverKind;
  subjectName: string | null;
  size?: number;
}) {
  const base =
    "aspect-square flex-none overflow-hidden rounded-[0.8rem] border-2 border-outline";
  const sizeStyle = { width: `${size}px` };

  if (coverUrl) {
    return (
      <span
        role="img"
        aria-label={`ภาพปกของ ${title}`}
        className={`${base} bg-cover bg-center`}
        style={{ ...sizeStyle, backgroundImage: `url(${coverUrl})` }}
      />
    );
  }

  // ไม่มีรูปจริง → ทำหน้าปกให้ดูเหมือน "หน้ากระดาษโน้ต": แถบสีหัวตามวิชา +
  // เส้นบรรทัดจาง ๆ บนพื้นกระดาษ (ถ้าเป็น PDF ติดป้าย "PDF" เล็ก ๆ มุมล่าง)
  return (
    <span
      aria-hidden
      className={`${base} relative flex flex-col bg-paper`}
      style={sizeStyle}
    >
      <span className={`h-[15px] w-full border-b border-outline/30 ${colorForSubject(subjectName)}`} />
      <span className="flex flex-1 flex-col justify-center gap-[6px] px-2.5">
        <span className="h-[3px] w-[85%] rounded-full bg-outline/15" />
        <span className="h-[3px] w-[65%] rounded-full bg-outline/15" />
        <span className="h-[3px] w-[90%] rounded-full bg-outline/15" />
        <span className="h-[3px] w-[55%] rounded-full bg-outline/15" />
      </span>
      {fileKind === "pdf" && (
        <span className="absolute bottom-1 right-1 rounded-[0.3rem] border border-outline bg-soft-yellow px-1 py-[1px] text-[8px] font-normal leading-none">
          PDF
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 2: Verify it compiles (nothing imports it yet)**

Run: `npm run lint`
Expected: PASS (no errors). The file is unused at this point — that is fine; later tasks import it.

- [ ] **Step 3: Commit**

```bash
git add src/components/notes/NoteThumb.tsx
git commit -m "Add shared NoteThumb cover component"
```

---

### Task 2: Point `NoteCard` at the shared `NoteThumb`

**Files:**
- Modify: `src/components/notes/NoteCard.tsx`

- [ ] **Step 1: Swap the imports**

In `src/components/notes/NoteCard.tsx`, the current top imports are:

```tsx
import Link from "next/link";
import { relativeThai } from "@/lib/time";
import type { NoteCoverKind } from "@/lib/notes/cover";
import { NoteActions } from "@/components/notes/NoteActions";
```

Add the shared-component import after the `NoteActions` import (keep the `NoteCoverKind` type import — `NoteCardData` still uses it):

```tsx
import Link from "next/link";
import { relativeThai } from "@/lib/time";
import type { NoteCoverKind } from "@/lib/notes/cover";
import { NoteActions } from "@/components/notes/NoteActions";
import { NoteThumb, colorForSubject } from "@/components/notes/NoteThumb";
```

- [ ] **Step 2: Delete the now-duplicated local definitions**

Delete the local `SUBJECT_COLORS` array, the local `colorForSubject` function, and the entire local `NoteThumb` function from `NoteCard.tsx`. Concretely, remove this whole block (everything from the `SUBJECT_COLORS` declaration through the end of the local `NoteThumb` function, i.e. the closing `}` right before `export function NoteCard`):

```tsx
const SUBJECT_COLORS = [
  "bg-tag-blue",
  "bg-pink-accent",
  "bg-tag-purple",
  "bg-soft-yellow",
  "bg-aqua",
];

function colorForSubject(subjectName: string | null) {
  if (!subjectName) return "bg-tag-blue";
  const seed = [...subjectName].reduce((total, char) => total + char.charCodeAt(0), 0);
  return SUBJECT_COLORS[seed % SUBJECT_COLORS.length];
}

// พื้นที่สี่เหลี่ยมหน้าปก: รูปจริง > placeholder PDF > placeholder อ่อน ๆ
function NoteThumb({
  title,
  coverUrl,
  fileKind,
  subjectName,
}: {
  title: string;
  coverUrl?: string | null;
  fileKind?: NoteCoverKind;
  subjectName: string | null;
}) {
  const base =
    "aspect-square w-24 flex-none overflow-hidden rounded-[0.8rem] border-2 border-outline";

  if (coverUrl) {
    return (
      <span
        role="img"
        aria-label={`ภาพปกของ ${title}`}
        className={`${base} bg-cover bg-center`}
        style={{ backgroundImage: `url(${coverUrl})` }}
      />
    );
  }

  return (
    <span aria-hidden className={`${base} relative flex flex-col bg-paper`}>
      <span className={`h-[15px] w-full border-b border-outline/30 ${colorForSubject(subjectName)}`} />
      <span className="flex flex-1 flex-col justify-center gap-[6px] px-2.5">
        <span className="h-[3px] w-[85%] rounded-full bg-outline/15" />
        <span className="h-[3px] w-[65%] rounded-full bg-outline/15" />
        <span className="h-[3px] w-[90%] rounded-full bg-outline/15" />
        <span className="h-[3px] w-[55%] rounded-full bg-outline/15" />
      </span>
      {fileKind === "pdf" && (
        <span className="absolute bottom-1 right-1 rounded-[0.3rem] border border-outline bg-soft-yellow px-1 py-[1px] text-[8px] font-normal leading-none">
          PDF
        </span>
      )}
    </span>
  );
}
```

Leave the `NoteCardData` type, the `NoteCard` function, and its existing JSX (which already calls `colorForSubject(note.subjectName)` for the subject tag and renders `<NoteThumb title=... coverUrl=... fileKind=... subjectName=... />` inside the `<Link>`) exactly as they are. `colorForSubject` and `NoteThumb` now resolve to the imported versions; the default `size={96}` matches the old `w-24`, so there is no visual change.

- [ ] **Step 3: Verify lint + build**

Run: `npm run lint`
Expected: PASS.

Run: `npm run build`
Expected: PASS — `/notes`, `/my-notes`, `/my-public-posts` compile.

- [ ] **Step 4: Commit**

```bash
git add src/components/notes/NoteCard.tsx
git commit -m "Use shared NoteThumb in NoteCard"
```

---

### Task 3: Wire covers into `/public` and `/saved`

This task lands as one commit so the build stays green: the `PublicPost` type gains two required fields and the same commit teaches both pages to supply them and the card to render them.

**Files:**
- Modify: `src/components/public/PublicFeed.tsx`
- Modify: `src/app/(app)/public/page.tsx`
- Modify: `src/app/(app)/saved/page.tsx`

- [ ] **Step 1: Add cover fields and render `NoteThumb` in `PublicFeed.tsx`**

At the top of `src/components/public/PublicFeed.tsx`, the current imports are:

```tsx
import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { NoteActions } from "@/components/notes/NoteActions";
```

Add the `NoteThumb` import and the `NoteCoverKind` type import:

```tsx
import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { NoteActions } from "@/components/notes/NoteActions";
import { NoteThumb } from "@/components/notes/NoteThumb";
import type { NoteCoverKind } from "@/lib/notes/cover";
```

In the `PublicPost` type, add `coverUrl` and `fileKind`. Change:

```tsx
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
```

to:

```tsx
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
  coverUrl: string | null;
  fileKind: NoteCoverKind;
};
```

In `PublicPostCard`, replace the hardcoded blank thumbnail. Change:

```tsx
          <div className="aspect-square w-[76px] flex-none rounded-[0.8rem] border-2 border-outline bg-cream" />
```

to:

```tsx
          <NoteThumb
            size={96}
            title={post.title}
            coverUrl={post.coverUrl}
            fileKind={post.fileKind}
            subjectName={post.subject}
          />
```

Leave the `SUBJECT_COLORS` / `subjectColor` helpers (used by the subject tag), the `<Link>` wrapper, and `<NoteActions>` unchanged.

- [ ] **Step 2: Add `note_files` + cover resolution in `public/page.tsx`**

In `src/app/(app)/public/page.tsx`, add the `resolveNoteCover` import after the existing imports:

```tsx
import { loadNoteInteractions } from "@/lib/interactions/feed";
import { resolveNoteCover } from "@/lib/notes/cover";
```

Add `files:note_files(file_url, file_type)` to the notes `select`. Change:

```tsx
    .select(
      "id, title, created_at, author:profiles!notes_author_id_fkey(full_name, avatar_url), subject:subjects(name)",
    )
```

to:

```tsx
    .select(
      "id, title, created_at, author:profiles!notes_author_id_fkey(full_name, avatar_url), subject:subjects(name), files:note_files(file_url, file_type)",
    )
```

Replace the synchronous `posts` mapping with an async one that resolves the cover per note. Change:

```tsx
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
```

to:

```tsx
  const posts: PublicPost[] = await Promise.all(
    (notes ?? []).map(async (note) => {
      const author = Array.isArray(note.author) ? note.author[0] : note.author;
      const subject = Array.isArray(note.subject) ? note.subject[0] : note.subject;
      const cover = await resolveNoteCover(note.files);

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
        coverUrl: cover.coverUrl,
        fileKind: cover.kind,
      };
    }),
  );
```

- [ ] **Step 3: Add `note_files` + cover resolution in `saved/page.tsx`**

In `src/app/(app)/saved/page.tsx`, add the `resolveNoteCover` import after the existing imports:

```tsx
import { loadNoteInteractions } from "@/lib/interactions/feed";
import { resolveNoteCover } from "@/lib/notes/cover";
```

Add `files:note_files(file_url, file_type)` inside the embedded `note:notes(...)` select. Change:

```tsx
    .select(
      "created_at, note:notes(id, title, created_at, author:profiles!notes_author_id_fkey(full_name, avatar_url), subject:subjects(name))",
    )
```

to:

```tsx
    .select(
      "created_at, note:notes(id, title, created_at, author:profiles!notes_author_id_fkey(full_name, avatar_url), subject:subjects(name), files:note_files(file_url, file_type))",
    )
```

Add `files` to the `JoinedNote` type so the resolved relation is accessible. Change:

```tsx
  type JoinedNote = {
    id: string;
    title: string;
    created_at: string;
    author: { full_name?: string | null; avatar_url?: string | null } | null;
    subject: { name?: string } | null;
  };
```

to:

```tsx
  type JoinedNote = {
    id: string;
    title: string;
    created_at: string;
    author: { full_name?: string | null; avatar_url?: string | null } | null;
    subject: { name?: string } | null;
    files: unknown;
  };
```

Replace the synchronous `posts` mapping with an async one. Change:

```tsx
  const posts: PublicPost[] = notes.map((note) => ({
    id: note.id,
    title: note.title,
    subject: note.subject?.name ?? null,
    authorName: note.author?.full_name ?? "ผู้ใช้",
    authorAvatarUrl: note.author?.avatar_url ?? null,
    timeAgo: relativeThai(note.created_at),
    likeCount: likeCounts.get(note.id) ?? 0,
    likedByMe: likedByMe.has(note.id),
    savedByMe: true,
  }));
```

to:

```tsx
  const posts: PublicPost[] = await Promise.all(
    notes.map(async (note) => {
      const cover = await resolveNoteCover(note.files);
      return {
        id: note.id,
        title: note.title,
        subject: note.subject?.name ?? null,
        authorName: note.author?.full_name ?? "ผู้ใช้",
        authorAvatarUrl: note.author?.avatar_url ?? null,
        timeAgo: relativeThai(note.created_at),
        likeCount: likeCounts.get(note.id) ?? 0,
        likedByMe: likedByMe.has(note.id),
        savedByMe: true,
        coverUrl: cover.coverUrl,
        fileKind: cover.kind,
      };
    }),
  );
```

> Note: the existing line `return { ...note, author, subject } as JoinedNote;` already spreads the query's `files` field through, so no change is needed there beyond the type addition above.

- [ ] **Step 4: Verify lint + build**

Run: `npm run lint`
Expected: PASS.

Run: `npm run build`
Expected: PASS — all routes compile, including `/public` and `/saved`.

- [ ] **Step 5: Commit**

```bash
git add src/components/public/PublicFeed.tsx "src/app/(app)/public/page.tsx" "src/app/(app)/saved/page.tsx"
git commit -m "Show document-style covers on /public and /saved cards"
```

---

### Task 4: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: PASS, no warnings.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Manual checklist** (dev server: `npm run dev`, then log in)

- [ ] Public post with an image attachment → `/public` card shows the image cover.
- [ ] Public post with a PDF attachment → `/public` card shows the ruled-paper placeholder with the "PDF" badge.
- [ ] Public post with no attachment → `/public` card shows the soft ruled-paper placeholder (not a blank box).
- [ ] Refresh `/public` → covers still render.
- [ ] Tap heart → turns pink, count updates by 1.
- [ ] Tap bookmark → turns yellow, persists after refresh.
- [ ] Tap card body → opens the note detail page.
- [ ] Tap heart/bookmark → does NOT open the note detail page.
- [ ] `/saved` shows the same document-style covers.

---

## Notes for the implementer

- **`note.files` typing:** the hand-written `Database` type does not declare the `note_files` relationship, so Supabase types `note.files` loosely. `resolveNoteCover(files: unknown)` accepts this on purpose (it narrows internally with a type guard). `/notes/page.tsx` already passes `note.files` to `resolveNoteCover` and builds cleanly — `/public` and `/saved` follow the identical pattern.
- **Subject-color mismatch is intentional:** on `/public` the subject *tag* uses `subjectColor` (keyed by Thai subject name) while the `NoteThumb` header bar uses the hash-based `colorForSubject`. This mirrors nothing-breaking and is out of scope to unify (do not redesign the page).
- **Privacy:** `resolveNoteCover` signs R2 URLs server-side (1h expiry). The client only ever receives a short-lived signed URL as a prop, the same as the existing avatar URLs. No schema/RLS/migration change.
