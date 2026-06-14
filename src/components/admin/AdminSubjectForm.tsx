"use client";

import { useActionState, useEffect, useRef } from "react";
import { BookOpen } from "lucide-react";
import { createSubject, type AdminActionState } from "@/lib/admin/actions";
import { AdminSubmitButton } from "@/components/admin/AdminAssignmentForm";

export function AdminSubjectForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState<AdminActionState, FormData>(
    createSubject,
    {},
  );

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <input
        name="name"
        required
        maxLength={100}
        placeholder="ชื่อวิชา เช่น ภาษาไทย"
        className="h-12 rounded-[0.55rem] border-2 border-outline bg-paper px-3 text-base font-normal shadow-brutal-sm outline-none placeholder:text-dark-text/45"
      />

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

      <AdminSubmitButton label="เพิ่มวิชา" Icon={BookOpen} />
    </form>
  );
}
