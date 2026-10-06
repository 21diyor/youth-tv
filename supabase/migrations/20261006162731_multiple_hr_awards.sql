-- Allow multiple distinct staff awards per month; prevent duplicate active awards.
drop index public.hr_one_employee_per_month;
create unique index hr_one_award_per_staff_month on public.hr_plans ((published->>'dateKey'),(published->>'staffId'))
where kind='employee' and (published->>'enabled')::boolean;
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
 'employees',coalesce((select jsonb_agg(content||jsonb_build_object('id',id) order by id) from eligible where kind='employee'),'[]'::jsonb),
 'employee',(select content||jsonb_build_object('id',id) from eligible where kind='employee' limit 1)) from today;
$$;
revoke all on function public.current_hr_slides() from public;
grant execute on function public.current_hr_slides() to anon,authenticated;

create or replace function public.valid_slide_durations(value jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare entry record;
begin
 if jsonb_typeof(value) is distinct from 'object' then return false; end if;
 for entry in select * from jsonb_each(value) loop
  if entry.key not in ('appeals','schedule','manager-0','manager-1','manager-2','manager-3','birthday','employee','birthday-group','employee-group','president')
   or jsonb_typeof(entry.value) is distinct from 'number'
   or (entry.value::text)::numeric not between 5 and 300
   or trunc((entry.value::text)::numeric)<>(entry.value::text)::numeric then return false; end if;
 end loop;
 return true;
exception when others then return false;
end $$;
revoke all on function public.valid_slide_durations(jsonb) from public;
grant execute on function public.valid_slide_durations(jsonb) to authenticated;
create or replace function public.tv_playback_state() returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare s public.slide_settings; h jsonb; managers jsonb; sch jsonb; birthday jsonb;
 playlist jsonb:='[]'; person jsonb; entry jsonb; idx int:=0; duration int; page int; people jsonb; category text;
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
 foreach category in array array['birthday','employee'] loop
  people:=h->case when category='birthday' then 'birthdays' else 'employees' end;
  if (case when category='birthday' then (birthday->>'enabled')::boolean else s.employee_enabled end) and jsonb_array_length(people)>0 then
   for page in 0..((jsonb_array_length(people)-1)/6) loop
    playlist:=playlist||jsonb_build_array(jsonb_build_object('id',category||'-group-'||page,'durationMs',coalesce((s.durations->>(category||'-group'))::int,(s.durations->>category)::int,s.interval_seconds)*1000));
   end loop;
   for person in select * from jsonb_array_elements(people) loop
    playlist:=playlist||jsonb_build_array(jsonb_build_object('id',category||'-'||(person->>'id'),'durationMs',coalesce((s.durations->>category)::int,s.interval_seconds)*1000));
   end loop;
  end if;
 end loop;
 if s.president_enabled then playlist:=playlist||jsonb_build_array(jsonb_build_object('id','president','durationMs',coalesce((s.durations->>'president')::int,s.interval_seconds)*1000)); end if;
 return jsonb_build_object('serverNow',extract(epoch from clock_timestamp())*1000,'slides',playlist,'hr',h);
end $$;
revoke all on function public.tv_playback_state() from public;
grant execute on function public.tv_playback_state() to anon,authenticated;

alter policy tv_media_scheduled_hr on storage.objects using (
 bucket_id='tv-media' and exists(select 1 from jsonb_array_elements(
 (public.current_hr_slides()->'employees')||(public.current_hr_slides()->'birthdays')) p
 where p->>'photoPath'=storage.objects.name));
