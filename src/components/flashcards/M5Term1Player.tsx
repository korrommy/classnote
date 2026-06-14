"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { Check, Heart, RefreshCw } from "lucide-react";
import { saveFlashcardProgress } from "@/lib/flashcards/actions";
import { M5_TERM1_UNITS, type FlashcardUnit } from "@/lib/flashcards/m5-term-1-data";

export type UnitProgress = { cardIds: string[]; rounds: number };

export function M5Term1Player({
  initialProgress,
  units = M5_TERM1_UNITS,
  grade = "ม.5",
}: {
  initialProgress: Record<string, UnitProgress>;
  units?: FlashcardUnit[];
  grade?: string;
}) {
  const [selectedUnitIndex, setSelectedUnitIndex] = useState(0);
  const [unitOpen, setUnitOpen] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  // Progress per deck, seeded from the server so refresh restores it.
  // Card IDs are deduped on write, so looping back never inflates the count.
  const [progressByDeck, setProgressByDeck] =
    useState<Record<string, UnitProgress>>(initialProgress);

  const activeUnit = units[selectedUnitIndex];
  const currentCard = activeUnit.cards[currentCardIndex];
  const totalWords = activeUnit.cards.length;

  const activeProgress = progressByDeck[activeUnit.deckId] ?? {
    cardIds: [],
    rounds: 0,
  };
  // Count only IDs that belong to this unit, in case stored data drifts.
  const unitCardIds = new Set(activeUnit.cards.map((card) => card.id));
  const rememberedWords = activeProgress.cardIds.filter((id) =>
    unitCardIds.has(id),
  ).length;
  const reviewCount = activeProgress.rounds;
  const progressPercent =
    totalWords > 0 ? Math.round((rememberedWords / totalWords) * 100) : 0;

  function selectUnit(index: number) {
    setSelectedUnitIndex(index);
    setUnitOpen(false);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    // Saved progress for the target unit is restored from progressByDeck.
  }

  // First tap : flip card to show meaning.
  // Second tap: mark current card completed, advance to next, reset to front.
  function handleCardClick() {
    if (!isFlipped) {
      setIsFlipped(true);
      return;
    }

    const nextIndex = (currentCardIndex + 1) % activeUnit.cards.length;
    const nextCardIds = activeProgress.cardIds.includes(currentCard.id)
      ? activeProgress.cardIds
      : [...activeProgress.cardIds, currentCard.id];
    // Increment the "rounds reviewed" counter whenever the deck loops.
    const nextRounds =
      nextIndex === 0 ? activeProgress.rounds + 1 : activeProgress.rounds;

    setProgressByDeck((prev) => ({
      ...prev,
      [activeUnit.deckId]: { cardIds: nextCardIds, rounds: nextRounds },
    }));
    setCurrentCardIndex(nextIndex);
    setIsFlipped(false);

    // Fire-and-forget save — UI stays optimistic even if the network fails.
    void saveFlashcardProgress(activeUnit.deckId, nextCardIds, nextRounds);
  }

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-y-auto bg-cream px-[18px] pt-[54px]">
      <header className="mx-auto w-full max-w-[356px] flex-none">
        <h1 className="flashcard-title whitespace-nowrap text-[60px] leading-none">
          <span className="text-pink-accent">คำ</span>
          <span className="text-green-accent">ศัพท์</span>
          <span className="text-soft-yellow">{grade}</span>
        </h1>
        <p className="mt-1 mb-[10px] text-[28px] font-[500] leading-tight">
          ท่องศัพท์ให้สนุกนะ
        </p>
      </header>

      <section className="mx-auto flex w-full max-w-[356px] flex-1 min-h-0 flex-col overflow-y-auto rounded-[1.25rem] border-2 border-outline bg-[#cfe8f7] px-[20px] pt-[18px] pb-[18px]">
        <UnitSelector
          selectedUnit={activeUnit.name}
          isOpen={unitOpen}
          units={units.map((u) => u.name)}
          onToggle={() => setUnitOpen((open) => !open)}
          onSelect={(name) => selectUnit(units.findIndex((u) => u.name === name))}
        />
        <VocabularyCard
          word={currentCard.word}
          meaning={currentCard.meaning}
          isFlipped={isFlipped}
          onCardClick={handleCardClick}
        />
        <ProgressCard
          progressPercent={progressPercent}
          rememberedWords={rememberedWords}
          totalWords={totalWords}
          reviewCount={reviewCount}
        />
        <MascotSection />
        <BackButton />
      </section>
    </main>
  );
}

