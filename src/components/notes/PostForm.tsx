"use client";

import { useActionState, useRef, useState } from "react";
import { Paperclip, Pencil, Star } from "lucide-react";
import { createNote, type NoteActionState } from "@/lib/notes/actions";
import { SubmitButton } from "@/components/auth/SubmitButton";
import type { NoteVisibility } from "@/types/database.types";

type SubjectOption = { id: string; name: string };

const VISIBILITY: {
  value: NoteVisibility;
  label: string;
  iconSrc: string;
  className: string;
}[] = [
  { value: "classroom", label: "เฉพาะในห้อง", iconSrc: "/icons/post-visibility/classroom.png", className: "bg-lavender" },
  { value: "public", label: "สาธารณะ", iconSrc: "/icons/post-visibility/public.png", className: "bg-pink-accent" },
  { value: "both", label: "ทั้งสองเลย", iconSrc: "/icons/post-visibility/both.png", className: "bg-mint" },
];

const MAX_FILE_BYTES = 30 * 1024 * 1024; // 30MB — ตรงกับ server (actions.ts)
const ALLOWED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
];

export function PostForm({ subjects }: { subjects: SubjectOption[] }) {
  const [state, action] = useActionState<NoteActionState, FormData>(
    createNote,
    {},
  );
  const [visibility, setVisibility] = useState<NoteVisibility>("classroom");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName(null);
      setFileError(null);
      return;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setFileName(null);
      setFileError("แนบได้เฉพาะรูปภาพ (PNG/JPG/WebP) หรือ PDF");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileName(null);
      setFileError("ไฟล์ใหญ่เกินไป (ไม่เกิน 30MB)");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFileError(null);
    setFileName(file.name);
  }

  return (
    <form action={action} className="cartoon-panel flex flex-col gap-5 bg-baby-blue p-5">
      <div className="rounded-[0.85rem] border-[2.5px] border-outline bg-lavender px-4 py-3 text-center shadow-brutal-sm">
        <p className="text-[1.15rem] leading-none text-pink-accent [text-shadow:1px_1px_0_#080808,-1px_1px_0_#080808,1px_-1px_0_#080808,-1px_-1px_0_#080808]">
          รายละเอียดโพสต์
        </p>
        <p className="mt-1 text-xs text-dark-text/65">
          ใส่ข้อมูลที่อยากแชร์ให้เพื่อนในห้องหรือห้องสาธารณะ
        </p>
      </div>

      <FieldLabel text="ชื่องาน / ไฟล์">
        <div className="flex h-14 items-center rounded-[0.55rem] border-[2.5px] border-outline bg-paper px-4 shadow-brutal-sm">
          <input
            id="title"
            name="title"
            placeholder="เช่น โจทย์ของคนแพ้"
            required
            className="min-w-0 flex-1 bg-transparent text-base font-light outline-none placeholder:text-dark-text/45"
          />
          <Pencil className="h-7 w-7 text-yellow-accent stroke-[2.8]" />
        </div>
      </FieldLabel>

      <FieldLabel text="เลือกรายวิชา">
        <div className="relative">
          <select
            id="subject_id"
            name="subject_id"
            defaultValue=""
            className="h-14 w-full appearance-none rounded-[0.55rem] border-[2.5px] border-outline bg-mint px-4 pr-12 text-base font-light shadow-brutal-sm outline-none"
          >
            <option value="">ไม่ระบุวิชา</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 h-0 w-0 -translate-y-1/2 border-l-[12px] border-r-[12px] border-t-[18px] border-l-transparent border-r-transparent border-t-outline" />
        </div>
      </FieldLabel>

      <FieldLabel text="รายละเอียดเพิ่มเติม" muted="(ไม่บังคับ)">
        <div className="flex min-h-28 rounded-[0.55rem] border-[2.5px] border-outline bg-paper px-4 py-3 shadow-brutal-sm">
          <textarea
            id="content"
            name="content"
            rows={4}
            placeholder="เช่น อย่าลืมทบทวน..."
            className="min-w-0 flex-1 resize-none bg-transparent text-base font-light outline-none placeholder:text-dark-text/45"
          />
          <Pencil className="mt-auto h-7 w-7 text-yellow-accent stroke-[2.8]" />
        </div>
      </FieldLabel>

      <FieldLabel text="แนบไฟล์" muted="(ไม่บังคับ)">
        <div className="flex min-h-14 items-center gap-3 rounded-[0.55rem] border-[2.5px] border-outline bg-paper px-4 py-3 shadow-brutal-sm">
          <Paperclip className="h-7 w-7 flex-none text-yellow-accent stroke-[2.8]" />
          <span className="min-w-0 flex-1 truncate text-base font-light text-dark-text/70">
            {fileName ?? "รูปภาพหรือ PDF ไม่เกิน 30MB"}
          </span>
          <input
            ref={fileInputRef}
            id="file"
            name="file"
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={handleFileChange}
            className="absolute h-0 w-0 opacity-0"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-none rounded-[0.55rem] border-[2.5px] border-outline bg-mint px-3 py-1.5 text-sm font-light shadow-brutal-sm transition-all active:translate-x-0.5 active:translate-y-0.5"
          >
            เลือกไฟล์
          </button>
        </div>
        {fileError && (
          <p className="mt-2 rounded-[0.75rem] border-[2.5px] border-outline bg-pink-accent px-3 py-2 text-sm font-light">
            {fileError}
          </p>
        )}
      </FieldLabel>

      <div>
        <p className="mb-3 text-xl font-light">โพสต์ไปที่</p>
        <input type="hidden" name="visibility" value={visibility} />
        <div className="grid grid-cols-3 gap-4">
          {VISIBILITY.map((v) => {
            const active = visibility === v.value;
            return (
              <button
                key={v.value}
                type="button"
                onClick={() => setVisibility(v.value)}
                className={`flex min-h-[84px] flex-col items-center justify-center rounded-[0.65rem] border-[2.5px] border-outline px-2 text-center text-sm font-light shadow-brutal-sm transition-all active:translate-x-0.5 active:translate-y-0.5 ${
                  active ? v.className : "bg-paper"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.iconSrc}
                  alt=""
                  aria-hidden
                  className="mb-1 h-9 w-9 object-contain"
                />
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {state.error && (
        <p className="rounded-[0.75rem] border-[2.5px] border-outline bg-pink-accent px-3 py-2 text-sm font-light">
          {state.error}
        </p>
      )}

      <SubmitButton variant="primary" pendingLabel="กำลังโพสต์...">
        <span className="flex items-center justify-center gap-2 text-2xl">
          โพสต์งาน <Star className="h-6 w-6 fill-yellow-accent stroke-yellow-accent" />
        </span>
      </SubmitButton>
    </form>
  );
}

function FieldLabel({
  text,
  muted,
  children,
}: {
  text: string;
  muted?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xl font-light">
        {text} {muted && <span className="text-dark-text/45">{muted}</span>}
      </span>
      {children}
    </label>
  );
}
