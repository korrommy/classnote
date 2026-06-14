import { Mascot } from "@/components/ui/Mascot";

// หน้ารายละเอียดโน้ตโหลดหลายอย่าง (โน้ต + ไฟล์แนบ + คอมเมนต์ + signed URL)
// เลยมี fallback เฉพาะ segment นี้
export default function NoteDetailLoading() {
  return (
    <main className="flex h-full min-h-0 w-full flex-col items-center justify-center bg-cream px-[24px]">
      <div className="flex w-full max-w-[320px] flex-col items-center rounded-[1.25rem] border-2 border-outline bg-paper px-6 py-8 text-center shadow-brutal-sm">
        <Mascot pose="reading" size={120} priority />
        <p className="mt-4 text-[22px] font-normal leading-none">
          กำลังเปิดโน้ต...
        </p>
        <div className="mt-3 flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 animate-bounce rounded-full border-2 border-outline bg-pink-accent" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full border-2 border-outline bg-soft-yellow [animation-delay:120ms]" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full border-2 border-outline bg-mint [animation-delay:240ms]" />
        </div>
      </div>
    </main>
  );
}
