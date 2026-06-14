-- ============================================================
-- ClassNote — 0002 Functions, Triggers, RPC
-- รันไฟล์นี้เป็นไฟล์ที่สอง (หลัง 0001)
-- ============================================================

-- ---------- Helper: is_super_admin ----------
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_super_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---------- Helper: is_member_of ----------
create or replace function public.is_member_of(p_classroom_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(
    select 1 from public.classroom_members
    where classroom_id = p_classroom_id and user_id = auth.uid()
  );
$$;

-- ---------- Helper: is_class_admin ----------
create or replace function public.is_class_admin(p_classroom_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(
    select 1 from public.classroom_members
    where classroom_id = p_classroom_id
      and user_id = auth.uid()
      and role = 'class_admin'
  );
$$;

-- ---------- Helper: can_access_note ----------
create or replace function public.can_access_note(p_note_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(
    select 1 from public.notes n
    where n.id = p_note_id and (
      n.visibility in ('public', 'both')
      or (n.classroom_id is not null and public.is_member_of(n.classroom_id))
      or public.is_super_admin()
    )
  );
$$;

-- ---------- Helper: can_access_deck ----------
create or replace function public.can_access_deck(p_deck_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(
    select 1 from public.flashcard_decks d
    where d.id = p_deck_id and (
      d.classroom_id is null
      or public.is_member_of(d.classroom_id)
      or public.is_super_admin()
    )
  );
$$;

-- ---------- Trigger: สร้าง profile อัตโนมัติเมื่อมี user ใหม่ ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Trigger: กันแก้ไขฟิลด์สำคัญใน profiles ----------
-- ผู้ใช้ทั่วไปแก้ได้แค่ avatar_url; ฟิลด์ตัวตน (full_name, student_no,
-- classroom_id, grade_level, is_super_admin) เปลี่ยนได้ผ่าน claim_roster
-- หรือโดย Super Admin เท่านั้น
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_super_admin()
     or coalesce(current_setting('app.bypass_profile_guard', true), '') = 'on' then
    return new;
  end if;

  new.full_name := old.full_name;
  new.student_no := old.student_no;
  new.classroom_id := old.classroom_id;
  new.grade_level := old.grade_level;
  new.is_super_admin := old.is_super_admin;
  return new;
end;
$$;

drop trigger if exists trg_guard_profile on public.profiles;
create trigger trg_guard_profile
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ---------- RPC: claim_roster ----------
-- จับคู่ผู้ใช้กับ student_roster ด้วย (classroom_id + student_no)
-- ตรง & ยังไม่ถูก claim -> เซ็ตโปรไฟล์ + เข้าห้องอัตโนมัติ
-- ใช้ SECURITY DEFINER จึงเข้าถึง roster ได้โดยไม่ต้องเปิด RLS ตารางให้ client
create or replace function public.claim_roster(p_classroom_id uuid, p_student_no text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_roster public.student_roster;
  v_classroom public.classrooms;
  v_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select * into v_classroom from public.classrooms where id = p_classroom_id;
  if not found then
    raise exception 'CLASSROOM_NOT_FOUND';
  end if;

  select * into v_roster
  from public.student_roster
  where classroom_id = p_classroom_id
    and student_no = trim(p_student_no);

  if not found then
    raise exception 'NOT_FOUND';
  end if;

  if v_roster.claimed_by is not null and v_roster.claimed_by <> auth.uid() then
    raise exception 'ALREADY_CLAIMED';
  end if;

  -- mark roster เป็น claimed
  update public.student_roster
    set claimed_by = auth.uid()
    where id = v_roster.id;

  -- เปิด bypass guard เฉพาะใน transaction นี้
  perform set_config('app.bypass_profile_guard', 'on', true);

  update public.profiles
    set full_name = v_roster.full_name,
        student_no = v_roster.student_no,
        classroom_id = p_classroom_id,
        grade_level = v_classroom.grade_level
    where id = auth.uid()
    returning * into v_profile;

  -- เพิ่มเป็นสมาชิกห้อง
  insert into public.classroom_members (classroom_id, user_id, role)
    values (p_classroom_id, auth.uid(), 'student')
    on conflict (classroom_id, user_id) do nothing;

  return v_profile;
end;
$$;

-- เปิดให้ผู้ใช้ที่ login แล้วเรียกใช้ได้
grant execute on function public.claim_roster(uuid, text) to authenticated;
