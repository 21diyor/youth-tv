-- Run with the SQL owner. All fixtures are rolled back.
begin;
delete from public.hr_plans;
do $test$
declare
 p jsonb := jsonb_build_object('enabled',true,'name','test','department','','position','Role','message','Congratulations','recognition','Excellent work','photoPath','birthday/test.png','dateKey',to_char(now() at time zone 'Asia/Tashkent','MM-DD'));
begin
 insert into public.hr_plans(kind,draft,published) values ('birthday',p,p),('birthday',p,p);
 p:=jsonb_set(p,'{dateKey}',to_jsonb(to_char((now() at time zone 'Asia/Tashkent')+interval '1 day','MM-DD')));
 insert into public.hr_plans(kind,draft,published) values ('birthday',p,p);
 if jsonb_array_length(public.current_hr_slides()->'birthdays')<>2 then raise exception 'Birthday date filter failed'; end if;
 if (public.current_hr_slides()->'birthdays'->0) ? 'dateKey' then raise exception 'Birthday date leaked'; end if;
 if public.valid_hr_plan('birthday',jsonb_set(p,'{dateKey}','"02-30"'),true) then raise exception 'Invalid date accepted'; end if;
 if not public.valid_hr_plan('birthday',jsonb_set(p,'{dateKey}','"02-29"'),true) then raise exception 'Leap birthday rejected'; end if;
 p:=p||jsonb_build_object('photoPath','employee/test.png','dateKey',to_char(now() at time zone 'Asia/Tashkent','YYYY-MM'));
 insert into public.hr_plans(kind,draft,published) values ('employee',p,p);
 begin
  insert into public.hr_plans(kind,draft,published) values ('employee',p,p);
  raise exception 'Duplicate employee accepted';
 exception when unique_violation then null; end;
 p:=p||jsonb_build_object('dateKey',to_char((now() at time zone 'Asia/Tashkent')+interval '1 month','YYYY-MM'),'name','future-secret');
 insert into public.hr_plans(kind,draft,published) values ('employee',p,p);
 if public.current_hr_slides()->'employee'->>'name'<>'test' then raise exception 'Wrong employee selected'; end if;
 if public.current_hr_slides()::text like '%future-secret%' then raise exception 'Future entry leaked'; end if;
end $test$;
set local role anon;
do $test$ begin
 if has_table_privilege('anon','public.hr_plans','SELECT') then raise exception 'Private plans exposed'; end if;
 if has_function_privilege('anon','public.publish_hr_plan(uuid)','EXECUTE') then raise exception 'Anon can publish'; end if;
 perform public.current_hr_slides();
end $test$;
rollback;
select 'PASS: automatic HR dates, multiple birthdays, privacy and monthly uniqueness' result;
