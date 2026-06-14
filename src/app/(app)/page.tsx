import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, CalendarDays, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Mascot, type MascotPose } from "@/components/ui/Mascot";
import { HomeSearch } from "@/components/home/HomeSearch";
import { SubjectBannerCarousel } from "@/components/home/SubjectBannerCarousel";
import { mergedSubjectBanners } from "@/lib/subjectImage";
import { resolveNoteCover, type NoteCoverKind } from "@/lib/notes/cover";

const thaiDate = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "2-digit",
});

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/welcome");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, classroom_id, classroom:classrooms!profiles_classroom_id_fkey(name, room)")
    .eq("id", user.id)
    .single();

  const classroomId = profile?.classroom_id;
  if (!classroomId) redirect("/verify");
  const nowIso = new Date().toISOString();

  const [{ data: notes, error: notesError }, { data: assignments }, { data: subjects }] = await Promise.all([
    supabase
      .from("notes")
      .select(
        "id, title, created_at, author:profiles!notes_author_id_fkey(full_name, avatar_url), files:note_files(file_url, file_type)",
      )
      .eq("classroom_id", classroomId)
      // โน้ตล่าสุดของห้อง = classroom + both เท่านั้น (ไม่รวม public-only)
      .in("visibility", ["classroom", "both"])
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("assignments")
      .select("id, title, description, due_date")
      .eq("classroom_id", classroomId)
      .gte("due_date", nowIso)
      .order("due_date", { ascending: true })
      .limit(3),
    supabase
      .from("subjects")
      .select("id, name")
      .eq("classroom_id", classroomId)
      .order("created_at", { ascending: true })
      .limit(50),
  ]);

  // กัน bug เงียบแบบ embedding/RLS ผิด — ถ้า query โน้ตล้มเหลวจะเห็นใน log ทันที
  if (notesError) {
    console.error("[HomePage] notes query failed:", notesError.message);
  }

  // เตรียมข้อมูลการ์ดโน้ต: หน้าปก (รูป/PDF placeholder) + avatar คนโพสต์
  const noteCards = await Promise.all(
    (notes ?? []).map(async (note) => {
      const author = Array.isArray(note.author) ? note.author[0] : note.author;
      const cover = await resolveNoteCover(note.files);
      return {
        id: note.id,
        title: note.title,
        authorName:
          (author as { full_name?: string } | null)?.full_name ?? "ไม่ระบุ",
        avatarUrl:
          (author as { avatar_url?: string | null } | null)?.avatar_url ?? null,
        coverUrl: cover.coverUrl,
        fileKind: cover.kind,
      };
    }),
  );

  const banners = mergedSubjectBanners(subjects ?? []);

  return (
    <main className="flex w-full flex-col gap-4 px-4 pb-8 pt-8">
      <header className="flex items-center justify-between">
        <h1 className="outlined-title text-[2.5rem] font-black leading-none">
          ห้อง<span className="outlined-title-pink">เรียน</span>
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/flashcards" aria-label="แฟลชการ์ด" className="cursor-pointer">
            <Image
              src="/icons/icon-flashcard.png.PNG"
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 object-contain"
            />
          </Link>
          <Link
            href="/notifications"
            aria-label="การแจ้งเตือน"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[0.7rem] border-2 border-outline bg-paper shadow-[3px_3px_0_#080808] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <Bell className="h-6 w-6 stroke-[2.6]" />
          </Link>
        </div>
      </header>

      <HomeSearch />

      <section className="rounded-[1rem] border-2 border-outline bg-pastel-pink p-4 shadow-[3px_3px_0_#080808]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center">
              <Image src="/icons/pencil.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
            </span>
            <span className="text-[1.55rem] font-semibold leading-none">โน้ตล่าสุด</span>
          </div>
          <SeeAll href="/notes" />
        </div>

        {noteCards.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {noteCards.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="flex min-h-[88px] cursor-pointer gap-3 rounded-[0.65rem] border-2 border-outline bg-card p-3 shadow-[2px_3px_0_rgba(8,8,8,0.35)] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                <MiniThumb title={note.title} coverUrl={note.coverUrl} fileKind={note.fileKind} />
                <span className="min-w-0 pt-1">
                  <span className="line-clamp-2 break-words text-sm font-semibold leading-snug">{note.title}</span>
                  <span className="mt-2 flex items-center gap-1.5 text-[11px] font-normal text-dark-text/65">
                    <span
                      className="h-4 w-4 flex-none rounded-full border border-outline/25 bg-soft-gray bg-cover bg-center"
                      style={note.avatarUrl ? { backgroundImage: `url(${note.avatarUrl})` } : undefined}
                      aria-hidden
                    />
                    <span className="min-w-0 truncate">โดย {note.authorName}</span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyHint pose="reading" text="ยังไม่มีโน้ตในห้องนี้" />
        )}
      </section>

      <section className="rounded-[1rem] border-2 border-outline bg-pastel-pink p-4 shadow-[3px_3px_0_#080808]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center">
              <Image src="/icons/sticky-notes.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
            </span>
            <span className="min-w-0 text-[1.35rem] font-semibold leading-tight">งานที่ต้องส่งเร็วๆ นี้</span>
          </div>
          <SeeAll href="/assignments" />
        </div>

        {assignments && assignments.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {assignments.map((assignment) => (
              <li
                key={assignment.id}
                className="flex min-h-[82px] items-center gap-3 rounded-[0.65rem] border-2 border-outline bg-card p-3 shadow-[2px_3px_0_rgba(8,8,8,0.35)]"
              >
                <span className="h-12 w-12 flex-none rounded-[0.35rem] border-2 border-outline bg-paper" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold leading-snug">{assignment.title}</span>
                  {assignment.description && (
                    <span className="block truncate text-xs font-normal text-dark-text/70">{assignment.description}</span>
                  )}
                </span>
                {assignment.due_date && (
                  <span className="flex flex-none items-center gap-2 text-xs font-semibold">
                    <CalendarDays className="h-5 w-5 flex-none stroke-[2.7]" />
                    {thaiDate.format(new Date(assignment.due_date))}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyHint pose="thumbsup" text="ไม่มีงานที่ใกล้ถึงกำหนด" />
        )}
      </section>

      <section className="rounded-[1rem] border-2 border-outline bg-[#e5f6d8] p-4 shadow-[3px_3px_0_#080808]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center">
              <Image src="/icons/book.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
            </span>
            <span className="text-[1.55rem] font-semibold leading-none">วิชา</span>
          </div>
          <SeeAll href="/subjects" />
        </div>

        <SubjectBannerCarousel banners={banners} />
      </section>
    </main>
  );
}

// หน้าปกย่อของการ์ดโน้ตในหน้าแรก (52px): รูปจริง > placeholder PDF > placeholder อ่อน
function MiniThumb({
  title,
  coverUrl,
  fileKind,
}: {
  title: string;
  coverUrl: string | null;
  fileKind: NoteCoverKind;
}) {
  const base = "h-[52px] w-[52px] flex-none overflow-hidden rounded-[0.35rem] border-2 border-outline";

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

  // ไม่มีรูปจริง → หน้าปกย่อสไตล์หน้ากระดาษโน้ต (แถบหัว + เส้นบรรทัดจาง)
  return (
    <span aria-hidden className={`${base} relative flex flex-col bg-paper`}>
      <span className="h-[11px] w-full border-b border-outline/30 bg-mint" />
      <span className="flex flex-1 flex-col justify-center gap-[3px] px-1.5">
        <span className="h-[2px] w-[82%] rounded-full bg-outline/15" />
        <span className="h-[2px] w-[60%] rounded-full bg-outline/15" />
        <span className="h-[2px] w-[88%] rounded-full bg-outline/15" />
      </span>
      {fileKind === "pdf" && (
        <span className="absolute bottom-[2px] right-[2px] rounded-[0.2rem] border border-outline bg-soft-yellow px-[3px] text-[6px] font-normal leading-tight">
          PDF
        </span>
      )}
    </span>
  );
}

function SeeAll({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex h-10 cursor-pointer items-center gap-1.5 rounded-[0.55rem] border-2 border-outline bg-paper px-2.5 text-xs font-semibold leading-none shadow-[2px_2px_0_#080808] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
    >
      ดูทั้งหมด
      <span className="flex h-5 w-5 items-center justify-center rounded-[0.25rem] border-2 border-outline bg-paper">
        <ChevronRight className="h-3.5 w-3.5 stroke-[3]" />
      </span>
    </Link>
  );
}

function EmptyHint({ text, pose }: { text: string; pose: MascotPose }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[0.75rem] border-2 border-dashed border-outline/40 bg-paper/60 px-3 py-4 text-center">
      <Mascot pose={pose} size={76} />
      <p className="text-xs font-normal text-dark-text/55">{text}</p>
    </div>
  );
}
