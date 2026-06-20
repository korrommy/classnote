-- ============================================================
-- ClassNote — 0011 Seed รายวิชา (subjects) ให้ห้องเรียนจริง
-- รันใน Supabase SQL Editor หลัง 0001–0010
--
-- ปัญหาเดิม: ห้องเรียนจริง (fixed UUID จาก 0009/0010) ไม่มีแถวใน subjects
-- ทำให้ dropdown "เลือกรายวิชา" ตอนโพสต์โน้ตว่างเปล่า (มีแต่ "ไม่ระบุวิชา")
--
-- ไฟล์นี้ seed รายวิชามาตรฐาน (ชุดเดียวกับ DEFAULT_SUBJECT_BANNERS ใน
-- src/lib/subjectImage.ts) ให้ทั้ง ม.5/1 และ ม.6/1
--
-- idempotent: subjects ไม่มี unique constraint (classroom_id, name)
-- จึงใช้ INSERT ... WHERE NOT EXISTS เพื่อรันซ้ำได้โดยไม่เกิดแถวซ้ำ
-- ไม่แตะ schema/RLS — เป็นการเติม data อย่างเดียว
-- ============================================================

insert into public.subjects (classroom_id, name, color, icon)
select c.id, v.name, v.color, v.icon
from (values
  ('คณิตศาสตร์',  '#CFE6F6', 'math'),
  ('ชีววิทยา',    '#CFE7B5', 'biology'),
  ('เคมี',        '#F7E38A', 'chemistry'),
  ('ดาราศาสตร์',  '#D9CBF6', 'astronomy'),
  ('ภาษาอังกฤษ',  '#F7C6D5', 'english'),
  ('ภาษาไทย',     '#CFE7B5', 'thai'),
  ('สังคมศึกษา',  '#F7E38A', 'social')
) as v(name, color, icon)
cross join public.classrooms c
where c.id in (
  'c0000000-0000-4000-8000-000000000401', -- ม.4/1
  'c0000000-0000-4000-8000-000000000501', -- ม.5/1
  'c0000000-0000-4000-8000-000000000601'  -- ม.6/1
)
and not exists (
  select 1 from public.subjects s
  where s.classroom_id = c.id and s.name = v.name
);
