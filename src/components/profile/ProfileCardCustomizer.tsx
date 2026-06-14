"use client";

import { type ChangeEvent, useRef, useState, useTransition } from "react";
import {
  ProfileStudentCard,
  type ProfileCardTheme,
} from "@/components/profile/ProfileStudentCard";
import { AVATAR_ACCEPT, AVATAR_MIME, MAX_AVATAR_BYTES } from "@/lib/avatars";
import { saveCardTheme, uploadAvatar } from "@/lib/profile/actions";

const swatches: Array<{
  theme: ProfileCardTheme;
  label: string;
  colors: string[];
}> = [
  { theme: "classic", label: "สีฟ้า", colors: ["#fbffc4", "#bfe8f2", "#f5a0cf"] },
  { theme: "sunny", label: "สีเหลือง", colors: ["#f7b7d8", "#fff0a3", "#77c7df"] },
  { theme: "mint", label: "สีเขียว", colors: ["#ff9a54", "#9be9bb", "#f3a3cf"] },
];

export function ProfileCardCustomizer({
  fullName,
  avatarUrl,
  gradeLevel,
  studentNo,
  initialTheme = "classic",
}: {
  fullName: string;
  avatarUrl: string | null;
  gradeLevel: string | null;
  studentNo: string | null;
  initialTheme?: ProfileCardTheme;
}) {
  const [theme, setTheme] = useState<ProfileCardTheme>(initialTheme);

  // เปลี่ยนธีม: อัปเดต UI ทันที แล้วบันทึกลง user_metadata (fire-and-forget)
  // ถ้าบันทึกพลาด ค่าที่เห็นยังอยู่ในรอบนี้ และจะกลับเป็นค่าเดิมเมื่อโหลดใหม่
  function selectTheme(next: ProfileCardTheme) {
    setTheme(next);
    void saveCardTheme(next);
  }
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(avatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = ""; // เลือกไฟล์เดิมซ้ำได้
    if (!file) return;

    if (!AVATAR_MIME[file.type]) {
      setError("รองรับเฉพาะรูป PNG, JPG หรือ WEBP");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("รูปใหญ่เกินไป (ไม่เกิน 5MB)");
      return;
    }
    setError(null);

    const previous = currentAvatar;
    const previewUrl = URL.createObjectURL(file);
    setCurrentAvatar(previewUrl); // โชว์ทันทีระหว่างอัปโหลด

    const formData = new FormData();
    formData.append("avatar", file);

    startTransition(async () => {
      const result = await uploadAvatar(formData);
      URL.revokeObjectURL(previewUrl);
      if (result.error || !result.avatarUrl) {
        setCurrentAvatar(previous); // ย้อนกลับถ้าพลาด
        setError(result.error ?? "อัปโหลดรูปไม่สำเร็จ");
        return;
      }
      setCurrentAvatar(result.avatarUrl);
    });
  }

  return (
    <div className="relative">
      <ProfileStudentCard
        fullName={fullName}
        avatarUrl={currentAvatar}
        gradeLevel={gradeLevel}
        studentNo={studentNo}
        theme={theme}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isPending}
        className="absolute -bottom-[42px] left-0 flex h-8 items-center justify-center rounded-[0.55rem] border-2 border-outline bg-[#cfe8b8] px-3 text-[16px] font-normal leading-none shadow-[2px_3px_0_#080808] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-70"
      >
        {isPending ? "กำลังอัปโหลด..." : "เปลี่ยนโปรไฟล์"}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept={AVATAR_ACCEPT}
        className="sr-only"
        onChange={handleFileChange}
      />

      <div
        aria-label="เลือกสี Student ID Card"
        className="absolute -bottom-[42px] right-0 flex gap-2"
      >
        {swatches.map((swatch) => {
          const active = theme === swatch.theme;

          return (
            <button
              key={swatch.theme}
              type="button"
              aria-label={swatch.label}
              aria-pressed={active}
              onClick={() => selectTheme(swatch.theme)}
              className={`grid h-8 w-8 grid-cols-2 overflow-hidden rounded-full border-2 border-outline shadow-[2px_3px_0_#080808] transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
                active ? "scale-110" : ""
              }`}
            >
              <span style={{ backgroundColor: swatch.colors[0] }} />
              <span style={{ backgroundColor: swatch.colors[1] }} />
              <span style={{ backgroundColor: swatch.colors[2] }} />
              <span style={{ backgroundColor: swatch.colors[1] }} />
            </button>
          );
        })}
      </div>

      {error && (
        <p className="absolute -bottom-[80px] left-0 right-0 rounded-[0.6rem] border-2 border-outline bg-pink-accent px-3 py-1.5 text-[13px] font-black leading-snug">
          {error}
        </p>
      )}
    </div>
  );
}
