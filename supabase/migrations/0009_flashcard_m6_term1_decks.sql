-- ============================================================
-- ClassNote — 0009 Flashcard Decks: ม.6 อ่านเขียน
-- รันใน Supabase SQL Editor หลัง 0001–0008
--
-- สร้าง deck กลาง 10 อันสำหรับหน้า /flashcards/m6/term-1
-- (Unit 1–11, ข้าม Unit 3) ใช้ fixed UUID ให้ตรงกับ
-- src/lib/flashcards/m6-term-1-data.ts
-- classroom_id = null → ทุกคนที่ login เห็นได้ตาม policy decks_select เดิม
--
-- idempotent: รันซ้ำได้โดยไม่ error
-- ============================================================

insert into public.flashcard_decks (id, classroom_id, grade_level, title)
values
  ('a3000000-0000-4000-8000-000000000001', null, 'ม.6', 'ม.6 อ่านเขียน — Unit 1 Biometrics'),
  ('a3000000-0000-4000-8000-000000000002', null, 'ม.6', 'ม.6 อ่านเขียน — Unit 2 Cryptocurrency'),
  ('a3000000-0000-4000-8000-000000000003', null, 'ม.6', 'ม.6 อ่านเขียน — Unit 4 Helping Society'),
  ('a3000000-0000-4000-8000-000000000004', null, 'ม.6', 'ม.6 อ่านเขียน — Unit 5 Helping Environment'),
  ('a3000000-0000-4000-8000-000000000005', null, 'ม.6', 'ม.6 อ่านเขียน — Unit 6 Tourism'),
  ('a3000000-0000-4000-8000-000000000006', null, 'ม.6', 'ม.6 อ่านเขียน — Unit 7 Augmented Reality'),
  ('a3000000-0000-4000-8000-000000000007', null, 'ม.6', 'ม.6 อ่านเขียน — Unit 8 Advertising'),
  ('a3000000-0000-4000-8000-000000000008', null, 'ม.6', 'ม.6 อ่านเขียน — Unit 9 Attracting Visitors'),
  ('a3000000-0000-4000-8000-000000000009', null, 'ม.6', 'ม.6 อ่านเขียน — Unit 10 Money'),
  ('a3000000-0000-4000-8000-000000000010', null, 'ม.6', 'ม.6 อ่านเขียน — Unit 11 Robots')
on conflict (id) do nothing;
