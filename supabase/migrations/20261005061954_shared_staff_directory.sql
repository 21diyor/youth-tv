create or replace function public.valid_hr_plan(kind text, p jsonb, complete boolean default false)
returns boolean language plpgsql immutable set search_path='' as $$
declare field text; d date;
begin
 if kind not in ('birthday','employee') or jsonb_typeof(p) is distinct from 'object' then return false; end if;
 if jsonb_typeof(p->'enabled') is distinct from 'boolean' then return false; end if;
 foreach field in array array['name','position','department','message','recognition','dateKey'] loop
   if jsonb_typeof(p->field) is distinct from 'string' or length(p->>field)>1000 then return false; end if;
 end loop;
 if p->'photoPath' is distinct from 'null'::jsonb and
   (jsonb_typeof(p->'photoPath') is distinct from 'string' or p->>'photoPath' !~ '^(birthday|employee)/') then return false; end if;
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


-- Birthday planning records now also serve as the shared private staff directory.
-- Preserve existing profiles; never invent a birthday for imported employees.
insert into public.hr_plans(kind,draft)
select 'birthday', e.draft || jsonb_build_object('enabled',false,'dateKey','','recognition','','message','Tug‘ilgan kuningiz muborak! Sizga sog‘liq, baxt va muvaffaqiyat tilaymiz!')
from public.hr_plans e
where e.kind='employee' and not exists (
 select 1 from public.hr_plans s where s.kind='birthday' and s.draft->>'name'=e.draft->>'name'
);
update public.hr_plans e set draft=e.draft||jsonb_build_object('staffId',(
 select s.id from public.hr_plans s where s.kind='birthday' and s.draft->>'name'=e.draft->>'name' order by s.id limit 1
)) where e.kind='employee' and not(e.draft ? 'staffId');

create or replace function public.publish_hr_plan(plan_id uuid) returns public.hr_plans
language plpgsql security definer set search_path='' as $$
declare row public.hr_plans; profile jsonb;
begin
 if not public.can_manage_hr() then raise exception 'permission denied' using errcode='42501'; end if;
 select * into row from public.hr_plans where id=plan_id for update;
 if not found then raise exception 'record not found' using errcode='P0002'; end if;
 if row.kind='employee' and (row.draft->>'enabled')::boolean then
  select draft into profile from public.hr_plans where kind='birthday' and id=(row.draft->>'staffId')::uuid;
  if profile is null then raise exception 'Choose a staff member' using errcode='23514'; end if;
  row.draft:=row.draft||jsonb_build_object('name',profile->>'name','position',profile->>'position','department',profile->>'department','photoPath',profile->'photoPath');
 end if;
 update public.hr_plans set draft=row.draft,published=row.draft,published_at=now() where id=plan_id returning * into row;
 return row;
end $$;
revoke all on function public.publish_hr_plan(uuid) from public,anon;
grant execute on function public.publish_hr_plan(uuid) to authenticated;
