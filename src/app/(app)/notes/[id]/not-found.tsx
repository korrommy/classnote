import Link from "next/link";
import { Mascot } from "@/components/ui/Mascot";

// แสดงเมื่อ notes/[id] เรียก notFound() — ทั้งกรณีโน้ตไม่มีจริงและกรณี
// RLS ไม่ให้เห็น ใช้ข้อความเดียวกัน ไม่เปิดเผยว่าโน้ตมีอยู่หรือไม่
export default function NoteNotFound() {
  return (
    <main className="flex h-full min-h-0 w-full flex-col items-center justify-center bg-cream px-[24px]">
      <div className="flex w-full max-w-[320px] flex-col items-center rounded-[1.25rem] border-2 border-outline bg-paper px-6 py-8 text-center shadow-brutal-sm">
        <Mascot pose="sitting" size={120} />
        <p className="mt-4 text-[22px] font-normal leading-tight">
          ไม่พบโน้ตนี้
        </p>
        <p className="mt-1 text-[15px] font-normal leading-snug text-dark-text/65">
          โน้ตอาจถูกลบไปแล้ว หรือคุณอาจไม่มีสิทธิ์เข้าถึง
        </p>

        <Link
          href="/notes"
          className="mt-5 flex h-[44px] w-full items-center justify-center rounded-[0.65rem] border-2 border-outline bg-[#cfe8b8] text-[18px] font-normal leading-none shadow-brutal-sm transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          กลับไปหน้าโน้ต
        </Link>
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
