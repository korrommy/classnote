"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Mascot } from "@/components/ui/Mascot";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // อย่ากลืน error เงียบๆ — log ไว้ให้ debug ได้ (digest โผล่ใน server log ด้วย)
    console.error("App route error:", error);
  }, [error]);

  return (
    <main className="flex h-full min-h-0 w-full flex-col items-center justify-center bg-cream px-[24px]">
      <div className="flex w-full max-w-[320px] flex-col items-center rounded-[1.25rem] border-2 border-outline bg-paper px-6 py-8 text-center shadow-brutal-sm">
        <Mascot pose="hello" size={120} />
        <p className="mt-4 text-[22px] font-normal leading-tight">
          อุ๊ปส์ มีบางอย่างผิดพลาด
        </p>
        <p className="mt-1 text-[15px] font-normal leading-snug text-dark-text/65">
          ลองใหม่อีกครั้ง หรือกลับหน้าหลักก่อนนะ
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-5 flex h-[44px] w-full items-center justify-center gap-2 rounded-[0.65rem] border-2 border-outline bg-[#cfe8b8] text-[18px] font-normal leading-none shadow-brutal-sm transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <RefreshCw className="h-5 w-5 stroke-[2.6]" />
          ลองอีกครั้ง
        </button>
        <Link
          href="/"
          className="mt-3 flex h-[44px] w-full items-center justify-center rounded-[0.65rem] border-2 border-outline bg-soft-yellow text-[18px] font-normal leading-none shadow-brutal-sm transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </main>
  );
}
