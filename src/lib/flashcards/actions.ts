"use server";

import { createClient } from "@/lib/supabase/server";
import { M5_TERM1_UNITS } from "@/lib/flashcards/m5-term-1-data";
import { M6_TERM1_UNITS } from "@/lib/flashcards/m6-term-1-data";
import { M6_TERM2_UNITS } from "@/lib/flashcards/m6-term-2-data";

export type FlashcardSaveResult = { ok: boolean };

const MAX_ROUNDS = 9999;

// ทุก unit ที่บันทึก progress ได้ (M.5 เทอม 1 + M.6 อ่านเขียน + M.6 เทอม 2)
// player ตัวเดียวกันถูกใช้ทุกเด็ค จึงต้องรู้จัก deckId ของทั้งหมด
// ไม่งั้น save ของเด็คที่ไม่รู้จักจะถูกปฏิเสธเงียบ ๆ (progress ไม่ถูกเก็บ)
const ALL_UNITS = [...M5_TERM1_UNITS, ...M6_TERM1_UNITS, ...M6_TERM2_UNITS];

export async function saveFlashcardProgress(
  deckId: string,
  cardIds: string[],
  rounds: number,
): Promise<FlashcardSaveResult> {
  const unit = ALL_UNITS.find((u) => u.deckId === deckId);
  if (!unit) return { ok: false };

  // เก็บเฉพาะ id ที่เป็นการ์ดจริงของ unit นี้ + กันซ้ำ
  const validIds = new Set(unit.cards.map((card) => card.id));
  const completedCardIds = Array.from(
    new Set(
      (Array.isArray(cardIds) ? cardIds : []).filter(
        (id) => typeof id === "string" && validIds.has(id),
      ),
    ),
  );

  const safeRounds =
    Number.isInteger(rounds) && rounds >= 0
      ? Math.min(rounds, MAX_ROUNDS)
      : 0;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  // RLS อนุญาต insert/update เฉพาะแถวของตัวเอง — upsert จึงปลอดภัย
  const { error } = await supabase.from("flashcard_progress").upsert(
    {
      deck_id: deckId,
      user_id: user.id,
      completed_card_ids: completedCardIds,
      completed_count: completedCardIds.length,
      rounds: safeRounds,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "deck_id,user_id" },
  );

  return { ok: !error };
}
