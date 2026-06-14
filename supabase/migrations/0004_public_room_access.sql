-- Allow authenticated users to read the minimum related data needed
-- for public notes shared across classrooms.

drop policy if exists "profiles_select_public_note_authors" on public.profiles;
create policy "profiles_select_public_note_authors" on public.profiles
  for select using (
    auth.uid() is not null
    and exists (
      select 1
      from public.notes n
      where n.author_id = profiles.id
        and n.visibility in ('public', 'both')
    )
  );

drop policy if exists "subjects_select_public_notes" on public.subjects;
create policy "subjects_select_public_notes" on public.subjects
  for select using (
    auth.uid() is not null
    and exists (
      select 1
      from public.notes n
      where n.subject_id = subjects.id
        and n.visibility in ('public', 'both')
    )
  );
