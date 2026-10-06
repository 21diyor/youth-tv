create table public.dashboard_owner (
 user_id uuid primary key references auth.users(id) on delete cascade,
 singleton boolean not null default true unique check(singleton)
);
alter table public.dashboard_owner enable row level security;
revoke all on public.dashboard_owner from anon,authenticated;
create function public.is_dashboard_owner() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.dashboard_owner where user_id=auth.uid());
$$;
revoke all on function public.is_dashboard_owner() from public,anon;
grant execute on function public.is_dashboard_owner() to authenticated;

create function public.valid_dashboard_report(p jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare s jsonb; m jsonb; d date; ids text[]:='{}';
begin
 if jsonb_typeof(p) is distinct from 'object' or jsonb_typeof(p->'title') is distinct from 'string' or jsonb_typeof(p->'source') is distinct from 'string' then return false; end if;
 if p->>'asOf' !~ '^\d{4}-\d{2}-\d{2}$' then return false; end if;
 d:=(p->>'asOf')::date;
 if d is null or jsonb_typeof(p->'sections') is distinct from 'array' or jsonb_array_length(p->'sections') not between 1 and 100 then return false; end if;
 for s in select * from jsonb_array_elements(p->'sections') loop
  if jsonb_typeof(s->'id') is distinct from 'string' or jsonb_typeof(s->'title') is distinct from 'string' or jsonb_typeof(s->'metrics') is distinct from 'array' then return false; end if;
  if jsonb_array_length(s->'metrics') not between 1 and 500 then return false; end if;
  for m in select * from jsonb_array_elements(s->'metrics') loop
   if jsonb_typeof(m->'id') is distinct from 'string' or m->>'id'=any(ids) then return false; end if;
   ids:=array_append(ids,m->>'id');
   if jsonb_typeof(m->'label') is distinct from 'string' or jsonb_typeof(m->'unit') is distinct from 'string' then return false; end if;
   if m->'value' is distinct from 'null'::jsonb and (jsonb_typeof(m->'value') is distinct from 'number' or (m->>'value')::numeric < 0) then return false; end if;
  end loop;
 end loop;
 return true;
exception when others then return false;
end $$;
revoke all on function public.valid_dashboard_report(jsonb) from public,anon;
grant execute on function public.valid_dashboard_report(jsonb) to authenticated;

create table public.dashboard_reports (
 id uuid primary key default gen_random_uuid(),
 draft jsonb not null check(public.valid_dashboard_report(draft)),
 published jsonb check(published is null or public.valid_dashboard_report(published)),
 version integer not null default 1,
 updated_at timestamptz not null default now(),
 published_at timestamptz,
 updated_by uuid references auth.users(id)
);
alter table public.dashboard_reports enable row level security;
revoke all on public.dashboard_reports from anon,authenticated;
grant select on public.dashboard_reports to authenticated;
create policy dashboard_editor_read on public.dashboard_reports for select to authenticated using ((select public.is_super_admin()));
create unique index dashboard_report_date on public.dashboard_reports ((draft->>'asOf'));

create function public.save_dashboard_report(report_id uuid, expected_version integer, payload jsonb) returns public.dashboard_reports
language plpgsql security definer set search_path='' as $$
declare result public.dashboard_reports;
begin
 if not public.is_super_admin() then raise exception 'permission denied' using errcode='42501'; end if;
 if report_id is null then
  insert into public.dashboard_reports(draft,updated_by) values(payload,auth.uid()) returning * into result;
 else
  update public.dashboard_reports set draft=payload,version=version+1,updated_at=now(),updated_by=auth.uid() where id=report_id and version=expected_version returning * into result;
  if not found then raise exception 'Data changed. Reload before saving.' using errcode='40001'; end if;
 end if;
 return result;
end $$;
create function public.publish_dashboard_report(report_id uuid,expected_version integer) returns public.dashboard_reports
language plpgsql security definer set search_path='' as $$
declare result public.dashboard_reports;
begin
 if not public.is_super_admin() then raise exception 'permission denied' using errcode='42501'; end if;
 update public.dashboard_reports set published=draft,published_at=now(),version=version+1,updated_at=now(),updated_by=auth.uid() where id=report_id and version=expected_version returning * into result;
 if not found then raise exception 'Data changed. Reload before publishing.' using errcode='40001'; end if;
 return result;
end $$;
create function public.read_dashboard_reports() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.is_dashboard_owner() then raise exception 'permission denied' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'report',published,'publishedAt',published_at) order by published->>'asOf' desc) from public.dashboard_reports where published is not null),'[]'::jsonb);
end $$;
revoke all on function public.save_dashboard_report(uuid,integer,jsonb),public.publish_dashboard_report(uuid,integer),public.read_dashboard_reports() from public,anon;
grant execute on function public.save_dashboard_report(uuid,integer,jsonb),public.publish_dashboard_report(uuid,integer),public.read_dashboard_reports() to authenticated;
