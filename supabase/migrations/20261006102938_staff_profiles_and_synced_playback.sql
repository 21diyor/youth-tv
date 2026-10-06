-- Repair only unique, case-insensitive exact name matches. Ambiguous and
-- differently spelled names stay unlinked for HR to choose explicitly.
with matches as (
 select e.id, min(s.id::text)::uuid staff_id
 from public.hr_plans e join public.hr_plans s
 on s.kind='birthday' and lower(trim(s.draft->>'name'))=lower(trim(e.draft->>'name'))
 where e.kind='employee' and coalesce(e.draft->>'staffId','')=''
 group by e.id having count(*)=1
)
update public.hr_plans e set draft=e.draft||jsonb_build_object('staffId',m.staff_id,
 'name',s.draft->>'name','position',s.draft->>'position','department',s.draft->>'department','photoPath',s.draft->'photoPath')
from matches m join public.hr_plans s on s.id=m.staff_id where e.id=m.id;

-- The birthday-kind record is the canonical private staff profile. Awards
-- reference it by ID; only the currently eligible public identity is projected.
create or replace function public.current_hr_slides() returns jsonb
language sql stable security definer set search_path='' as $$
 with today as (select (now() at time zone 'Asia/Tashkent')::date as d),
 eligible as (
 select p.id,p.kind,(p.published-'dateKey'-'staffId') ||
 case when s.id is not null then jsonb_build_object('name',s.draft->>'name',
 'position',s.draft->>'position','department',s.draft->>'department','photoPath',s.draft->'photoPath') else '{}'::jsonb end as content
 from public.hr_plans p cross join today
 left join public.hr_plans s on s.kind='birthday' and
 s.id::text=case when p.kind='birthday' then p.id::text else p.published->>'staffId' end
 where p.published is not null and (p.published->>'enabled')::boolean
 and p.published->>'dateKey'=case when p.kind='birthday' then to_char(d,'MM-DD') else to_char(d,'YYYY-MM') end
 )
 select jsonb_build_object('date',to_char(d,'YYYY-MM-DD'),
 'birthdays',coalesce((select jsonb_agg(content||jsonb_build_object('id',id) order by id) from eligible where kind='birthday'),'[]'::jsonb),
 'employee',(select content||jsonb_build_object('id',id) from eligible where kind='employee' limit 1)) from today;
$$;
revoke all on function public.current_hr_slides() from public;
grant execute on function public.current_hr_slides() to anon,authenticated;

create function public.valid_slide_durations(value jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare entry record;
begin
 if jsonb_typeof(value) is distinct from 'object' then return false; end if;
 for entry in select * from jsonb_each(value) loop
  if entry.key not in ('appeals','schedule','manager-0','manager-1','manager-2','manager-3','birthday','employee','president')
   or jsonb_typeof(entry.value) is distinct from 'number'
   or (entry.value::text)::numeric not between 5 and 300
   or trunc((entry.value::text)::numeric)<>(entry.value::text)::numeric then return false; end if;
 end loop;
 return true;
exception when others then return false;
end $$;
revoke all on function public.valid_slide_durations(jsonb) from public;
grant execute on function public.valid_slide_durations(jsonb) to authenticated;
alter table public.slide_settings add column durations jsonb not null default '{}'::jsonb
 check(public.valid_slide_durations(durations));
grant update(durations) on public.slide_settings to authenticated;

create or replace function public.publish_slide_settings() returns public.slide_settings
language plpgsql security definer set search_path='' as $$
declare d public.slide_settings; p public.slide_settings;
begin
 if not public.is_super_admin() then raise exception 'permission denied' using errcode='42501'; end if;
 select * into strict d from public.slide_settings where status='draft' for update;
 update public.slide_settings set interval_seconds=d.interval_seconds,durations=d.durations,
 president_enabled=d.president_enabled,appeals_enabled=d.appeals_enabled,employee_enabled=d.employee_enabled,
 published_at=now(),published_by=auth.uid() where status='published' returning * into strict p;
 return p;
end $$;

-- One atomic, public-only playlist and a precise server clock. There is no date
-- argument, so this cannot enumerate birthdays or future monthly awards.
create function public.tv_playback_state() returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare s public.slide_settings; h jsonb; managers jsonb; sch jsonb; birthday jsonb;
 playlist jsonb:='[]'; person jsonb; entry jsonb; idx int:=0; duration int;
begin
 select * into strict s from public.slide_settings where status='published';
 select payload into sch from public.schedule_content where status='published';
 select payload into managers from public.managers_content where status='published';
 select payload into birthday from public.birthday_content where status='published';
 h:=public.current_hr_slides();
 if s.appeals_enabled then playlist:=playlist||jsonb_build_array(jsonb_build_object('id','appeals','durationMs',coalesce((s.durations->>'appeals')::int,s.interval_seconds)*1000)); end if;
 if (sch->>'enabled')::boolean then playlist:=playlist||jsonb_build_array(jsonb_build_object('id','schedule','durationMs',coalesce((s.durations->>'schedule')::int,s.interval_seconds)*1000)); end if;
 for entry in select * from jsonb_array_elements(managers->'managers') loop
  if (entry->>'enabled')::boolean then
   playlist:=playlist||jsonb_build_array(jsonb_build_object('id','manager-'||idx,'durationMs',coalesce((s.durations->>('manager-'||idx))::int,s.interval_seconds)*1000));
  end if;
  idx:=idx+1;
 end loop;
 if (birthday->>'enabled')::boolean then
  for person in select * from jsonb_array_elements(h->'birthdays') loop
   playlist:=playlist||jsonb_build_array(jsonb_build_object('id','birthday-'||(person->>'id'),'durationMs',coalesce((s.durations->>'birthday')::int,s.interval_seconds)*1000));
  end loop;
 end if;
 if s.employee_enabled and h->'employee' is distinct from 'null'::jsonb then
  playlist:=playlist||jsonb_build_array(jsonb_build_object('id','employee-'||(h->'employee'->>'id'),'durationMs',coalesce((s.durations->>'employee')::int,s.interval_seconds)*1000));
 end if;
 if s.president_enabled then playlist:=playlist||jsonb_build_array(jsonb_build_object('id','president','durationMs',coalesce((s.durations->>'president')::int,s.interval_seconds)*1000)); end if;
 return jsonb_build_object('serverNow',extract(epoch from clock_timestamp())*1000,'slides',playlist,'hr',h);
end $$;
revoke all on function public.tv_playback_state() from public;
grant execute on function public.tv_playback_state() to anon,authenticated;
