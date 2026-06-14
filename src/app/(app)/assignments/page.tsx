import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Mascot } from "@/components/ui/Mascot";
import { AssignmentCheck } from "@/components/assignments/AssignmentCheck";

const thaiDate = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "2-digit",
});

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
};

type Status = "overdue" | "due-soon" | "upcoming" | "none";

function getStatus(dueDate: string | null): Status {
  if (!dueDate) return "none";
  const dueMs = new Date(dueDate).getTime();
  const nowMs = Date.now();
  if (dueMs < nowMs) return "overdue";
  if (dueMs - nowMs <= 3 * 24 * 60 * 60 * 1000) return "due-soon";
  return "upcoming";
}

export default async function AssignmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/welcome");

  const { data: profile } = await supabase
    .from("profiles")
    .select("classroom_id")
    .eq("id", user.id)
    .single();

  const classroomId = profile?.classroom_id;
  if (!classroomId) redirect("/verify");

  const [{ data: assignments }, { data: statuses }] = await Promise.all([
    supabase
      .from("assignments")
      .select("id, title, description, due_date")
      .eq("classroom_id", classroomId)
      .order("due_date", { ascending: true })
      .limit(50),
    supabase
      .from("assignment_status")
      .select("assignment_id, status")
      .eq("user_id", user.id)
      .limit(200),
  ]);

  const rows: Assignment[] = assignments ?? [];
  const completedIds = new Set(
    (statuses ?? [])
      .filter((row) => row.status === "completed")
      .map((row) => row.assignment_id),
  );

  return (
    <main className="flex h-full min-h-0 w-full flex-col gap-5 overflow-hidden px-[24px] pb-3 pt-[56px]">
      <h1 className="outlined-title flex-none whitespace-nowrap text-[54px] leading-none">
        <span className="outlined-title-pink">งาน</span>ทั้งหมด
      </h1>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.25rem] border-2 border-outline bg-[#cfe8f7] px-4 pb-4 pt-4 shadow-[4px_5px_0_rgba(0,0,0,0.25)]">
        <div className="mb-3 flex flex-none items-center justify-between">
          <p className="text-[20px] font-normal leading-none">รายการงาน</p>
          <span className="rounded-full border-2 border-outline bg-soft-yellow px-3 py-1 text-[14px] leading-none">
            {rows.length} รายการ
          </span>
        </div>

        {rows.length > 0 ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {rows.map((a) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                completed={completedIds.has(a.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <Mascot pose="thumbsup" size={120} />
            <p className="text-[18px] font-normal leading-tight text-dark-text/70">
              ไม่มีงานในขณะนี้
            </p>
            <p className="text-[14px] font-normal text-dark-text/45">
              คุณครูยังไม่ได้มอบหมายงาน
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function AssignmentCard({
  assignment,
  completed,
}: {
  assignment: Assignment;
  completed: boolean;
}) {
  const status = getStatus(assignment.due_date);

  const cardBg =
    status === "overdue"
      ? "bg-overdue"
      : status === "due-soon"
        ? "bg-due-soon"
        : "bg-paper";

  const badge =
    status === "overdue"
      ? { text: "เลยกำหนด", bg: "bg-overdue" }
      : status === "due-soon"
        ? { text: "ใกล้ส่ง", bg: "bg-due-soon" }
        : null;

  return (
    <article
      className={`flex min-h-[80px] items-center gap-3 rounded-[0.9rem] border-2 border-outline p-3 shadow-[2px_3px_0_rgba(8,8,8,0.18)] ${cardBg}`}
    >
      <AssignmentCheck assignmentId={assignment.id} initialCompleted={completed} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[18px] font-normal leading-snug">{assignment.title}</p>
        {assignment.description && (
          <p className="mt-0.5 line-clamp-2 text-[13px] font-normal leading-snug text-dark-text/65">
            {assignment.description}
          </p>
        )}
        {assignment.due_date && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 flex-none stroke-[2.4] text-dark-text/60" />
            <span className="text-[13px] font-normal leading-none text-dark-text/70">
              {thaiDate.format(new Date(assignment.due_date))}
            </span>
          </div>
        )}
      </div>

      {badge && (
        <span
          className={`flex-none rounded-full border-2 border-outline px-2.5 py-1 text-[12px] font-normal leading-none ${badge.bg}`}
        >
          {badge.text}
        </span>
      )}
    </article>
  );
}
