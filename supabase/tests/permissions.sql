-- Run with the Supabase SQL editor as postgres. Every test change is rolled back.
begin;
do $test$
declare
  account record;
  table_name text;
  draft_count integer;
  expected_count integer;
  affected integer;
  may_edit boolean;
  writable_column text;
begin
  for account in select role, min(user_id::text) as user_id from public.user_roles group by role loop
    perform set_config('request.jwt.claim.sub', account.user_id, true);
    execute 'set local role authenticated';
    foreach table_name in array array['president_content','appeals_content','employee_content','slide_settings'] loop
      may_edit := account.role = 'super_admin'
        or (account.role = 'press_admin' and table_name in ('president_content','employee_content'))
        or (account.role = 'appeals_admin' and table_name = 'appeals_content');
      execute format('select count(*) from public.%I where status = ''published''', table_name) into affected;
      if affected <> 1 then raise exception '% cannot read published %', account.role, table_name; end if;
      execute format('select count(*) from public.%I where status = ''draft''', table_name) into draft_count;
      expected_count := case when may_edit then 1 else 0 end;
      if draft_count <> expected_count then raise exception '% draft visibility mismatch for %', account.role, table_name; end if;
      writable_column := case table_name when 'appeals_content' then 'total' when 'slide_settings' then 'interval_seconds' else 'name' end;
      execute format('update public.%I set %I = %I where status = ''draft''', table_name, writable_column, writable_column);
      get diagnostics affected = row_count;
      if affected <> expected_count then raise exception '% draft write mismatch for %', account.role, table_name; end if;
      if may_edit then
        execute format('select public.%I()', 'publish_' || table_name);
      else
        begin
          execute format('select public.%I()', 'publish_' || table_name);
          raise exception '% unexpectedly published %', account.role, table_name;
        exception when insufficient_privilege then null;
        end;
      end if;
    end loop;
    execute 'reset role';
  end loop;
end
$test$;
rollback;
select 'PASS: role reads, draft writes and publish permissions; all writes rolled back' as result;
