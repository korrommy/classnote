-- ============================================================
-- ClassNote — 0005 Interactions
-- note_likes, saved_notes, comments
-- รันไฟล์นี้หลัง 0001–0004
-- ============================================================
--
-- การเปลี่ยนแปลงจาก draft ต้นฉบับ:
--
-- 1. likes_select: เปลี่ยนจาก `auth.uid() is not null`
--    เป็น `public.can_access_note(note_id)` เพื่อป้องกัน
--    ผู้ใช้จากห้องอื่นเห็นว่าใครกด like โน้ตส่วนตัว
--
-- 2. comments_insert_own: เพิ่ม `and public.can_access_note(note_id)`
--    เพื่อกันผู้ใช้จากห้องอื่นแอบคอมเมนต์โน้ตส่วนตัว
--    โดยเดา note_id
--
-- 3. ทุก policy ใช้ `drop policy if exists` ก่อน `create policy`
--    เพื่อให้ migration นี้รันซ้ำได้โดยไม่ error (idempotent)
--    ตามรูปแบบของ 0004_public_room_access.sql
-- ============================================================


-- ============================================================
-- note_likes: ระบบกดหัวใจโพสต์
-- ============================================================

create table if not exists public.note_likes (
  note_id    uuid not null references public.notes(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (note_id, user_id)
);

alter table public.note_likes enable row level security;

-- อ่านได้เฉพาะ like ของโน้ตที่ตัวเองมีสิทธิ์เข้าถึง
-- (public.can_access_note ตรวจ visibility + classroom membership + super_admin)
drop policy if exists "likes_select" on public.note_likes;
create policy "likes_select"
  on public.note_likes
  for select
  using (public.can_access_note(note_id));

-- insert ได้เฉพาะ user_id ของตัวเอง
drop policy if exists "likes_insert_own" on public.note_likes;
create policy "likes_insert_own"
  on public.note_likes
  for insert
  with check (user_id = auth.uid());

-- ลบได้เฉพาะ like ของตัวเอง
drop policy if exists "likes_delete_own" on public.note_likes;
create policy "likes_delete_own"
  on public.note_likes
  for delete
  using (user_id = auth.uid());

create index if not exists idx_likes_note on public.note_likes(note_id);
create index if not exists idx_likes_user on public.note_likes(user_id);


-- ============================================================
-- saved_notes: ระบบบันทึกโพสต์ / Bookmark
-- ============================================================

create table if not exists public.saved_notes (
  id         uuid primary key default gen_random_uuid(),
  note_id    uuid not null references public.notes(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (note_id, user_id)
);

alter table public.saved_notes enable row level security;

-- เห็นได้เฉพาะ bookmark ของตัวเอง (bookmark เป็นข้อมูลส่วนตัว)
drop policy if exists "saves_select_own" on public.saved_notes;
create policy "saves_select_own"
  on public.saved_notes
  for select
  using (user_id = auth.uid());

-- บันทึกได้เฉพาะ user_id ของตัวเอง
drop policy if exists "saves_insert_own" on public.saved_notes;
create policy "saves_insert_own"
  on public.saved_notes
  for insert
  with check (user_id = auth.uid());

-- ลบได้เฉพาะ bookmark ของตัวเอง
drop policy if exists "saves_delete_own" on public.saved_notes;
create policy "saves_delete_own"
  on public.saved_notes
  for delete
  using (user_id = auth.uid());

create index if not exists idx_saves_user on public.saved_notes(user_id);
create index if not exists idx_saves_note on public.saved_notes(note_id);


-- ============================================================
-- comments: ระบบคอมเมนต์ใต้โพสต์
-- ============================================================

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  note_id    uuid not null references public.notes(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

-- อ่านได้ถ้าเข้าถึงโน้ตนั้นได้
-- (visibility public/both = ทุกคนที่ login, classroom = สมาชิกห้องเดียวกัน)
drop policy if exists "comments_select" on public.comments;
create policy "comments_select"
  on public.comments
  for select
  using (
    exists (
      select 1
      from public.notes n
      where n.id = note_id
        and (
          n.visibility in ('public', 'both')
          or public.is_member_of(n.classroom_id)
        )
    )
  );

-- คอมเมนต์ได้เฉพาะ author_id ของตัวเอง
-- และต้องมีสิทธิ์เข้าถึงโน้ตนั้นจริงๆ ก่อน (ป้องกัน comment โน้ตห้องอื่น)
drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own"
  on public.comments
  for insert
  with check (
    author_id = auth.uid()
    and public.can_access_note(note_id)
  );

-- ลบได้เฉพาะ comment ของตัวเอง
drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own"
  on public.comments
  for delete
  using (author_id = auth.uid());

create index if not exists idx_comments_note   on public.comments(note_id);
create index if not exists idx_comments_author on public.comments(author_id);
