-- Run as the database owner on a provisioned project. All edits roll back.
begin;
select set_config('test.dashboard_owner',(select user_id::text from public.dashboard_owner),true);
select set_config('test.dashboard_hr',(select user_id::text from public.user_roles where role='hr_admin' limit 1),true);
select set_config('test.dashboard_appeals',(select user_id::text from public.user_roles where role='appeals_admin' limit 1),true);
select set_config('test.dashboard_super',(select user_id::text from public.user_roles where role='super_admin' limit 1),true);
set local role anon;
do $$ begin
 if has_table_privilege('anon','public.dashboard_reports','SELECT') or has_table_privilege('anon','public.dashboard_owner','SELECT') then raise exception 'Anonymous grant'; end if;
 if has_function_privilege('anon','public.read_dashboard_reports()','EXECUTE') then raise exception 'Anonymous read RPC'; end if;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.dashboard_owner'),'role','authenticated')::text,true);
do $$ begin
 if not public.is_dashboard_owner() then raise exception 'Owner check'; end if;
 if jsonb_array_length(public.read_dashboard_reports())<1 then raise exception 'Owner published access'; end if;
 if exists(select 1 from public.dashboard_reports) then raise exception 'Owner draft exposed'; end if;
 begin
 perform public.save_dashboard_report(null,0,'{}'); raise exception 'Owner can edit';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.dashboard_hr'),'role','authenticated')::text,true);
do $$ begin
 if public.is_dashboard_owner() or exists(select 1 from public.dashboard_reports) then raise exception 'HR can see report'; end if;
 begin perform public.read_dashboard_reports();raise exception 'HR can read dashboard';exception when insufficient_privilege then null; end;
 begin perform public.save_dashboard_report(null,0,'{}');raise exception 'HR can edit';exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.dashboard_appeals'),'role','authenticated')::text,true);
do $$ begin
 if public.is_dashboard_owner() or exists(select 1 from public.dashboard_reports) then raise exception 'Appeals can see report'; end if;
 begin perform public.read_dashboard_reports();raise exception 'Appeals can read';exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.dashboard_super'),'role','authenticated')::text,true);
do $$ declare r public.dashboard_reports; old jsonb; begin
 if public.is_dashboard_owner() then raise exception 'Super admin is dashboard owner';end if;
 begin perform public.read_dashboard_reports();raise exception 'Super admin can enter director feed';exception when insufficient_privilege then null; end;
 select * into r from public.dashboard_reports limit 1;
 old:=r.published;
 r:=public.save_dashboard_report(r.id,r.version,jsonb_set(r.draft,'{title}','"Verification draft"'));
 if r.published is distinct from old then raise exception 'Draft leaked';end if;
 begin perform public.publish_dashboard_report(r.id,r.version-1);raise exception 'Stale publish accepted';exception when serialization_failure then null;end;
 r:=public.publish_dashboard_report(r.id,r.version);
 if r.published->>'title'<>'Verification draft' then raise exception 'Publish failed';end if;
 old:=r.published;
 r:=public.save_dashboard_report(r.id,r.version,
  jsonb_set(jsonb_set(r.draft,'{presentation}','{"title":"Test overview","duration":35,"showOverview":true}'),
   '{sections,0}',(r.draft->'sections'->0)||'{"visible":false,"chart":"cards","duration":45,"pageSize":3}'::jsonb));
 if r.published is distinct from old then raise exception 'Presentation draft leaked';end if;
 r:=public.publish_dashboard_report(r.id,r.version);
 if r.published#>>'{presentation,duration}'<>'35' or r.published#>>'{sections,0,visible}'<>'false' or r.published#>>'{sections,0,pageSize}'<>'3' then raise exception 'Presentation settings lost';end if;
 if public.valid_dashboard_report(jsonb_set(r.draft,'{sections,0,metrics,0,value}','-1')) then raise exception 'Negative accepted';end if;
end $$;
rollback;
select 'PASS: anonymous isolation, director read-only, HR/appeals denied, super editor-only, drafts, publish, conflict and numeric validation' result;
