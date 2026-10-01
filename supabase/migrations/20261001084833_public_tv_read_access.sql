-- Public building TVs can read only published content and its referenced images.
-- Admin writes, drafts, user roles, audit records and publish RPC grants stay protected.
grant select on public.president_content, public.appeals_content,
  public.employee_content, public.slide_settings to anon;

create policy president_content_public_tv on public.president_content
  for select to anon using (status = 'published');
create policy appeals_content_public_tv on public.appeals_content
  for select to anon using (status = 'published');
create policy employee_content_public_tv on public.employee_content
  for select to anon using (status = 'published');
create policy slide_settings_public_tv on public.slide_settings
  for select to anon using (status = 'published');

-- Keep the bucket private: unused uploads and draft photos cannot be downloaded.
create policy tv_media_public_published on storage.objects
  for select to anon using (
    bucket_id = 'tv-media' and (
      exists (select 1 from public.president_content p
        where p.status = 'published' and p.portrait_path = storage.objects.name)
      or exists (select 1 from public.employee_content e
        where e.status = 'published' and e.photo_path = storage.objects.name)
    )
  );
