-- ============================================================
-- ClassNote — 0006 Note Files Storage
-- สร้าง private bucket `note-files` + storage policies
-- รันไฟล์นี้หลัง 0001–0005 (ต้องมี public.can_access_note จาก 0002)
-- ============================================================
--
-- Path convention: {note_id}/{safe_filename}
-- เช่น  d3b07384-d9a0-4f5c-8b2e-1a2b3c4d5e6f/summary-page1.png
--
-- ทุก policy อ่าน note_id จาก segment แรกของ path ด้วย
-- ((storage.foldername(name))[1])::uuid
--
-- - SELECT: เห็นไฟล์ได้ถ้าเข้าถึงโน้ตนั้นได้ (กติกาเดียวกับตาราง note_files)
--   public.can_access_note เป็น security definer จึงเรียกใน storage policy ได้
-- - INSERT/DELETE: เฉพาะเจ้าของโน้ต (notes.author_id = auth.uid())
--
-- bucket เป็น private (public = false) — แอปต้องใช้ signed URL ในการแสดงไฟล์
-- จำกัดขนาดไฟล์ 10MB และ MIME เฉพาะรูปภาพ (png/jpeg/webp) กับ PDF
--
-- ใช้ on conflict do nothing + drop policy if exists
-- เพื่อให้ migration นี้รันซ้ำได้โดยไม่ error (idempotent)
-- ============================================================


-- ============================================================
-- Bucket: note-files (private, 10MB, image + pdf เท่านั้น)
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'note-files',
  'note-files',
  false,
  10485760, -- 10MB
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update
  set public            = excluded.public,
      file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


-- ============================================================
-- Storage policies บน storage.objects
-- ============================================================

-- อ่านไฟล์ได้ถ้ามีสิทธิ์เข้าถึงโน้ต
-- (public/both = ทุกคนที่ login, classroom = สมาชิกห้องเดียวกัน, super_admin)
drop policy if exists "note_files_storage_select" on storage.objects;
create policy "note_files_storage_select"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'note-files'
    and public.can_access_note(((storage.foldername(name))[1])::uuid)
  );

-- อัปโหลดได้เฉพาะเจ้าของโน้ต
-- (ต้องสร้าง note ก่อน แล้วค่อยอัปโหลดเข้าโฟลเดอร์ {note_id}/)
drop policy if exists "note_files_storage_insert" on storage.objects;
create policy "note_files_storage_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'note-files'
    and exists (
      select 1
      from public.notes n
      where n.id = ((storage.foldername(name))[1])::uuid
        and n.author_id = auth.uid()
    )
  );

-- ลบไฟล์ได้เฉพาะเจ้าของโน้ต
drop policy if exists "note_files_storage_delete" on storage.objects;
create policy "note_files_storage_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'note-files'
    and exists (
      select 1
      from public.notes n
      where n.id = ((storage.foldername(name))[1])::uuid
        and n.author_id = auth.uid()
    )
  );
