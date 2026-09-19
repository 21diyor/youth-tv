-- ============================================================================
-- YIA TV Monitoring Platform — private tv-media bucket
-- Migration: 20260919000002_tv_media_storage.sql
--
-- STATUS: PROPOSED — NOT APPLIED.
--   Depends on 20260919000001 (content tables + role helpers).
--   Planned for the image step (portrait / employee photo upload).
--
-- Files are immutable: every upload gets a new <folder>/<uuid>.<ext> path,
-- saved into the DRAFT row. The TV keeps the published image until publish
-- copies the path. Old files are never deleted automatically.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tv-media', 'tv-media', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Press/super editors see their folders; everyone else only published images.
create policy tv_media_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'tv-media' and (
      (select public.can_manage_press())
      or exists (
        select 1 from public.president_content p
        where p.status = 'published' and p.portrait_path = storage.objects.name)
      or exists (
        select 1 from public.employee_content e
        where e.status = 'published' and e.photo_path = storage.objects.name)
    )
  );

-- Upload only (no update policy → files are immutable).
create policy tv_media_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'tv-media'
    and (storage.foldername(name))[1] in ('president', 'employee')
    and (select public.can_manage_press())
  );

-- Cleanup: super admin only, never a file referenced by a draft or published row.
create policy tv_media_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'tv-media'
    and (select public.is_super_admin())
    and not exists (select 1 from public.president_content p
                    where p.portrait_path = storage.objects.name)
    and not exists (select 1 from public.employee_content e
                    where e.photo_path = storage.objects.name)
  );
