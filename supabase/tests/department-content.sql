-- Read-only validation tests using fixtures; no production content changes.
do $test$
declare m jsonb; s jsonb; b jsonb;
begin
 select jsonb_build_object('managers',jsonb_agg(jsonb_build_object('enabled',false,'name','','title','','total',0,'resolved',0,'inProgress',0,'overdue',0))) into m from generate_series(1,4);
 select jsonb_build_object('enabled',false,'entries',jsonb_agg(jsonb_build_object('name','','title','','day','','time','','location',''))) into s from generate_series(1,4);
 b := '{"enabled":false,"name":"","department":"","message":"","photoPath":null}'::jsonb;
 if not public.valid_department_content('managers',m) then raise exception 'valid manager draft rejected'; end if;
 if public.valid_department_content('managers',jsonb_set(m,'{managers,0,total}','1')) then raise exception 'invalid total accepted'; end if;
 if public.valid_department_content('managers',jsonb_set(m,'{managers,0,inProgress}','-1')) then raise exception 'negative accepted'; end if;
 if public.valid_department_content('managers',jsonb_set(m,'{managers,0,total}','1.5')) then raise exception 'fraction accepted'; end if;
 if public.valid_department_content('managers','{"managers":[]}') then raise exception 'missing manager slots accepted'; end if;
 if public.valid_department_content('managers','{}') then raise exception 'missing payload accepted'; end if;
 if public.valid_department_content('schedule',jsonb_set(s,'{enabled}','true')) then raise exception 'empty schedule enabled'; end if;
 if public.valid_department_content('birthday',jsonb_set(b,'{enabled}','true')) then raise exception 'empty birthday enabled'; end if;
 if public.valid_department_content('birthday',jsonb_set(b,'{photoPath}','"president/private.jpg"')) then raise exception 'wrong media folder accepted'; end if;
end;
$test$;
select 'PASS: malformed content, invalid totals and unpublished incomplete slides rejected' as result;
