-- ============================================================
-- ClassNote — 0007 Flashcard Progress Cards
-- รันใน Supabase SQL Editor หลัง 0001–0006
--
-- 1) เพิ่มคอลัมน์ completed_card_ids เก็บ "รายการการ์ดที่จำได้"
--    เพื่อ restore ได้ตรงตามจริงหลัง refresh (count อย่างเดียวไม่พอ
--    เพราะ logic กันนับซ้ำต้องรู้ว่าการ์ดใบไหนจำได้แล้ว)
-- 2) สร้าง deck กลาง 16 อันสำหรับหน้า /flashcards/m5/term-1
--    (Unit 1.1 – 8.2) ใช้ fixed UUID ให้ตรงกับ
--    src/lib/flashcards/m5-term-1-data.ts
--    classroom_id = null → ทุกคนที่ login เห็นได้ตาม policy decks_select เดิม
--
-- ไม่มีการแก้ RLS — policies เดิมของ flashcard_progress
-- (progress_select_own / progress_insert_own / progress_update_own)
-- ครอบคลุม select + upsert ของผู้ใช้เองอยู่แล้ว
--
-- idempotent: รันซ้ำได้โดยไม่ error
-- ============================================================

alter table public.flashcard_progress
  add column if not exists completed_card_ids text[] not null default '{}';

insert into public.flashcard_decks (id, classroom_id, grade_level, title)
values
  ('a1000000-0000-4000-8000-000000000001', null, 'ม.5', 'ม.5 เทอม 1 — Unit 1.1 Right Brain, Left Brain'),
  ('a1000000-0000-4000-8000-000000000002', null, 'ม.5', 'ม.5 เทอม 1 — Unit 1.2 Let''s Face It'),
  ('a1000000-0000-4000-8000-000000000003', null, 'ม.5', 'ม.5 เทอม 1 — Unit 2.1 Eat Potatoes!'),
  ('a1000000-0000-4000-8000-000000000004', null, 'ม.5', 'ม.5 เทอม 1 — Unit 2.2 Tasty Dishes'),
  ('a1000000-0000-4000-8000-000000000005', null, 'ม.5', 'ม.5 เทอม 1 — Unit 3.1 Tihar — Festival of Lights'),
  ('a1000000-0000-4000-8000-000000000006', null, 'ม.5', 'ม.5 เทอม 1 — Unit 3.2 Fifteenth Birthday'),
  ('a1000000-0000-4000-8000-000000000007', null, 'ม.5', 'ม.5 เทอม 1 — Unit 4.1 Dream to Fly'),
  ('a1000000-0000-4000-8000-000000000008', null, 'ม.5', 'ม.5 เทอม 1 — Unit 4.2 The Fearless Fiennes'),
  ('a1000000-0000-4000-8000-000000000009', null, 'ม.5', 'ม.5 เทอม 1 — Unit 5.1 Lightning'),
  ('a1000000-0000-4000-8000-000000000010', null, 'ม.5', 'ม.5 เทอม 1 — Unit 5.2 Chasing Storms'),
  ('a1000000-0000-4000-8000-000000000011', null, 'ม.5', 'ม.5 เทอม 1 — Unit 6.1 The GoPro Camera'),
  ('a1000000-0000-4000-8000-000000000012', null, 'ม.5', 'ม.5 เทอม 1 — Unit 6.2 Changing Living Things?'),
  ('a1000000-0000-4000-8000-000000000013', null, 'ม.5', 'ม.5 เทอม 1 — Unit 7.1 Flowers, Dishes, and Dress'),
  ('a1000000-0000-4000-8000-000000000014', null, 'ม.5', 'ม.5 เทอม 1 — Unit 7.2 What''s in a Name?'),
  ('a1000000-0000-4000-8000-000000000015', null, 'ม.5', 'ม.5 เทอม 1 — Unit 8.1 Months'),
  ('a1000000-0000-4000-8000-000000000016', null, 'ม.5', 'ม.5 เทอม 1 — Unit 8.2 Fate')
on conflict (id) do nothing;
