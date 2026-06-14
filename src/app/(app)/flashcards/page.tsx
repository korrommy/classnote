import Link from "next/link";

type Deck = {
  id: string;
  title: string;
  color: string;
  href: string;
};

const decks: Deck[] = [
  { id: "m4-reading-a", title: "ม.4 อ่านเขียน", color: "#f8e68b", href: "/flashcards/m4/term-1" },
  { id: "m4-reading-b", title: "ม.4 พื้นฐาน", color: "#f8e68b", href: "/flashcards/m4/term-2" },
  { id: "m5-reading-a", title: "ม.5 อ่านเขียน", color: "#f5bfd0", href: "/flashcards/m5/term-1" },
  { id: "m5-reading-b", title: "ม.5 พื้นฐาน", color: "#f5bfd0", href: "/flashcards/m5/term-2" },
  { id: "m6-reading-a", title: "ม.6 อ่านเขียน", color: "#cbb8f1", href: "/flashcards/m6/term-1" },
  { id: "m6-reading-b", title: "ม.6 พื้นฐาน", color: "#cbb8f1", href: "/flashcards/m6/term-2" },
];

export default function FlashcardsPage() {
  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-cream px-6 pb-[12px] pt-[56px]">
      <header className="flex-none">
        <h1 className="flashcard-title text-[54px] leading-none">
          <span className="text-soft-yellow">Flash</span>
          <span className="text-[#d7efc3]">cards</span>
        </h1>
        <p className="mt-1 text-[22px] font-[500] leading-tight">
          วันนี้ได้ทวนคำศัพท์หรือยัง
        </p>
      </header>

      <section className="mt-4 flex h-[545px] flex-none flex-col rounded-[1.25rem] border-2 border-outline bg-[#cfe8f7] px-6 pb-4 pt-5">
        <div className="grid flex-none grid-cols-2 justify-items-center gap-x-10 gap-y-5">
          {decks.map((deck) => (
            <Link
              key={deck.id}
              href={deck.href}
              className="flex min-w-[118px] flex-col items-center text-center"
            >
              <BookCover color={deck.color} />
              <span className="mt-1.5 whitespace-nowrap text-[17px] font-[500] leading-none">
                {deck.title}
              </span>
            </Link>
          ))}
        </div>

        <Link
          href="/"
          className="mt-14 flex h-[42px] w-[122px] flex-none items-center justify-center rounded-[0.55rem] border-2 border-outline bg-[#cfe8b8] text-[1.45rem] font-[500] leading-none shadow-[3px_4px_0_#080808] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          กลับ
        </Link>
      </section>
    </main>
  );
}

function BookCover({ color }: { color: string }) {
  return (
    <span className="relative block h-[86px] w-[66px]">
      <span
        className="absolute left-[-10px] top-[7px] h-[80px] w-[59px] rotate-[-5deg] rounded-[0.42rem] border-2 border-outline shadow-[0_7px_9px_rgba(8,8,8,0.16)]"
        style={{ backgroundColor: color }}
      />
      <span
        className="absolute left-[3px] top-0 h-[84px] w-[61px] rotate-[5deg] rounded-[0.42rem] border-2 border-outline shadow-[0_7px_9px_rgba(8,8,8,0.18)]"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}
