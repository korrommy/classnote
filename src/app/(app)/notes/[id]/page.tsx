import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, MessageCircle, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getR2SignedUrl } from "@/lib/storage/r2";
import { deleteNote } from "@/lib/notes/actions";
import { deleteComment } from "@/lib/interactions/actions";
import { relativeThai } from "@/lib/time";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { CommentForm } from "@/components/comments/CommentForm";

const VISIBILITY_LABEL: Record<string, string> = {
  classroom: "เฉพาะในห้อง",
  public: "สาธารณะ",
  both: "ในห้อง + สาธารณะ",
};

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: note } = await supabase
    .from("notes")
    .select(
      "id, title, content, visibility, created_at, author_id, author:profiles!notes_author_id_fkey(full_name), subject:subjects(name), classroom:classrooms(name, room, grade_level)",
    )
    .eq("id", id)
    .single();

  if (!note) notFound();

  const { data: noteFiles } = await supabase
    .from("note_files")
    .select("id, file_url, file_type, file_name")
    .eq("note_id", id)
    .order("created_at", { ascending: true })
    .limit(10);

  // bucket R2 เป็น private — ใช้ presigned URL อายุ 1 ชั่วโมง (หน้านี้ render ต่อ request)
  // เห็นเฉพาะไฟล์ของโน้ตที่ RLS อนุญาตให้อ่าน note_files ได้แล้วเท่านั้น
  const attachments = await Promise.all(
    (noteFiles ?? []).map(async (file) => {
      const signedUrl = await getR2SignedUrl(file.file_url, 3600);
      return {
        id: file.id,
        fileType: file.file_type,
        fileName: file.file_name ?? "ไฟล์แนบ",
        signedUrl,
      };
    }),
  );
  const visibleAttachments = attachments.filter(
    (file): file is typeof file & { signedUrl: string } =>
      file.signedUrl !== null,
  );

  const { data: commentsData } = await supabase
    .from("comments")
    .select("id, content, created_at, author_id, author:profiles(full_name)")
    .eq("note_id", id)
    .order("created_at", { ascending: true })
    .limit(100);

  const comments = (commentsData ?? []).map((comment) => {
    const commentAuthor = Array.isArray(comment.author)
      ? comment.author[0]
      : comment.author;
    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.created_at,
      authorId: comment.author_id,
      authorName:
        (commentAuthor as { full_name?: string | null } | null)?.full_name ??
        "ผู้ใช้",
    };
  });

  const author = Array.isArray(note.author) ? note.author[0] : note.author;
  const subject = Array.isArray(note.subject) ? note.subject[0] : note.subject;
  const classroom = Array.isArray(note.classroom) ? note.classroom[0] : note.classroom;
  const authorName =
    (author as { full_name?: string } | null)?.full_name ?? "ไม่ระบุ";
  const subjectName = (subject as { name?: string } | null)?.name ?? null;
  const classroomName =
    (classroom as { name?: string | null; room?: string | null; grade_level?: string | null } | null)?.name ??
    [
      (classroom as { grade_level?: string | null } | null)?.grade_level,
      (classroom as { room?: string | null } | null)?.room,
    ]
      .filter(Boolean)
      .join("/") ??
    null;
  const isOwner = user?.id === note.author_id;
  const del = deleteNote.bind(null, note.id);
  const backHref = note.visibility === "public" || note.visibility === "both" ? "/public" : "/notes";

  return (
    <main className="flex w-full flex-col gap-5 overflow-x-hidden px-5 pb-7 pt-8">
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-2 rounded-[0.75rem] border-[2.5px] border-outline bg-paper px-3 py-2 text-sm font-black shadow-brutal-sm"
      >
        <ArrowLeft className="h-4 w-4 stroke-[3]" />
        กลับ
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        {subjectName && (
          <span className="rounded-[0.45rem] border-2 border-outline bg-tag-blue px-3 py-0.5 text-sm font-black">
            {subjectName}
          </span>
        )}
        <span className="rounded-[0.45rem] border-2 border-outline bg-lavender px-3 py-0.5 text-sm font-black">
          {VISIBILITY_LABEL[note.visibility] ?? note.visibility}
        </span>
        {classroomName && (
          <span className="rounded-[0.45rem] border-2 border-outline bg-mint px-3 py-0.5 text-sm font-black">
            {classroomName}
          </span>
        )}
      </div>

      <h1 className="outlined-title outlined-title-pink text-5xl font-black leading-none">
        {note.title}
      </h1>

      <p className="flex items-center gap-1.5 text-base font-bold text-dark-text/65">
        <span className="inline-block h-3 w-3 rounded-full bg-soft-gray" />
        โดย {authorName} · {relativeThai(note.created_at)}
      </p>

      <article className="min-h-[260px] rounded-[1.25rem] border-[2.5px] border-outline bg-paper p-5 shadow-brutal">
        {note.content ? (
          <p className="whitespace-pre-wrap text-lg font-semibold leading-relaxed">
            {note.content}
          </p>
        ) : (
          <p className="text-base font-bold text-dark-text/50">ไม่มีเนื้อหา</p>
        )}
      </article>

      {visibleAttachments.length > 0 && (
        <div className="flex flex-col gap-3">
          {visibleAttachments.map((file) =>
            file.fileType === "image" ? (
              <figure
                key={file.id}
                className="overflow-hidden rounded-[1.25rem] border-[2.5px] border-outline bg-paper shadow-brutal"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.signedUrl}
                  alt={file.fileName}
                  className="block h-auto w-full object-contain"
                />
              </figure>
            ) : (
              <a
                key={file.id}
                href={file.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-[1rem] border-[2.5px] border-outline bg-soft-yellow px-4 py-3 shadow-brutal-sm transition-all active:translate-x-0.5 active:translate-y-0.5"
              >
                <FileText className="h-8 w-8 flex-none stroke-[2.4]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-black">
                    {file.fileName}
                  </span>
                  <span className="block text-sm font-bold text-dark-text/55">
                    แตะเพื่อเปิด PDF
                  </span>
                </span>
              </a>
            ),
          )}
        </div>
      )}

      {isOwner && (
        <form action={del} className="mt-2">
          <SubmitButton variant="ghost" pendingLabel="กำลังลบ...">
            <Trash2 className="h-5 w-5 stroke-[2.8]" />
            ลบโน้ตนี้
          </SubmitButton>
        </form>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-black">
          <MessageCircle className="h-6 w-6 stroke-[2.6]" />
          ความคิดเห็น ({comments.length})
        </h2>

        {comments.length === 0 ? (
          <p className="rounded-[1rem] border-2 border-dashed border-outline/45 bg-paper/55 px-4 py-5 text-center text-base font-bold text-dark-text/50">
            ยังไม่มีความคิดเห็น เป็นคนแรกเลย!
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className="rounded-[1rem] border-[2.5px] border-outline bg-paper px-4 py-3 shadow-brutal-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-black">
                    {comment.authorName}
                    <span className="ml-2 font-bold text-dark-text/50">
                      {relativeThai(comment.createdAt)}
                    </span>
                  </p>
                  {user?.id === comment.authorId && (
                    <form action={deleteComment.bind(null, comment.id)}>
                      <button
                        type="submit"
                        aria-label="ลบความคิดเห็น"
                        className="text-dark-text/45 transition-colors hover:text-dark-text"
                      >
                        <Trash2 className="h-4 w-4 stroke-[2.6]" />
                      </button>
                    </form>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-base font-semibold leading-relaxed">
                  {comment.content}
                </p>
              </li>
            ))}
          </ul>
        )}

        <CommentForm noteId={note.id} />
      </section>
    </main>
  );
}
