import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { M6_TERM2_UNITS } from "@/lib/flashcards/m6-term-2-data";
import {
  M5Term1Player,
  type UnitProgress,
} from "@/components/flashcards/M5Term1Player";

export default async function M6Term2FlashcardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/welcome");

  // โหลด progress ที่บันทึกไว้ของผู้ใช้คนนี้ (RLS กรองให้เห็นเฉพาะของตัวเอง)
  // ถ้า query พลาด (เช่น ยังไม่ได้รัน migration 0008) เริ่มที่ศูนย์แบบเดิม
  const { data: rows } = await supabase
    .from("flashcard_progress")
    .select("deck_id, completed_card_ids, rounds")
    .eq("user_id", user.id)
    .in(
      "deck_id",
      M6_TERM2_UNITS.map((unit) => unit.deckId),
    );

  const initialProgress: Record<string, UnitProgress> = {};
  for (const row of rows ?? []) {
    initialProgress[row.deck_id] = {
      cardIds: Array.isArray(row.completed_card_ids)
        ? row.completed_card_ids
        : [],
      rounds: typeof row.rounds === "number" && row.rounds >= 0 ? row.rounds : 0,
    };
  }

  return (
    <M5Term1Player
      initialProgress={initialProgress}
      units={M6_TERM2_UNITS}
      grade="ม.6"
    />
  );
}
