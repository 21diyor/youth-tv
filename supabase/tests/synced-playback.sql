-- Database owner; all fixture edits roll back.
begin;
delete from public.hr_plans;
do $$
declare p jsonb; person uuid; award uuid; state jsonb; row jsonb;
begin
 p:=jsonb_build_object('enabled',false,'name','Profile test','position','Specialist','department','Team','message','Happy birthday','recognition','','photoPath','birthday/first.png','dateKey','12-31');
 insert into public.hr_plans(kind,draft) values('birthday',p) returning id into person;
 p:=p||jsonb_build_object('enabled',true,'staffId',person,'name','Stale name','photoPath','employee/old.png','recognition','Reason','dateKey',to_char((now() at time zone 'Asia/Tashkent')-interval '1 month','YYYY-MM'));
 insert into public.hr_plans(kind,draft,published) values('employee',p,p) returning id into award;
 if public.current_hr_slides()->'employee'->>'photoPath'<>'birthday/first.png' then raise exception 'Award is using stale image'; end if;
 update public.hr_plans set draft=jsonb_set(draft,'{photoPath}','"birthday/second.png"') where id=person;
 if public.current_hr_slides()->'employee'->>'photoPath'<>'birthday/second.png' then raise exception 'Profile update not reflected'; end if;
 if public.current_hr_slides()->'employee' ? 'dateKey' or public.current_hr_slides()->'employee' ? 'staffId' then raise exception 'Private profile fields leaked'; end if;
 p:=p||jsonb_build_object('name','FUTURE_SECRET','dateKey',to_char((now() at time zone 'Asia/Tashkent')+interval '1 month','YYYY-MM'));
 insert into public.hr_plans(kind,draft,published) values('employee',p,p);
 update public.slide_settings set durations='{"appeals":10,"schedule":30,"employee":25}' where status='published';
 state:=public.tv_playback_state();
 if state::text like '%FUTURE_SECRET%' then raise exception 'Future content leaked'; end if;
 for row in select * from jsonb_array_elements(state->'slides') loop
  if row->>'id'='schedule' and (row->>'durationMs')::int<>30000 then raise exception 'Custom duration ignored'; end if;
 end loop;
 if abs((state->>'serverNow')::numeric-extract(epoch from clock_timestamp())*1000)>1000 then raise exception 'Server clock inaccurate'; end if;
 if public.valid_slide_durations('{"appeals":4}') or public.valid_slide_durations('{"appeals":301}') or public.valid_slide_durations('{"appeals":5.5}') or public.valid_slide_durations('{"private":15}') then raise exception 'Invalid durations accepted'; end if;
end $$;
set local role anon;
do $$ begin
 perform public.tv_playback_state();
 if has_table_privilege('anon','public.hr_plans','SELECT') then raise exception 'Staff directory exposed'; end if;
 if has_column_privilege('anon','public.slide_settings','durations','UPDATE') then raise exception 'Public timing edits'; end if;
end $$;
rollback;
select 'PASS: live staff portraits, future privacy, durations, server time, anonymous read-only access' result;
