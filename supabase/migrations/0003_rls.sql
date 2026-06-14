-- ============================================================
-- ClassNote — 0003 Row Level Security (RLS)
-- รันไฟล์นี้เป็นไฟล์ที่สาม (หลัง 0002)
-- หลักการ: แต่ละห้องแยกขาดกัน เห็นข้ามห้องไม่ได้
--           ยกเว้น notes ที่ visibility = public/both
-- ============================================================

-- เปิด RLS ทุกตาราง
alter table public.profiles            enable row level security;
alter table public.classrooms          enable row level security;
alter table public.classroom_members   enable row level security;
alter table public.student_roster      enable row level security;
alter table public.subjects            enable row level security;
alter table public.notes               enable row level security;
alter table public.note_files          enable row level security;
alter table public.assignments         enable row level security;
alter table public.assignment_status   enable row level security;
alter table public.announcements       enable row level security;
alter table public.flashcard_decks     enable row level security;
alter table public.flashcards          enable row level security;
alter table public.flashcard_progress  enable row level security;

-- ============================================================
-- profiles
-- ============================================================
create policy "profiles_select" on public.profiles
  for select using (
    id = auth.uid()
    or public.is_super_admin()
    or (classroom_id is not null and public.is_member_of(classroom_id))
  );

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid() or public.is_super_admin());
-- หมายเหตุ: ฟิลด์ตัวตนถูกล็อกด้วย trigger guard_profile_update

-- ============================================================
-- classrooms — รายชื่อห้องเปิดให้ผู้ login เห็นได้ (ใช้เลือกห้องตอนสมัคร)
-- ============================================================
create policy "classrooms_select" on public.classrooms
  for select using (auth.uid() is not null);

create policy "classrooms_admin_write" on public.classrooms
  for all using (public.is_super_admin())
  with check (public.is_super_admin());

-- ============================================================
-- classroom_members
-- ============================================================
create policy "members_select" on public.classroom_members
  for select using (
    user_id = auth.uid()
    or public.is_member_of(classroom_id)
    or public.is_super_admin()
  );

create policy "members_admin_write" on public.classroom_members
  for all using (public.is_super_admin() or public.is_class_admin(classroom_id))
  with check (public.is_super_admin() or public.is_class_admin(classroom_id));
-- การเข้าห้องปกติทำผ่าน claim_roster (SECURITY DEFINER)

-- ============================================================
-- student_roster — เฉพาะ Super Admin (จับคู่ผ่าน claim_roster)
-- ============================================================
create policy "roster_admin_all" on public.student_roster
  for all using (public.is_super_admin())
  with check (public.is_super_admin());

-- ============================================================
-- subjects
-- ============================================================
create policy "subjects_select" on public.subjects
  for select using (public.is_member_of(classroom_id) or public.is_super_admin());

create policy "subjects_admin_write" on public.subjects
  for all using (public.is_class_admin(classroom_id) or public.is_super_admin())
  with check (public.is_class_admin(classroom_id) or public.is_super_admin());

-- ============================================================
-- notes — หัวใจของการแยกห้อง
-- ============================================================
create policy "notes_select" on public.notes
  for select using (
    visibility in ('public', 'both')
    or (classroom_id is not null and public.is_member_of(classroom_id))
    or public.is_super_admin()
  );

create policy "notes_insert_own" on public.notes
  for insert with check (
    author_id = auth.uid()
    and (
      visibility in ('public', 'both')
      or (classroom_id is not null and public.is_member_of(classroom_id))
    )
  );

create policy "notes_update_own" on public.notes
  for update using (
    author_id = auth.uid()
    or (classroom_id is not null and public.is_class_admin(classroom_id))
    or public.is_super_admin()
  );

create policy "notes_delete_own" on public.notes
  for delete using (
    author_id = auth.uid()
    or (classroom_id is not null and public.is_class_admin(classroom_id))
    or public.is_super_admin()
  );

-- ============================================================
-- note_files — ตามสิทธิ์ของ note
-- ============================================================
create policy "note_files_select" on public.note_files
  for select using (public.can_access_note(note_id));

create policy "note_files_write" on public.note_files
  for all using (
    exists (select 1 from public.notes n where n.id = note_id and n.author_id = auth.uid())
    or public.is_super_admin()
  )
  with check (
    exists (select 1 from public.notes n where n.id = note_id and n.author_id = auth.uid())
    or public.is_super_admin()
  );

-- ============================================================
-- assignments
-- ============================================================
create policy "assignments_select" on public.assignments
  for select using (public.is_member_of(classroom_id) or public.is_super_admin());

create policy "assignments_admin_write" on public.assignments
  for all using (public.is_class_admin(classroom_id) or public.is_super_admin())
  with check (public.is_class_admin(classroom_id) or public.is_super_admin());

-- ============================================================
-- assignment_status — รายบุคคล
-- ============================================================
create policy "assignment_status_select_own" on public.assignment_status
  for select using (user_id = auth.uid() or public.is_super_admin());

create policy "assignment_status_insert_own" on public.assignment_status
  for insert with check (user_id = auth.uid());

create policy "assignment_status_update_own" on public.assignment_status
  for update using (user_id = auth.uid());

-- ============================================================
-- announcements
-- ============================================================
create policy "announcements_select" on public.announcements
  for select using (public.is_member_of(classroom_id) or public.is_super_admin());

create policy "announcements_admin_write" on public.announcements
  for all using (public.is_class_admin(classroom_id) or public.is_super_admin())
  with check (public.is_class_admin(classroom_id) or public.is_super_admin());

-- ============================================================
-- flashcard_decks — classroom_id = null คือ deck กลาง
-- ============================================================
create policy "decks_select" on public.flashcard_decks
  for select using (
    classroom_id is null
    or public.is_member_of(classroom_id)
    or public.is_super_admin()
  );

create policy "decks_admin_write" on public.flashcard_decks
  for all using (
    (classroom_id is not null and public.is_class_admin(classroom_id))
    or public.is_super_admin()
  )
  with check (
    (classroom_id is not null and public.is_class_admin(classroom_id))
    or public.is_super_admin()
  );

-- ============================================================
-- flashcards — ตามสิทธิ์ของ deck
-- ============================================================
create policy "flashcards_select" on public.flashcards
  for select using (public.can_access_deck(deck_id));

create policy "flashcards_write" on public.flashcards
  for all using (
    exists (
      select 1 from public.flashcard_decks d
      where d.id = deck_id
        and (
          (d.classroom_id is not null and public.is_class_admin(d.classroom_id))
          or public.is_super_admin()
        )
    )
  )
  with check (
    exists (
      select 1 from public.flashcard_decks d
      where d.id = deck_id
        and (
          (d.classroom_id is not null and public.is_class_admin(d.classroom_id))
          or public.is_super_admin()
        )
    )
  );

-- ============================================================
-- flashcard_progress — รายบุคคล
-- ============================================================
create policy "progress_select_own" on public.flashcard_progress
  for select using (user_id = auth.uid() or public.is_super_admin());

create policy "progress_insert_own" on public.flashcard_progress
  for insert with check (user_id = auth.uid());

create policy "progress_update_own" on public.flashcard_progress
  for update using (user_id = auth.uid());
