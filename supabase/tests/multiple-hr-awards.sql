-- Run as database owner. Fixtures are rolled back.
begin;
delete from public.hr_plans;
do $$
declare p jsonb; staff uuid; h jsonb; t jsonb; i int;
begin
 for i in 1..7 loop
  p:=jsonb_build_object('enabled',true,'name','Fixture '||i,'position','Specialist','department','Team','message','Congratulations','recognition','Recognition','photoPath','birthday/fixture-'||i||'.png','dateKey',to_char(now() at time zone 'Asia/Tashkent','MM-DD'));
  insert into public.hr_plans(kind,draft,published) values('birthday',p,p) returning id into staff;
  p:=p||jsonb_build_object('staffId',staff,'dateKey',to_char(now() at time zone 'Asia/Tashkent','YYYY-MM'));
  insert into public.hr_plans(kind,draft,published) values('employee',p,p);
 end loop;
 begin
  insert into public.hr_plans(kind,draft,published) values('employee',p,p);
  raise exception 'Duplicate staff award accepted';
 exception when unique_violation then null;
 end;
 update public.slide_settings set employee_enabled=true,durations='{"employee-group":20,"employee":15,"birthday-group":25,"birthday":10}' where status='published';
 update public.birthday_content set payload=jsonb_set(payload,'{enabled}','true') where status='published';
 h:=public.current_hr_slides(); t:=public.tv_playback_state();
 if jsonb_array_length(h->'employees')<>7 or jsonb_array_length(h->'birthdays')<>7 then raise exception 'Missing staff'; end if;
 if (select count(*) from jsonb_array_elements(t->'slides') s where s->>'id' like 'employee-%')<>9 then raise exception 'Award group pages/individual count wrong'; end if;
 if (select count(*) from jsonb_array_elements(t->'slides') s where s->>'id' like 'birthday-%')<>9 then raise exception 'Birthday group pages/individual count wrong'; end if;
 if (select min((s->>'durationMs')::int) from jsonb_array_elements(t->'slides') s where s->>'id' like 'employee-group-%')<>20000 then raise exception 'Group duration ignored'; end if;
 if exists(select 1 from jsonb_array_elements(h->'employees') s where s?'staffId' or s?'dateKey') then raise exception 'Private fields leaked'; end if;
end $$;
rollback;
select 'PASS: multiple awards, duplicate guard, birthdays, group pagination, durations and privacy' result;
