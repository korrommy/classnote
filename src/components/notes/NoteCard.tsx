import Link from "next/link";
import { relativeThai } from "@/lib/time";
import type { NoteCoverKind } from "@/lib/notes/cover";
import { NoteActions } from "@/components/notes/NoteActions";
import { NoteThumb, colorForSubject } from "@/components/notes/NoteThumb";

export type NoteCardData = {
  id: string;
  title: string;
  created_at: string;
  authorName: string;
  subjectName: string | null;
  classroomName?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  fileKind?: NoteCoverKind;
  isLiked: boolean;
  isSaved: boolean;
  likeCount: number;
};

export function NoteCard({ note }: { note: NoteCardData }) {
  return (
    <article className="rounded-[1.25rem] border-[2.5px] border-outline bg-paper p-3 shadow-soft-drop">
      <div className="flex gap-3">
        <Link
          href={`/notes/${note.id}`}
          aria-label={`เปิดโน้ต ${note.title}`}
          className="flex-none"
        >
          <NoteThumb
            title={note.title}
            coverUrl={note.coverUrl}
            fileKind={note.fileKind}
            subjectName={note.subjectName}
          />
        </Link>
        <div className="min-w-0 flex-1">
          <span
            className={`inline-block min-w-24 rounded-[0.45rem] border-2 border-outline px-3 py-0.5 text-xs font-normal ${colorForSubject(
              note.subjectName,
            )}`}
          >
            {note.subjectName ?? "ทั่วไป"}
          </span>
          <Link href={`/notes/${note.id}`} className="mt-1 block">
            <h3 className="line-clamp-2 break-words text-xl font-normal leading-tight">
              {note.title}
            </h3>
          </Link>
          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm font-normal text-dark-text/75">
            <span
              className="inline-block h-4 w-4 flex-none rounded-full border border-outline/25 bg-soft-gray bg-cover bg-center"
              style={note.avatarUrl ? { backgroundImage: `url(${note.avatarUrl})` } : undefined}
              aria-hidden
            />
            <span className="min-w-0 truncate">โดย {note.authorName}</span>
          </p>
          {note.classroomName && (
            <p className="mt-0.5 w-fit rounded-full border border-outline/25 bg-mint px-2 py-0.5 text-xs font-normal leading-none text-dark-text/70">
              {note.classroomName}
            </p>
          )}
          <p className="text-sm font-normal text-dark-text/80">
            {relativeThai(note.created_at)}
          </p>
        </div>
      </div>
      <NoteActions
        noteId={note.id}
        initialLiked={note.isLiked}
        initialSaved={note.isSaved}
        initialLikeCount={note.likeCount}
      />
    </article>
  );
}
