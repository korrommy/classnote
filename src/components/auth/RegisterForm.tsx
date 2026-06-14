"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import {
  Box,
  Camera,
  Check,
  Code2,
  Eye,
  EyeOff,
  ImageIcon,
  Lock,
  Mail,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { signUp, type ActionState } from "@/lib/auth/actions";
import { CLASSROOMS } from "@/lib/classrooms";
import { AVATAR_ACCEPT, AVATAR_MIME, MAX_AVATAR_BYTES } from "@/lib/avatars";

type Tone = "pink" | "green" | "blue" | "yellow" | "cyan";

const TONE_BG: Record<Tone, string> = {
  pink: "bg-pink-accent",
  green: "bg-soft-green",
  blue: "bg-baby-blue",
  yellow: "bg-soft-yellow",
  cyan: "bg-aqua",
};

export function RegisterForm() {
  const [state, action] = useActionState<ActionState, FormData>(signUp, {});
  const [accepted, setAccepted] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!AVATAR_MIME[file.type]) {
      setAvatarError("รองรับเฉพาะรูป PNG, JPG หรือ WEBP");
      setAvatarPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("รูปใหญ่เกินไป (ไม่เกิน 5MB)");
      setAvatarPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setAvatarError(null);
    setAvatarPreview(URL.createObjectURL(file));
  }

  if (state.message) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="rounded-[1rem] border-[2.5px] border-outline bg-mint px-4 py-4 text-sm leading-snug shadow-brutal-sm">
          {state.message}
        </div>
        <Link href="/login" className="underline">
          ไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3.5">
      {/* Avatar picker */}
      <div className="mb-1 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative flex-none"
          aria-label="เลือกรูปโปรไฟล์"
        >
          {avatarPreview ? (
            <Image
              src={avatarPreview}
              alt="รูปโปรไฟล์"
              width={92}
              height={92}
              unoptimized
              className="h-[92px] w-[92px] rounded-full border-[3px] border-outline object-cover"
            />
          ) : (
            <span className="flex h-[92px] w-[92px] items-center justify-center rounded-full border-[3px] border-dashed border-light-purple bg-lavender/40">
              <UserRound className="h-11 w-11 stroke-[2.4]" aria-hidden />
            </span>
          )}
          <span className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-[0.7rem] border-[2.5px] border-outline bg-pink-accent">
            <Camera className="h-6 w-6 stroke-[2.6]" aria-hidden />
          </span>
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-[52px] items-center gap-2 rounded-[0.9rem] border-[2.5px] border-light-purple bg-white px-3 text-[0.95rem] leading-none shadow-brutal-sm"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-[0.5rem] bg-lavender">
            <ImageIcon className="h-6 w-6 stroke-[2.4]" aria-hidden />
          </span>
          เลือกรูปโปรไฟล์
        </button>
        <input
          ref={fileInputRef}
          type="file"
          name="avatar"
          accept={AVATAR_ACCEPT}
          className="sr-only"
          onChange={handleAvatarChange}
        />
      </div>

      {avatarError && (
        <p className="-mt-1 rounded-[1rem] border-[2.5px] border-outline bg-pink-accent px-3 py-2 text-sm leading-snug">
          {avatarError}
        </p>
      )}

      <Field
        name="full_name"
        placeholder="ชื่อ-นามสกุล"
        autoComplete="name"
        Icon={UserRound}
        tone="pink"
      />
      <Field
        name="email"
        type="email"
        placeholder="อีเมล"
        autoComplete="email"
        Icon={Mail}
        tone="green"
      />
      <PasswordField
        name="password"
        placeholder="รหัสผ่าน"
        autoComplete="new-password"
        tone="blue"
      />
      <PasswordField
        name="confirm"
        placeholder="ยืนยันรหัสผ่าน"
        autoComplete="new-password"
        tone="yellow"
      />

      <div className="grid grid-cols-2 gap-3">
        <SelectField name="classroom_id" Icon={Box} tone="green" defaultValue="" compact>
          <option value="" disabled>
            ห้อง
          </option>
          {CLASSROOMS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <Field
          name="student_no"
          placeholder="เลขที่"
          inputMode="numeric"
          Icon={Code2}
          tone="cyan"
          compact
        />
      </div>

      <label className="flex items-center gap-3 py-0.5 text-[0.9rem] leading-snug">
        <input
          type="checkbox"
          name="accept"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="sr-only"
        />
        <span
          className={`flex h-7 w-7 flex-none items-center justify-center rounded-[0.4rem] border-2 border-outline transition-colors ${
            accepted ? "bg-green-accent" : "bg-white"
          }`}
        >
          {accepted && <Check className="h-4 w-4 stroke-[3.5]" />}
        </span>
        <span>
          ฉันยอมรับ <span className="text-light-purple">ข้อตกลงการใช้งาน</span>
        </span>
      </label>

      {state.error && (
        <p className="rounded-[1rem] border-[2.5px] border-outline bg-pink-accent px-3 py-2 text-sm leading-snug">
          {state.error}
        </p>
      )}

      <RegisterSubmit />

      <p className="text-center text-sm leading-snug text-dark-text/70">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="text-light-purple underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </form>
  );
}

function RegisterSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 flex h-[64px] items-center justify-center gap-3 rounded-[1rem] border-[2.5px] border-outline bg-green-accent text-[1.45rem] leading-none shadow-brutal transition-[transform,box-shadow] duration-[120ms] ease-[cubic-bezier(.25,.46,.45,.94)] active:translate-x-[5px] active:translate-y-[7px] active:shadow-none active:duration-[90ms] disabled:opacity-70 motion-reduce:transition-none"
    >
      {pending ? "กำลังสมัคร..." : "สมัครสมาชิก"}
      <Image
        src="/doodles/ladybug.png"
        alt=""
        width={56}
        height={56}
        className="h-11 w-11 object-contain"
      />
    </button>
  );
}

function Field({
  Icon,
  tone,
  compact,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  Icon: LucideIcon;
  tone: Tone;
  compact?: boolean;
}) {
  return (
    <label
      className={`flex h-[58px] items-center rounded-[0.95rem] border-[2.5px] border-outline bg-white shadow-brutal-sm ${
        compact ? "gap-2 px-2" : "gap-3 px-2.5"
      }`}
    >
      <span
        className={`flex h-10 w-10 flex-none items-center justify-center rounded-[0.65rem] ${TONE_BG[tone]}`}
      >
        <Icon className="h-5 w-5 stroke-[2.6]" aria-hidden />
      </span>
      <input
        required
        className={`min-w-0 flex-1 bg-transparent font-normal leading-none outline-none placeholder:text-dark-text/45 ${
          compact ? "text-[0.95rem]" : "text-base"
        }`}
        {...props}
      />
    </label>
  );
}

function SelectField({
  Icon,
  tone,
  compact,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  Icon: LucideIcon;
  tone: Tone;
  compact?: boolean;
}) {
  return (
    <label
      className={`flex h-[58px] items-center rounded-[0.95rem] border-[2.5px] border-outline bg-white shadow-brutal-sm ${
        compact ? "gap-2 px-2" : "gap-3 px-2.5"
      }`}
    >
      <span
        className={`flex h-10 w-10 flex-none items-center justify-center rounded-[0.65rem] ${TONE_BG[tone]}`}
      >
        <Icon className="h-5 w-5 stroke-[2.6]" aria-hidden />
      </span>
      <select
        required
        className={`min-w-0 flex-1 appearance-none bg-transparent font-normal leading-none outline-none ${
          compact ? "text-[0.95rem]" : "text-base"
        }`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

function PasswordField({
  tone,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { tone: Tone }) {
  const [show, setShow] = useState(false);
  return (
    <label className="flex h-[58px] items-center gap-3 rounded-[0.95rem] border-[2.5px] border-outline bg-white px-2.5 shadow-brutal-sm">
      <span
        className={`flex h-10 w-10 flex-none items-center justify-center rounded-[0.65rem] ${TONE_BG[tone]}`}
      >
        <Lock className="h-5 w-5 stroke-[2.6]" aria-hidden />
      </span>
      <input
        required
        type={show ? "text" : "password"}
        className="min-w-0 flex-1 bg-transparent text-base font-normal leading-none outline-none placeholder:text-dark-text/45"
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        className="flex h-9 w-9 flex-none items-center justify-center text-dark-text/70"
      >
        {show ? (
          <EyeOff className="h-6 w-6 stroke-[2.5]" />
        ) : (
          <Eye className="h-6 w-6 stroke-[2.5]" />
        )}
      </button>
    </label>
  );
}
