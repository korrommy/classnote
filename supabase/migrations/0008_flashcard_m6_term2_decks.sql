-- ============================================================
-- ClassNote — 0008 Flashcard Decks: ม.6 พื้นฐาน
-- รันใน Supabase SQL Editor หลัง 0001–0007
--
-- สร้าง deck กลาง 10 อันสำหรับหน้า /flashcards/m6/term-2
-- (Unit 01–10) ใช้ fixed UUID ให้ตรงกับ
-- src/lib/flashcards/m6-term-2-data.ts
-- classroom_id = null → ทุกคนที่ login เห็นได้ตาม policy decks_select เดิม
--
-- idempotent: รันซ้ำได้โดยไม่ error
-- ============================================================

insert into public.flashcard_decks (id, classroom_id, grade_level, title)
values
  ('a2000000-0000-4000-8000-000000000001', null, 'ม.6', 'ม.6 พื้นฐาน — 01 Getting Ready for College'),
  ('a2000000-0000-4000-8000-000000000002', null, 'ม.6', 'ม.6 พื้นฐาน — 02 Time to Set Sail'),
  ('a2000000-0000-4000-8000-000000000003', null, 'ม.6', 'ม.6 พื้นฐาน — 03 Healthy Thinking'),
  ('a2000000-0000-4000-8000-000000000004', null, 'ม.6', 'ม.6 พื้นฐาน — 04 Money Talks'),
  ('a2000000-0000-4000-8000-000000000005', null, 'ม.6', 'ม.6 พื้นฐาน — 05 Cultures Around the World'),
  ('a2000000-0000-4000-8000-000000000006', null, 'ม.6', 'ม.6 พื้นฐาน — 06 It''s a Masterpiece!'),
  ('a2000000-0000-4000-8000-000000000007', null, 'ม.6', 'ม.6 พื้นฐาน — 07 Deciding for Yourself'),
  ('a2000000-0000-4000-8000-000000000008', null, 'ม.6', 'ม.6 พื้นฐาน — 08 Crime Wave'),
  ('a2000000-0000-4000-8000-000000000009', null, 'ม.6', 'ม.6 พื้นฐาน — 09 Eat Up!'),
  ('a2000000-0000-4000-8000-000000000010', null, 'ม.6', 'ม.6 พื้นฐาน — 10 Learning Curve')
on conflict (id) do nothing;
