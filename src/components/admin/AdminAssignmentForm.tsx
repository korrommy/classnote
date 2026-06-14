"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { CalendarDays, ClipboardList } from "lucide-react";
import { createAssignment, type AdminActionState } from "@/lib/admin/actions";

type SubjectOption = { id: string; name: string };

export function AdminAssignmentForm({ subjects }: { subjects: SubjectOption[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState<AdminActionState, FormData>(
    createAssignment,
    {},
  );

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <input
        name="title"
        required
        maxLength={200}
        placeholder="ชื่องาน เช่น แบบฝึกหัดบทที่ 3"
        className="h-12 rounded-[0.55rem] border-2 border-outline bg-paper px-3 text-base font-normal shadow-brutal-sm outline-none placeholder:text-dark-text/45"
      />

      <textarea
        name="description"
        rows={2}
        maxLength={1000}
        placeholder="รายละเอียดงาน (ไม่บังคับ)"
        className="resize-none rounded-[0.55rem] border-2 border-outline bg-paper px-3 py-2 text-base font-normal shadow-brutal-sm outline-none placeholder:text-dark-text/45"
      />

      <label className="flex h-12 items-center gap-2 rounded-[0.55rem] border-2 border-outline bg-paper px-3 shadow-brutal-sm">
        <CalendarDays className="h-5 w-5 flex-none stroke-[2.4] text-dark-text/60" />
        <span className="text-[13px] font-normal leading-none text-dark-text/60">
          กำหนดส่ง
        </span>
        <input
          name="due_date"
          type="date"
          className="min-w-0 flex-1 bg-transparent text-base font-normal outline-none"
        />
      </label>

      <select
        name="subject_id"
        defaultValue=""
        className="h-12 appearance-none rounded-[0.55rem] border-2 border-outline bg-paper px-3 text-base font-normal shadow-brutal-sm outline-none"
      >
        <option value="">ไม่ระบุวิชา</option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name}
          </option>
        ))}
      </select>

      {state.error && (
        <p className="rounded-[0.75rem] border-2 border-outline bg-pink-accent px-3 py-2 text-sm font-black">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-[0.75rem] border-2 border-outline bg-green-accent px-3 py-2 text-sm font-black">
          {state.success}
        </p>
      )}

      <AdminSubmitButton label="เพิ่มงาน" Icon={ClipboardList} />
    </form>
  );
}

export function AdminSubmitButton({
  label,
  Icon,
}: {
  label: string;
  Icon: typeof ClipboardList;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex h-12 items-center justify-center gap-2 rounded-[0.65rem] border-2 border-outline bg-soft-yellow text-[18px] font-normal shadow-brutal-sm transition-all active:translate-x-0.5 active:translate-y-0.5 ${pending ? "opacity-60" : ""}`}
    >
      <Icon className="h-5 w-5 stroke-[2.6]" />
      {pending ? "กำลังบันทึก..." : label}
    </button>
  );
}