// ─── Unit Selector ────────────────────────────────────────────────────────────

function UnitSelector({
  selectedUnit,
  isOpen,
  units,
  onToggle,
  onSelect,
}: {
  selectedUnit: string;
  isOpen: boolean;
  units: string[];
  onToggle: () => void;
  onSelect: (unitName: string) => void;
}) {
  return (
    <div className="relative z-30 flex-none">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex h-[54px] w-full min-w-0 items-center rounded-[0.9rem] border-2 border-outline bg-paper pl-[10px] pr-[14px] text-left"
      >
        <span className="flex h-full w-[50px] flex-none items-center justify-center border-r-2 border-outline">
          <Image
            src="/icons/flashcards/abc.png"
            alt=""
            width={42}
            height={42}
            className="h-[42px] w-[42px] object-contain"
          />
        </span>
        <span className="min-w-0 flex-1 truncate pl-3 text-[20px] font-[500] leading-none">
          {selectedUnit}
        </span>
        <span
          aria-hidden
          className="ml-3 h-0 w-0 flex-none border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-outline"
        />
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[60px] max-h-[280px] overflow-y-auto rounded-[0.8rem] border-2 border-outline bg-paper p-1 shadow-[3px_4px_0_#080808] [scrollbar-width:thin]">
          {units.map((unit) => (
            <button
              key={unit}
              type="button"
              onClick={() => onSelect(unit)}
              className="flex min-h-[36px] w-full items-center rounded-[0.55rem] px-3 py-1 text-left text-[16px] font-[500] leading-tight hover:bg-[#e7d9fb]"
            >
              {unit}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ─── Vocabulary Card ──────────────────────────────────────────────────────────

function VocabularyCard({
  word,
  meaning,
  isFlipped,
  onCardClick,
}: {
  word: string;
  meaning: string;
  isFlipped: boolean;
  onCardClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCardClick}
      className="relative mt-[14px] h-[158px] w-full flex-none rounded-[1rem] border-2 border-outline bg-paper px-[14px] py-[14px] text-center [perspective:900px]"
    >
      <Heart
        className="absolute -right-1 top-3 z-20 h-[40px] w-[40px] fill-[#ff6d70] stroke-[#6c78bf] stroke-[1.5]"
        aria-hidden
      />
      <div
        className={`relative h-full w-full rounded-[0.8rem] transition-transform duration-300 [transform-style:preserve-3d] ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        <div className="absolute inset-0 flex items-center justify-center rounded-[0.8rem] border-2 border-outline bg-paper px-3 [backface-visibility:hidden]">
          <h2 className="max-w-full break-words text-[34px] font-[500] leading-tight">
            {word}
          </h2>
        </div>
        <div className="absolute inset-0 flex items-center justify-center rounded-[0.8rem] border-2 border-outline bg-[#fff7d8] px-3 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <h2 className="max-w-full break-words text-[30px] font-[500] leading-tight">
            {meaning}
          </h2>
        </div>
      </div>
      {/* Label changes to guide the user through both taps */}
      <div className="absolute bottom-[-14px] left-1/2 z-20 flex h-[30px] w-[184px] -translate-x-1/2 items-center justify-center rounded-full border-2 border-outline bg-[#e7d9fb] text-[16px] font-[500] leading-none">
        {isFlipped ? "แตะเพื่อไปคำถัดไป ›" : "แตะเพื่อพลิกการ์ด"}
      </div>
    </button>
  );
}

// ─── Progress Card ────────────────────────────────────────────────────────────

function ProgressCard({
  progressPercent,
  rememberedWords,
  totalWords,
  reviewCount,
}: {
  progressPercent: number;
  rememberedWords: number;
  totalWords: number;
  reviewCount: number;
}) {
  return (
    <section className="mt-[16px] flex h-[134px] w-full flex-none items-center rounded-[1rem] border-2 border-outline bg-[#eefcdf] px-[12px] py-[11px]">
      <CircleProgress rememberedWords={rememberedWords} totalWords={totalWords} />

      <div className="ml-[12px] min-w-0 flex-1 overflow-hidden">
        <h3 className="whitespace-nowrap text-[18px] font-[500] leading-tight">
          ความคืบหน้าในการท่อง
        </h3>
        <div className="mt-2 h-[24px] w-full overflow-hidden rounded-[0.45rem] border-2 border-outline bg-paper">
          <div
            className="h-full bg-[#cfe8b8] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-2 whitespace-nowrap text-[18px] font-[500] leading-none">
          เยี่ยมมาก เริ่ดดด!!!
        </p>
        <div className="mt-2 flex min-w-0 gap-1.5">
          <Badge
            icon={<Check className="h-3.5 w-3.5 stroke-[3]" />}
            text={`จำได้แล้ว ${rememberedWords}`}
          />
          <Badge
            icon={<RefreshCw className="h-3.5 w-3.5 stroke-[2.4]" />}
            text={`ทบทวน ${reviewCount} รอบ`}
          />
        </div>
      </div>
    </section>
  );
}

// Circular progress indicator — SVG ring driven by rememberedWords / totalWords.
function CircleProgress({
  rememberedWords,
  totalWords,
}: {
  rememberedWords: number;
  totalWords: number;
}) {
  const size = 104;
  const strokeWidth = 7;
  const r = (size - strokeWidth) / 2 - 4;
  const circumference = 2 * Math.PI * r;
  const ratio = totalWords > 0 ? rememberedWords / totalWords : 0;
  const dashOffset = circumference * (1 - ratio);

  return (
    <div className="relative flex h-[104px] w-[104px] flex-none items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        aria-hidden
      >
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 1.5} fill="#d3fb99" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 1.5}
          fill="none"
          stroke="#080808"
          strokeWidth="3"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#b8f07a"
          strokeWidth={strokeWidth}
          strokeOpacity="0.5"
        />
        {ratio > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#5ec94a"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="transition-all duration-500"
          />
        )}
      </svg>
      <div className="relative z-10 flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full border-2 border-outline bg-paper text-center">
        <span className="text-[37px] font-[500] leading-none">
          {rememberedWords}
        </span>
        <span className="text-[19px] font-[500] leading-none">
          / {totalWords} คำ
        </span>
      </div>
    </div>
  );
}

function Badge({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="flex h-[23px] min-w-0 items-center gap-0.5 rounded-[0.45rem] border-2 border-outline bg-paper px-1.5 text-[10px] font-[500] leading-none">
      <span className="text-[#61c356]">{icon}</span>
      <span className="whitespace-nowrap">{text}</span>
    </span>
  );
}

// ─── Mascot Section ───────────────────────────────────────────────────────────
function MascotSection() {
  return (
    // To adjust mascot area height: change h-[196px].
    // To adjust spacing above: change mt-[2px].
    <div className="relative mx-auto mt-[2px] h-[222px] w-full max-w-[286px] flex-none">
      <MascotImage />
    </div>
  );
}

function MascotImage() {
  // To adjust mascot size: change h-[252px] w-[252px].
  // To nudge vertical position: change top-[-16px].
  return (
    <Image
      src="/mascot/flashcard.gif"
      alt="น้องดาวท่องศัพท์"
      width={300}
      height={300}
      unoptimized
      // มาสคอตเป็นภาพตกแต่งและล้นลงมาทับปุ่ม "กลับ" — ปิด pointer-events
      // เพื่อให้แตะทะลุไปโดนปุ่มด้านล่างได้ (ไม่งั้นปุ่มกลับกดไม่ติด)
      className="pointer-events-none absolute left-1/2 top-[-16px] z-10 h-[300px] w-[300px] -translate-x-1/2 object-contain"
    />
  );
}

// ─── Back Button ──────────────────────────────────────────────────────────────

function BackButton() {
  return (
    <Link
      href="/flashcards"
      className="relative z-10 mt-[10px] flex h-[44px] w-[122px] flex-none items-center justify-center rounded-[0.55rem] border-2 border-outline bg-[#cfe8b8] text-[26px] font-[500] leading-none shadow-[3px_4px_0_#080808] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
    >
      กลับ
    </Link>
  );
}
