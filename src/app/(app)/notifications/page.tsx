import Link from "next/link";
import { Bell } from "lucide-react";
import { Mascot } from "@/components/ui/Mascot";

export default function NotificationsPage() {
  return (
    <main className="flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden px-[24px] pb-4 pt-[48px]">
      <div className="flex w-full max-w-[320px] flex-col items-center gap-5 rounded-[1.25rem] border-2 border-outline bg-paper px-6 py-8 shadow-brutal">
        <div className="flex h-[56px] w-[56px] items-center justify-center rounded-full border-2 border-outline bg-soft-yellow">
          <Bell className="h-7 w-7 stroke-[2.4]" />
        </div>

        <div className="text-center">
          <p className="text-[24px] font-normal leading-none">การแจ้งเตือน</p>
          <p className="mt-2 text-[15px] font-normal leading-snug text-dark-text/60">
            ฟีเจอร์นี้กำลังจะมาเร็วๆ นี้ ✦
          </p>
        </div>

        <Mascot pose="hello" size={110} />

        <Link
          href="/"
          className="flex h-[44px] w-full items-center justify-center rounded-[0.75rem] border-2 border-outline bg-soft-yellow text-[18px] font-normal shadow-brutal-sm transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </main>
  );
}
