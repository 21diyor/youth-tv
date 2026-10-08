-- Single recipients go directly to their individual slide.
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
   if jsonb_array_length(people)>1 then
   for page in 0..((jsonb_array_length(people)-1)/6) loop
    playlist:=playlist||jsonb_build_array(jsonb_build_object('id',category||'-group-'||page,'durationMs',coalesce((s.durations->>(category||'-group'))::int,(s.durations->>category)::int,s.interval_seconds)*1000));
   end loop;
   end if;
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
