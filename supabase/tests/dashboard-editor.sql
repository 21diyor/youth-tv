-- Run after provisioning the dashboard editor; all test writes roll back.
begin;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select id::text from auth.users where email='dashboard-editor@youth-tv.invalid'),'role','authenticated')::text,true);
set local role authenticated;
do $$ declare r public.dashboard_reports; begin
 if not public.is_dashboard_editor() or public.is_super_admin() or public.is_dashboard_owner() then raise exception 'Incorrect editor permissions'; end if;
 if exists(select 1 from public.user_roles) then raise exception 'Editor has TV role'; end if;
 select * into r from public.dashboard_reports limit 1;
 if r.id is null then raise exception 'Editor cannot read drafts'; end if;
 r:=public.save_dashboard_report(r.id,r.version,r.draft);
 r:=public.publish_dashboard_report(r.id,r.version);
 begin perform public.read_dashboard_reports(); raise exception 'Editor can access director feed'; exception when insufficient_privilege then null; end;
 begin perform public.publish_appeals_content(); raise exception 'Editor can publish TV content'; exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'PASS: dashboard editor is isolated from TV administration and director feed' result;
