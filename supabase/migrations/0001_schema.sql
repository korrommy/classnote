-- ============================================================
-- ClassNote — 0001 Schema
-- Enums + Tables + Indexes
-- รันไฟล์นี้เป็นไฟล์แรกใน Supabase SQL Editor
-- ============================================================

-- ---------- Enums ----------
create type public.member_role as enum ('student', 'class_admin');
create type public.note_visibility as enum ('classroom', 'public', 'both');
create type public.assignment_progress as enum ('pending', 'completed');
create type public.note_file_type as enum ('pdf', 'doc', 'image', 'link');

-- ---------- profiles ----------
-- เชื่อมกับ auth.users (สร้างอัตโนมัติผ่าน trigger ใน 0002)
-- classroom_id จะถูกเซ็ตผ่าน claim_roster เท่านั้น
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  student_no text,
  grade_level text,
  classroom_id uuid,
  avatar_url text,
  is_super_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- classrooms ----------
create table public.classrooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade_level text,
  room text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- เพิ่ม FK ของ profiles.classroom_id (หลัง classrooms ถูกสร้าง)
alter table public.profiles
  add constraint profiles_classroom_id_fkey
  foreign key (classroom_id) references public.classrooms(id) on delete set null;

-- ---------- classroom_members ----------
create table public.classroom_members (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'student',
  joined_at timestamptz not null default now(),
  unique (classroom_id, user_id)
);

-- ---------- student_roster ----------
-- data รายชื่อที่อัปโหลดล่วงหน้าโดย Super Admin
create table public.student_roster (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  student_no text not null,
  full_name text not null,
  claimed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (classroom_id, student_no)
);

-- ---------- subjects ----------
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  name text not null,
  color text,
  icon text,
  created_at timestamptz not null default now()
);

-- ---------- notes (สรุป / โพสต์) ----------
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid references public.classrooms(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text,
  visibility public.note_visibility not null default 'classroom',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- note_files ----------
create table public.note_files (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  file_url text not null,
  file_type public.note_file_type not null default 'pdf',
  file_name text,
  created_at timestamptz not null default now()
);

-- ---------- assignments ----------
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  description text,
  due_date timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- assignment_status (รายบุคคล) ----------
create table public.assignment_status (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.assignment_progress not null default 'pending',
  completed_at timestamptz,
  unique (assignment_id, user_id)
);

-- ---------- announcements ----------
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  title text not null,
  content text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- flashcard_decks ----------
-- classroom_id = null หมายถึง deck กลาง (แชร์ตามระดับชั้น)
create table public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid references public.classrooms(id) on delete cascade,
  grade_level text,
  title text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- flashcards ----------
create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.flashcard_decks(id) on delete cascade,
  front text not null,
  back text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- flashcard_progress (รายบุคคล) ----------
create table public.flashcard_progress (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.flashcard_decks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  completed_count int not null default 0,
  rounds int not null default 0,
  updated_at timestamptz not null default now(),
  unique (deck_id, user_id)
);

-- ---------- Indexes ----------
create index idx_profiles_classroom on public.profiles(classroom_id);
create index idx_members_user on public.classroom_members(user_id);
create index idx_members_classroom on public.classroom_members(classroom_id);
create index idx_roster_classroom on public.student_roster(classroom_id);
create index idx_subjects_classroom on public.subjects(classroom_id);
create index idx_notes_classroom on public.notes(classroom_id);
create index idx_notes_visibility on public.notes(visibility);
create index idx_notes_author on public.notes(author_id);
create index idx_note_files_note on public.note_files(note_id);
create index idx_assignments_classroom on public.assignments(classroom_id);
create index idx_assignment_status_user on public.assignment_status(user_id);
create index idx_announcements_classroom on public.announcements(classroom_id);
create index idx_decks_classroom on public.flashcard_decks(classroom_id);
create index idx_flashcards_deck on public.flashcards(deck_id);
create index idx_progress_user on public.flashcard_progress(user_id);
