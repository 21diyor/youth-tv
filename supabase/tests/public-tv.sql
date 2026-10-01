begin;
set local role anon;
do $test$
declare table_name text; n integer;
begin
  foreach table_name in array array['president_content','appeals_content','employee_content','slide_settings'] loop
    execute format('select count(*) from public.%I', table_name) into n;
    if n <> 1 then raise exception 'Expected one published row in %', table_name; end if;
    execute format('select count(*) from public.%I where status = ''draft''', table_name) into n;
    if n <> 0 then raise exception 'Anonymous draft exposed in %', table_name; end if;
    if has_table_privilege('anon','public.' || table_name,'INSERT,UPDATE,DELETE')
      or has_any_column_privilege('anon','public.' || table_name,'UPDATE') then
      raise exception 'Anonymous write grant on %', table_name;
    end if;
    if has_function_privilege('anon','public.publish_' || table_name || '()','EXECUTE') then
      raise exception 'Anonymous publish grant on %', table_name;
    end if;
  end loop;
  if has_table_privilege('anon','public.user_roles','SELECT')
    or has_table_privilege('anon','public.audit_log','SELECT') then
    raise exception 'Private administration data is exposed';
  end if;
  if exists (
    select 1 from storage.objects o where bucket_id='tv-media'
      and not exists (select 1 from public.president_content p where p.status='published' and p.portrait_path=o.name)
      and not exists (select 1 from public.employee_content e where e.status='published' and e.photo_path=o.name)
  ) then raise exception 'Unpublished media is exposed'; end if;
end $test$;
rollback;
select 'PASS: anonymous published reads; drafts, writes, publishing and unused media protected' as result;
