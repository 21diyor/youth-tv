-- Run as postgres. All visibility/content changes and audit entries roll back.
begin;
do $test$
declare account record; before_d jsonb; before_p jsonb; after_d jsonb; after_p jsonb; k text; i integer;
begin
 for account in select role,min(user_id::text) uid from public.user_roles group by role loop
   perform set_config('request.jwt.claim.sub',account.uid,true);
   if account.role <> 'super_admin' then
     execute 'set local role authenticated';
     begin
       perform public.set_slide_visibility('schedule',false);
       raise exception '% bypassed the super-admin visibility guard',account.role;
     exception when insufficient_privilege then null; end;
     execute 'reset role';
   else
     foreach k in array array['schedule','birthday','managers'] loop
       execute format('select payload from public.%I where status=''draft''',k||'_content') into before_d;
       execute format('select payload from public.%I where status=''published''',k||'_content') into before_p;
       for i in 0..case when k='managers' then 3 else 0 end loop
         execute 'set local role authenticated';
         perform public.set_slide_visibility(k,false,i);
         execute 'reset role';
         if k='managers' then
           before_d := jsonb_set(before_d,array['managers',i::text,'enabled'],'false');
           before_p := jsonb_set(before_p,array['managers',i::text,'enabled'],'false');
         else
           before_d := jsonb_set(before_d,'{enabled}','false');
           before_p := jsonb_set(before_p,'{enabled}','false');
         end if;
         execute format('select payload from public.%I where status=''draft''',k||'_content') into after_d;
         execute format('select payload from public.%I where status=''published''',k||'_content') into after_p;
         if after_d<>before_d or after_p<>before_p then raise exception 'Visibility altered unrelated % content',k; end if;
       end loop;
     end loop;
     execute 'set local role authenticated';
     perform public.set_slide_visibility('appeals',false);
     perform public.set_slide_visibility('employee',false);
     perform public.set_slide_visibility('president',false);
     if exists(select 1 from public.slide_settings where president_enabled or appeals_enabled or employee_enabled) then raise exception 'Base toggle failed'; end if;
     begin
       perform public.set_slide_visibility('managers',true,4);
       raise exception 'invalid index accepted';
     exception when invalid_parameter_value then null; end;
     execute 'reset role';
   end if;
 end loop;
 if has_function_privilege('anon','public.set_slide_visibility(text,boolean,integer)','EXECUTE') then raise exception 'anonymous visibility access'; end if;
 if public.valid_department_content('schedule','{"enabled":false,"entries":[{"name":"","title":"","day":"","time":"","location":"","photoPath":"managers/private.png"},{},{},{}]}') then raise exception 'cross-folder reference allowed'; end if;
end $test$;
rollback;
select 'PASS: only Super Admin toggles slides; unrelated draft and published content preserved' as result;
