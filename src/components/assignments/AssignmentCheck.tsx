"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { toggleAssignmentStatus } from "@/lib/assignments/actions";

export function AssignmentCheck({
  assignmentId,
  initialCompleted,
}: {
  assignmentId: string;
  initialCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [pending, setPending] = useState(false);

  async function handleToggle() {
    if (pending) return;
    setPending(true);

    const previous = completed;
    setCompleted(!previous);

    try {
      const result = await toggleAssignmentStatus(assignmentId);
      if (!result.ok) throw new Error(result.error);
    } catch {
      setCompleted(previous);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={completed}
      aria-label={completed ? "ยกเลิกทำเสร็จแล้ว" : "ทำเสร็จแล้ว"}
      className={`flex h-11 w-11 flex-none items-center justify-center self-start rounded-[0.4rem] border-2 border-outline transition-transform active:scale-90 ${
        completed ? "bg-green-accent" : "bg-paper"
      }`}
    >
      {completed && <Check className="h-7 w-7 stroke-[3.2]" />}
    </button>
  );
}
