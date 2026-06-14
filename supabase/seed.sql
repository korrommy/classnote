-- ============================================================
-- ⛔️⛔️⛔️ DEV ONLY — DO NOT RUN IN PRODUCTION ⛔️⛔️⛔️
-- ห้ามรันไฟล์นี้บนฐานข้อมูล production เด็ดขาด
-- ------------------------------------------------------------
-- ไฟล์นี้สร้างห้องเรียน (ม.6/1, ม.6/2) ด้วย UUID แบบสุ่ม (gen_random_uuid)
-- ซึ่ง "ไม่ตรง" กับ fixed UUID ที่ระบบใช้จริง:
--   - migrations 0009 (ม.6/1) / 0010 (ม.5/1)
--   - รายการห้อง static ใน src/lib/classrooms.ts
--   - subjects seed ใน 0011
-- ถ้ารันบน production จะได้ห้องซ้ำ/ห้องลอยที่นักเรียน claim เข้าไม่ได้
-- และ subjects จะไปผูกกับห้องผิด (ห้องสุ่ม) → dropdown/ฟีดเพี้ยน
--
-- ✅ Production ให้รัน migrations 0001–0011 ตามลำดับเท่านั้น (ไม่ต้องรันไฟล์นี้)
-- ✅ ไฟล์นี้ไว้สำหรับ local dev / ทดสอบเท่านั้น
-- ============================================================
--
-- ClassNote — Seed ตัวอย่าง (ปรับแก้ได้ตาม data จริง) — DEV ONLY
-- รันหลัง 0001-0003 ถ้าต้องการข้อมูลทดสอบบนเครื่อง dev
-- ============================================================

-- ---------- ห้องเรียนตัวอย่าง ----------
insert into public.classrooms (name, grade_level, room)
values
  ('ม.6/1', 'ม.6', '6/1'),
  ('ม.6/2', 'ม.6', '6/2')
on conflict do nothing;

-- ---------- รายชื่อนักเรียน (student_roster) ----------
-- แทนที่ด้วย data จริงของคุณ: (เลขประจำตัว, ชื่อ-นามสกุล) แยกตามห้อง
insert into public.student_roster (classroom_id, student_no, full_name)
select c.id, v.student_no, v.full_name
from (values
  ('6/1', '1',  'นายเอ ใจดี'),
  ('6/1', '2',  'นางสาวบี ตั้งใจ'),
  ('6/1', '3',  'นายซี ขยัน'),
  ('6/2', '1',  'นายดี เก่งกาจ'),
  ('6/2', '2',  'นางสาวอี รักเรียน')
) as v(room, student_no, full_name)
join public.classrooms c on c.room = v.room
on conflict (classroom_id, student_no) do nothing;

-- ---------- วิชาตัวอย่างของห้อง 6/1 ----------
insert into public.subjects (classroom_id, name, color, icon)
select c.id, v.name, v.color, v.icon
from (values
  ('คณิตศาสตร์', '#CFE6F6', 'math'),
  ('ภาษาอังกฤษ', '#F7C6D5', 'english'),
  ('เคมี',       '#F7E38A', 'chem'),
  ('ภาษาไทย',    '#CFE7B5', 'thai')
) as v(name, color, icon)
cross join public.classrooms c
where c.room = '6/1'
on conflict do nothing;

-- ============================================================
-- วิธีตั้ง Super Admin (รันหลังจากคุณสมัคร user ตัวเองแล้ว)
-- แทนที่อีเมลด้วยอีเมลที่คุณใช้สมัคร
-- ============================================================
-- update public.profiles
--   set is_super_admin = true
--   where id = (select id from auth.users where email = 'YOUR_EMAIL@example.com');
