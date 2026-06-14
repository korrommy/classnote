import Image from "next/image";
import Link from "next/link";

const GRADE_LABEL: Record<string, string> = {
  m4: "ม.4",
  m5: "ม.5",
  m6: "ม.6",
};

const TERM_LABEL: Record<string, string> = {
  "term-1": "เทอม 1",
  "term-2": "เทอม 2",
};

export default async function FlashcardDeckPage({
  params,
}: {
  params: Promise<{ grade: string; term: string }>;
}) {
  const { grade, term } = await params;
  const gradeLabel = GRADE_LABEL[grade] ?? grade.toUpperCase();
  const termLabel = TERM_LABEL[term] ?? term;

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-cream px-[18px] pt-[54px]">
      <header className="mx-auto w-full max-w-[356px] flex-none">
        <h1 className="flashcard-title whitespace-nowrap text-[60px] leading-none">
          <span className="text-pink-accent">คำ</span>
          <span className="text-green-accent">ศัพท์</span>
          <span className="text-soft-yellow">{gradeLabel}</span>
        </h1>
        <p className="mb-[10px] mt-1 text-[26px] font-[500] leading-tight text-dark-text/80">
          {termLabel}
        </p>
      </header>

      <section className="mx-auto flex min-h-0 w-full max-w-[356px] flex-1 flex-col items-center justify-center overflow-hidden rounded-[1.25rem] border-2 border-outline bg-[#cfe8f7] px-[20px] py-[24px]">
        <Image
          src="/mascot/flashcard.gif"
          alt="น้องดาวท่องศัพท์"
          width={200}
          height={200}
          unoptimized
          className="h-[200px] w-[200px] object-contain"
        />

        <p className="mt-4 text-[24px] font-[500] leading-none">กำลังจัดเตรียม</p>
        <p className="mt-2 text-center text-[17px] font-[500] leading-tight text-dark-text/65">
          คำศัพท์ {gradeLabel} {termLabel}
          <br />
          เร็วๆ นี้ ✦
        </p>

        <Link
          href="/flashcards"
          className="mt-8 flex h-[44px] w-[122px] flex-none items-center justify-center rounded-[0.55rem] border-2 border-outline bg-[#cfe8b8] text-[22px] font-[500] leading-none shadow-[3px_4px_0_#080808] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          กลับ
        </Link>
      </section>
    </main>
  );
}
