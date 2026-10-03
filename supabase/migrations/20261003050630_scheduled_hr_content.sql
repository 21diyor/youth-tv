-- Private HR planning records. Only date-eligible published payloads reach TVs.
create function public.valid_hr_plan(kind text, p jsonb, complete boolean default false)
returns boolean language plpgsql immutable set search_path='' as $$
declare field text; d date;
begin
 if kind not in ('birthday','employee') or jsonb_typeof(p) is distinct from 'object' then return false; end if;
 if jsonb_typeof(p->'enabled') is distinct from 'boolean' then return false; end if;
 foreach field in array array['name','position','department','message','recognition','dateKey'] loop
   if jsonb_typeof(p->field) is distinct from 'string' or length(p->>field)>1000 then return false; end if;
 end loop;
 if p->'photoPath' is distinct from 'null'::jsonb and
   (jsonb_typeof(p->'photoPath') is distinct from 'string' or p->>'photoPath' not like kind||'/%') then return false; end if;
 if p->>'dateKey' <> '' then
   if kind='birthday' then
     if p->>'dateKey' !~ '^[0-9]{2}-[0-9]{2}$' then return false; end if;
     d:=('2000-'||(p->>'dateKey'))::date;
   else
     if p->>'dateKey' !~ '^[0-9]{4}-[0-9]{2}$' then return false; end if;
     d:=((p->>'dateKey')||'-01')::date;
     if extract(year from d) not between 2020 and 2200 then return false; end if;
   end if;
 end if;
 if complete and (p->>'enabled')::boolean then
   if trim(p->>'name')='' or p->>'dateKey'='' or coalesce(p->>'photoPath','')='' then return false; end if;
   if kind='birthday' and trim(p->>'message')='' then return false; end if;
   if kind='employee' and (trim(p->>'position')='' or trim(p->>'recognition')='') then return false; end if;
 end if;
 return true;
exception when others then return false;
end $$;
revoke all on function public.valid_hr_plan(text,jsonb,boolean) from public;
grant execute on function public.valid_hr_plan(text,jsonb,boolean) to authenticated;

create table public.hr_plans (
 id uuid primary key default gen_random_uuid(),
 kind text not null check (kind in ('birthday','employee')),
 draft jsonb not null,
 published jsonb,
 updated_at timestamptz not null default now(),
 published_at timestamptz,
 constraint hr_draft_valid check(public.valid_hr_plan(kind,draft,false)),
 constraint hr_published_valid check(published is null or public.valid_hr_plan(kind,published,true))
);
alter table public.hr_plans enable row level security;
revoke all on public.hr_plans from anon,authenticated;
grant select on public.hr_plans to authenticated;
grant insert(id,kind,draft), update(draft) on public.hr_plans to authenticated;
create policy hr_plans_select on public.hr_plans for select to authenticated using ((select public.can_manage_hr()));
create policy hr_plans_insert on public.hr_plans for insert to authenticated with check ((select public.can_manage_hr()));
create policy hr_plans_update on public.hr_plans for update to authenticated using ((select public.can_manage_hr())) with check ((select public.can_manage_hr()));
create unique index hr_one_employee_per_month on public.hr_plans ((published->>'dateKey'))
 where kind='employee' and published is not null and (published->>'enabled')::boolean;

create function public.stamp_hr_plan() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end $$;
create trigger hr_plan_updated before update on public.hr_plans for each row execute function public.stamp_hr_plan();

create function public.publish_hr_plan(plan_id uuid) returns public.hr_plans
language plpgsql security definer set search_path='' as $$
declare row public.hr_plans;
begin
 if not public.can_manage_hr() then raise exception 'permission denied' using errcode='42501'; end if;
 update public.hr_plans set published=draft,published_at=now() where id=plan_id returning * into row;
 if not found then raise exception 'record not found' using errcode='P0002'; end if;
 return row;
end $$;
revoke all on function public.publish_hr_plan(uuid) from public,anon;
grant execute on function public.publish_hr_plan(uuid) to authenticated;

-- No date argument: anonymous clients cannot query staff birthdays or future winners.
create function public.current_hr_slides() returns jsonb
language sql stable security definer set search_path='' as $$
 with today as (select (now() at time zone 'Asia/Tashkent')::date as d),
 eligible as (
 select id,kind,published-'dateKey' as content from public.hr_plans,today
 where published is not null and (published->>'enabled')::boolean
 and published->>'dateKey'=case when kind='birthday' then to_char(d,'MM-DD') else to_char(d,'YYYY-MM') end
 )
 select jsonb_build_object(
 'date',to_char(d,'YYYY-MM-DD'),
 'birthdays',coalesce((select jsonb_agg(content||jsonb_build_object('id',id) order by content->>'name',id) from eligible where kind='birthday'),'[]'::jsonb),
 'employee',(select content||jsonb_build_object('id',id) from eligible where kind='employee' limit 1)
 ) from today;
$$;
revoke all on function public.current_hr_slides() from public;
grant execute on function public.current_hr_slides() to anon,authenticated;

create policy tv_media_scheduled_hr on storage.objects for select to anon,authenticated using (
 bucket_id='tv-media' and (
 name=(public.current_hr_slides()->'employee'->>'photoPath')
 or exists(select 1 from jsonb_array_elements(public.current_hr_slides()->'birthdays') p where p->>'photoPath'=storage.objects.name)
 ));
do $$
declare existing text;
begin
 select qual into existing from pg_policies where schemaname='storage' and tablename='objects' and policyname='tv_media_delete';
 execute 'alter policy tv_media_delete on storage.objects using (('||existing||') and not exists(select 1 from public.hr_plans p where p.draft->>''photoPath''=storage.objects.name or p.published->>''photoPath''=storage.objects.name))';
end $$;

-- Keep the current employee and drafts. Legacy month names are normalized.
with source as (
 select status,jsonb_build_object(
 'enabled',true,'name',name,'position',position,'department',department,
 'recognition',recognition,'message','','photoPath',photo_path,
 'dateKey',year::text||'-'||lpad(array_position(array['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'],lower(month))::text,2,'0')
 ) as payload from public.employee_content
)
insert into public.hr_plans(kind,draft,published,published_at)
select 'employee',(select payload from source where status='draft'),
 (select payload from source where status='published'),now();

-- Preserve existing birthday text/photo as a draft; HR supplies the actual date.
insert into public.hr_plans(kind,draft)
select 'birthday',jsonb_build_object('enabled',true,'name',payload->>'name','department',payload->>'department',
 'message',payload->>'message','photoPath',payload->'photoPath','position','','recognition','','dateKey','')
from public.birthday_content where status='draft';
