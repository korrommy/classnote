import Link from "next/link";
import { Mascot } from "@/components/ui/Mascot";

// 404 ระดับ root — URL ที่ไม่ตรงกับ route ไหนเลย (เช่น /xyz)
// อยู่นอก (app) layout จึงไม่มี BottomNav
export default function RootNotFound() {
  return (
    <main className="flex min-h-dvh w-full flex-col items-center justify-center bg-cream px-[24px] md:min-h-0 md:flex-1">
      <div className="flex w-full max-w-[320px] flex-col items-center rounded-[1.25rem] border-2 border-outline bg-paper px-6 py-8 text-center shadow-brutal-sm">
        <Mascot pose="duo" size={130} />
        <p className="mt-4 text-[22px] font-normal leading-tight">
          ไม่พบหน้าที่ต้องการ
        </p>
        <p className="mt-1 text-[15px] font-normal leading-snug text-dark-text/65">
          ลิงก์อาจพิมพ์ผิด หรือหน้านี้อาจไม่มีอยู่แล้ว
        </p>

        <Link
          href="/"
          className="mt-5 flex h-[44px] w-full items-center justify-center rounded-[0.65rem] border-2 border-outline bg-[#cfe8b8] text-[18px] font-normal leading-none shadow-brutal-sm transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </main>
  );
}
