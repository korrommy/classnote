# `/public` & `/saved` Document-Style Thumbnails — Design

**Date:** 2026-06-15
**Status:** Approved (pending spec review)

## Problem

On `/public`, every post card shows a blank cream square where a note
cover/preview should be. The same blank box appears on `/saved`, which
renders the identical card. Earlier work added a ClearNote-style cover
system to `/notes` and Home, but `/public` and `/saved` were never wired
into it.

### Root cause

`/public` is missing all four layers of the cover system that `/notes`
already has:

| Layer | `/notes` (works) | `/public` & `/saved` (broken) |
|---|---|---|
| Query `note_files` | `files:note_files(file_url, file_type)` | not selected |
| `resolveNoteCover()` | called per note in `Promise.all` | never called |
| Props on the type | `coverUrl`, `fileKind` on `NoteCardData` | absent from `PublicPost` |
| Cover render | `<NoteThumb>` | hardcoded `bg-cream` `<div>` |

The blank box is literally `PublicFeed.tsx`:
`<div className="aspect-square w-[76px] ... bg-cream" />`.

The uploaded file data **does exist** in `note_files` (the same rows
`/notes`, Home, and the detail page read successfully) — `/public` just
never queries it. The ClearNote-style placeholder also already exists as
the private `NoteThumb` function inside `NoteCard.tsx`; it just isn't
shared.

## Goals

- `/public` and `/saved` cards show a real document-style cover:
  - image attachment → the uploaded image (R2 signed URL)
  - PDF attachment → ruled-paper placeholder + small "PDF" badge
  - no attachment → soft ruled-paper placeholder
- Reuse the existing `/notes` cover system; one source of truth.
- Keep the cute pastel neobrutalism style.
- Likes / bookmarks / comments and card navigation keep working.

## Non-goals / constraints

- No database schema, RLS, or migration changes.
- Do not redesign the `/public` page; only the thumbnail content and the
  cover *data* feeding it change.
- R2 signed-URL generation stays server-side (bucket stays private).

## Decisions

1. **Extract & reuse `NoteThumb`** (vs duplicating markup) — single
   source of truth, identical look everywhere.
2. **Grow `/public` thumbnail from 76px to 96px** to match `/notes` for
   visual consistency. The existing `NoteThumb` placeholder typography
   (15px header bar, 8px PDF badge) is already tuned for 96px.

## Design

### New file — `src/components/notes/NoteThumb.tsx`

Move the existing private `NoteThumb` out of `NoteCard.tsx` into its own
client-safe presentational component. It is pure render — it receives the
already-resolved `coverUrl` / `fileKind` (plain serializable data) and has
no server-only imports — so both the server `NoteCard` and the client
`PublicPostCard` can import it.

- Props: `title`, `coverUrl?`, `fileKind?` (`NoteCoverKind`),
  `subjectName`, and a `size` prop (default `96`) controlling box width.
- Render behavior is unchanged from today:
  - `coverUrl` present → `background-image` cover, `role="img"` +
    `aria-label`.
  - else → `bg-paper` box with subject-colored header bar + faint ruled
    lines; if `fileKind === "pdf"`, a small "PDF" badge bottom-right;
    `aria-hidden`.
- `SUBJECT_COLORS` and `colorForSubject` move into `NoteThumb.tsx` and
  `colorForSubject` is exported; `NoteCard.tsx` imports it for its subject
  tag (it is used by both the thumb header bar and the tag).

### `src/components/notes/NoteCard.tsx`

- Remove the private `NoteThumb` definition; import it from the new file.
- Render `<NoteThumb size={96} ... />` (current size is `w-24` = 96px, so
  no visual change here).

### `src/components/public/PublicFeed.tsx`

- Add to `PublicPost` type: `coverUrl: string | null` and
  `fileKind: NoteCoverKind` (import the type from `@/lib/notes/cover`).
- In `PublicPostCard`, replace the hardcoded `bg-cream` div with:
  `<NoteThumb size={96} coverUrl={post.coverUrl} fileKind={post.fileKind}
  subjectName={post.subject} title={post.title} />`.
- `NoteActions`, the `<Link>` wrapper, and everything else untouched.

### `src/app/(app)/public/page.tsx`

- Add `files:note_files(file_url, file_type)` to the notes `select`.
- After fetching notes, build `posts` with `await Promise.all(...)`,
  calling `resolveNoteCover(note.files)` per note (the exact pattern
  `/notes` uses), and map `coverUrl` / `fileKind` onto each post.

### `src/app/(app)/saved/page.tsx`

- Add `files:note_files(file_url, file_type)` inside the embedded
  `note:notes(...)` select.
- Add `files` to the `JoinedNote` type.
- Resolve the cover per note (`Promise.all` + `resolveNoteCover`) and map
  `coverUrl` / `fileKind` onto each `PublicPost`.

## Components & data flow

```
note_files (DB)
  │  selected via files:note_files(file_url,file_type)
  ▼
resolveNoteCover(files)  [server-only, signs R2 url]
  │  → { coverUrl, kind }
  ▼
PublicPost { ..., coverUrl, fileKind }   (serializable props)
  ▼
PublicPostCard → <NoteThumb coverUrl fileKind subjectName title size=96 />
```

`NoteThumb` is a leaf presentational unit: given cover data it renders one
of three states. It depends on nothing but its props (and the static
`colorForSubject` palette). It can be understood and changed without
touching feeds, actions, or queries.

## Risks & mitigations

- **Breaking likes/bookmarks/navigation:** only the thumbnail child and
  upstream data change; `NoteActions` and `<Link>` are untouched. Low
  risk.
- **Extra latency from per-note signing:** `resolveNoteCover` already runs
  per note on `/notes`; `/public` caps at 30 notes, `/saved` at 50, and
  signing runs inside `Promise.all`. Acceptable, matches existing pages.
- **Client receives signed URLs:** same as today's avatar URLs; the URL is
  generated server-side and is short-lived (1h). No new exposure.

## Verification

- `npm run lint` clean.
- `npm run build` succeeds.
- Manual: image post shows image cover; PDF post shows PDF placeholder;
  no-attachment post shows soft placeholder; covers persist after refresh;
  heart/bookmark still toggle; card body opens detail; action icons do not
  navigate; `/saved` shows the same covers.

## Files

- New: `src/components/notes/NoteThumb.tsx`
- Edit: `src/components/notes/NoteCard.tsx`
- Edit: `src/components/public/PublicFeed.tsx`
- Edit: `src/app/(app)/public/page.tsx`
- Edit: `src/app/(app)/saved/page.tsx`
