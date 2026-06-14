"use client";

import { useActionState } from "react";
import { claimRoster, type ActionState } from "@/lib/auth/actions";
import { CLASSROOMS } from "@/lib/classrooms";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/auth/SubmitButton";

// ใช้รายชื่อห้อง static ชุดเดียวกับหน้า /register (ไม่ดึงจาก DB)
// /verify เป็นแค่ fallback จึงควรเสนอเฉพาะห้องที่รองรับจริง
export function VerifyForm() {
  const [state, action] = useActionState<ActionState, FormData>(
    claimRoster,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="classroom_id" className="text-sm font-black">
          เลือกห้องเรียน
        </label>
        <select
          id="classroom_id"
          name="classroom_id"
          required
          defaultValue=""
          className="w-full appearance-none rounded-[1rem] border-[2.5px] border-outline bg-paper px-4 py-3 text-base font-normal shadow-brutal-sm outline-none transition-all focus:-translate-x-0.5 focus:-translate-y-0.5 focus:shadow-brutal"
        >
          <option value="" disabled>
            เลือกห้องของคุณ
          </option>
          {CLASSROOMS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <Input
        id="student_no"
        name="student_no"
        label="เลขประจำตัว"
        placeholder="เช่น 1, 2, 3 ..."
        inputMode="numeric"
        required
      />

      {state.error && (
        <p className="rounded-[1rem] border-[2.5px] border-outline bg-pink-accent px-3 py-2 text-sm font-black">
          {state.error}
        </p>
      )}

      <SubmitButton pendingLabel="กำลังตรวจสอบ...">
        ยืนยันและเข้าห้อง
      </SubmitButton>
    </form>
  );
}
