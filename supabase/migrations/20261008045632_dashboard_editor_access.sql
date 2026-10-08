create table public.dashboard_editors (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.dashboard_editors enable row level security;
revoke all on public.dashboard_editors from anon,authenticated;
create function public.is_dashboard_editor() returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (public.is_super_admin() or exists(select 1 from public.dashboard_editors where user_id=auth.uid()));
$$;
revoke all on function public.is_dashboard_editor() from public,anon;
grant execute on function public.is_dashboard_editor() to authenticated;
alter policy dashboard_editor_read on public.dashboard_reports using ((select public.is_dashboard_editor()));

create or replace function public.save_dashboard_report(report_id uuid, expected_version integer, payload jsonb) returns public.dashboard_reports
language plpgsql security definer set search_path='' as $$
declare result public.dashboard_reports;
begin
 if not public.is_dashboard_editor() then raise exception 'permission denied' using errcode='42501'; end if;
 if report_id is null then
  insert into public.dashboard_reports(draft,updated_by) values(payload,auth.uid()) returning * into result;
 else
  update public.dashboard_reports set draft=payload,version=version+1,updated_at=now(),updated_by=auth.uid() where id=report_id and version=expected_version returning * into result;
  if not found then raise exception 'Data changed. Reload before saving.' using errcode='40001'; end if;
 end if;
 return result;
end $$;
create or replace function public.publish_dashboard_report(report_id uuid,expected_version integer) returns public.dashboard_reports
language plpgsql security definer set search_path='' as $$
declare result public.dashboard_reports;
begin
 if not public.is_dashboard_editor() then raise exception 'permission denied' using errcode='42501'; end if;
 update public.dashboard_reports set published=draft,published_at=now(),version=version+1,updated_at=now(),updated_by=auth.uid() where id=report_id and version=expected_version returning * into result;
 if not found then raise exception 'Data changed. Reload before publishing.' using errcode='40001'; end if;
 return result;
end $$;
