import Link from "next/link";
import { Mascot } from "@/components/ui/Mascot";

// แสดงเมื่อหน้าใน (app) เรียก notFound() — ไม่บอกรายละเอียดสิทธิ์การเข้าถึง
export default function AppNotFound() {
  return (
    <main className="flex h-full min-h-0 w-full flex-col items-center justify-center bg-cream px-[24px]">
      <div className="flex w-full max-w-[320px] flex-col items-center rounded-[1.25rem] border-2 border-outline bg-paper px-6 py-8 text-center shadow-brutal-sm">
        <Mascot pose="sitting" size={120} />
        <p className="mt-4 text-[22px] font-normal leading-tight">
          ไม่พบหน้านี้
        </p>
        <p className="mt-1 text-[15px] font-normal leading-snug text-dark-text/65">
          เนื้อหานี้อาจไม่มีอยู่ หรือคุณอาจไม่มีสิทธิ์เข้าถึง
        </p>

        <Link
          href="/"
          className="mt-5 flex h-[44px] w-full items-center justify-center rounded-[0.65rem] border-2 border-outline bg-[#cfe8b8] text-[18px] font-normal leading-none shadow-brutal-sm transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          กลับหน้าหลัก
        </Link>
        <Link
          href="/public"
          className="mt-3 flex h-[44px] w-full items-center justify-center rounded-[0.65rem] border-2 border-outline bg-soft-yellow text-[18px] font-normal leading-none shadow-brutal-sm transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          ไปห้องสาธารณะ
        </Link>
      </div>
    </main>
  );
}
