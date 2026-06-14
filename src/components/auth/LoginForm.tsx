"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import { signIn, type ActionState } from "@/lib/auth/actions";
import { SubmitButton } from "@/components/auth/SubmitButton";

export function LoginForm() {
  const [state, action] = useActionState<ActionState, FormData>(signIn, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <AuthField
        id="email"
        name="email"
        type="email"
        placeholder="อีเมล"
        autoComplete="email"
        Icon={Mail}
        tone="green"
      />
      <AuthField
        id="password"
        name="password"
        type="password"
        placeholder="รหัสผ่าน"
        autoComplete="current-password"
        Icon={Lock}
        tone="blue"
      />

      {state.error && (
        <p className="rounded-[0.9rem] border-[2.5px] border-outline bg-pink-accent px-3 py-2 text-sm leading-snug">
          {state.error}
        </p>
      )}

      <SubmitButton
        pendingLabel="กำลังเข้าสู่ระบบ..."
        className="mt-1 h-[60px] text-[1.45rem]"
      >
        เข้าสู่ระบบ
      </SubmitButton>

      <p className="text-center text-sm leading-snug text-dark-text/70">
        ยังไม่มีบัญชี?{" "}
        <Link href="/register" className="text-light-purple underline">
          สมัครสมาชิก
        </Link>
      </p>
    </form>
  );
}

function AuthField({
  Icon,
  tone,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  Icon: typeof Mail;
  tone: "green" | "blue";
}) {
  const iconBg = tone === "green" ? "bg-mint" : "bg-baby-blue";
  return (
    <label className="flex h-[60px] items-center gap-3 rounded-[0.95rem] border-[2.5px] border-outline bg-paper px-3 shadow-brutal-sm">
      <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-[0.75rem] ${iconBg}`}>
        <Icon className="h-6 w-6 stroke-[2.6]" aria-hidden />
      </span>
      <input
        required
        className="min-w-0 flex-1 bg-transparent text-[1rem] font-normal leading-none outline-none placeholder:text-dark-text/45"
        {...props}
      />
    </label>
  );
}
