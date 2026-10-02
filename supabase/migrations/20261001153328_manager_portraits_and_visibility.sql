-- Add optional portraits without modifying existing content or photos.
create or replace function public.valid_department_content(kind text, value jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare item jsonb; field text; n numeric;
begin
 if jsonb_typeof(value) is distinct from 'object' then return false; end if;
 if kind = 'managers' then
   if jsonb_typeof(value->'managers') is distinct from 'array' then return false; end if;
   if jsonb_array_length(value->'managers') <> 4 then return false; end if;
   for item in select * from jsonb_array_elements(value->'managers') loop
     if jsonb_typeof(item->'enabled') is distinct from 'boolean' then return false; end if;
     if item ? 'photoPath' and item->'photoPath' <> 'null'::jsonb then
         if jsonb_typeof(item->'photoPath') is distinct from 'string'
            or item->>'photoPath' not like (kind || '/%') then return false; end if;
       end if;
       foreach field in array array['name','title'] loop
       if jsonb_typeof(item->field) is distinct from 'string' or length(item->>field)>200 then return false; end if;
       if (item->>'enabled')::boolean and length(trim(item->>field))=0 then return false; end if;
     end loop;
     foreach field in array array['total','resolved','inProgress','overdue'] loop
       if jsonb_typeof(item->field) is distinct from 'number' then return false; end if;
       n := (item->>field)::numeric;
       if n<0 or n>2147483647 or trunc(n)<>n then return false; end if;
     end loop;
     if (item->>'total')::numeric <> (item->>'resolved')::numeric + (item->>'inProgress')::numeric + (item->>'overdue')::numeric then return false; end if;
   end loop;
 elsif kind in ('schedule','birthday') then
   if jsonb_typeof(value->'enabled') is distinct from 'boolean' then return false; end if;
   if kind='schedule' then
     if jsonb_typeof(value->'entries') is distinct from 'array' then return false; end if;
     if jsonb_array_length(value->'entries')<>4 then return false; end if;
     for item in select * from jsonb_array_elements(value->'entries') loop
       if item ? 'photoPath' and item->'photoPath' <> 'null'::jsonb then
         if jsonb_typeof(item->'photoPath') is distinct from 'string'
            or item->>'photoPath' not like (kind || '/%') then return false; end if;
       end if;
       foreach field in array array['name','title','day','time','location'] loop
         if jsonb_typeof(item->field) is distinct from 'string' or length(item->>field)>200 then return false; end if;
         if (value->>'enabled')::boolean and length(trim(item->>field))=0 then return false; end if;
       end loop;
     end loop;
   else
     foreach field in array array['name','department','message'] loop
       if jsonb_typeof(value->field) is distinct from 'string' or length(value->>field)>1000 then return false; end if;
       if (value->>'enabled')::boolean and length(trim(value->>field))=0 then return false; end if;
     end loop;
     if not (value ? 'photoPath') then return false; end if;
     if value->'photoPath' <> 'null'::jsonb and
        (jsonb_typeof(value->'photoPath')<>'string' or value->>'photoPath' not like 'birthday/%') then return false; end if;
     if (value->>'enabled')::boolean and coalesce(value->>'photoPath','')='' then return false; end if;
   end if;
 else return false;
 end if;
 return true;
end;
$$;

alter policy tv_media_select on storage.objects using (
 bucket_id='tv-media' and (
 ((storage.foldername(name))[1]='president' and (select public.can_manage_press()))
 or ((storage.foldername(name))[1] in ('employee','birthday','schedule') and (select public.can_manage_hr()))
 or ((storage.foldername(name))[1]='managers' and (select public.can_manage_appeals()))
 or exists(select 1 from public.president_content p where p.status='published' and p.portrait_path=storage.objects.name)
 or exists(select 1 from public.employee_content e where e.status='published' and e.photo_path=storage.objects.name)
 or exists(select 1 from public.birthday_content b where b.status='published' and b.payload->>'photoPath'=storage.objects.name)
 or exists(select 1 from public.schedule_content s, jsonb_array_elements(s.payload->'entries') e where s.status='published' and e->>'photoPath'=storage.objects.name)
 or exists(select 1 from public.managers_content m, jsonb_array_elements(m.payload->'managers') e where m.status='published' and e->>'photoPath'=storage.objects.name)
 ));
alter policy tv_media_insert on storage.objects with check (
 bucket_id='tv-media' and (
 ((storage.foldername(name))[1]='president' and (select public.can_manage_press()))
 or ((storage.foldername(name))[1] in ('employee','birthday','schedule') and (select public.can_manage_hr()))
 or ((storage.foldername(name))[1]='managers' and (select public.can_manage_appeals()))
 ));
alter policy tv_media_public_published on storage.objects using (
 bucket_id='tv-media' and (exists(select 1 from public.president_content p where p.status='published' and p.portrait_path=storage.objects.name)
 or exists(select 1 from public.employee_content e where e.status='published' and e.photo_path=storage.objects.name)
 or exists(select 1 from public.birthday_content b where b.status='published' and b.payload->>'photoPath'=storage.objects.name)
 or exists(select 1 from public.schedule_content s, jsonb_array_elements(s.payload->'entries') e where s.status='published' and e->>'photoPath'=storage.objects.name)
 or exists(select 1 from public.managers_content m, jsonb_array_elements(m.payload->'managers') e where m.status='published' and e->>'photoPath'=storage.objects.name))
 );
alter policy tv_media_delete on storage.objects using (
 bucket_id='tv-media' and (select public.is_super_admin())
 and not exists(select 1 from public.president_content p where p.portrait_path=storage.objects.name)
 and not exists(select 1 from public.employee_content e where e.photo_path=storage.objects.name)
 and not exists(select 1 from public.birthday_content b where b.payload->>'photoPath'=storage.objects.name)
 and not exists(select 1 from public.schedule_content s, jsonb_array_elements(s.payload->'entries') e where e->>'photoPath'=storage.objects.name)
 and not exists(select 1 from public.managers_content m, jsonb_array_elements(m.payload->'managers') e where e->>'photoPath'=storage.objects.name)
 );

-- All nine slides can now be controlled; a playlist may contain only department slides.
alter table public.slide_settings drop constraint slide_settings_one_enabled_chk;

-- Visibility-only updates preserve every other saved draft field and published field.
-- Super Admin only. Table/column names come exclusively from fixed mappings.
create function public.set_slide_visibility(_key text, _enabled boolean, _index integer default 0)
returns void language plpgsql security definer set search_path='' as $$
declare t text; col text; path text[]; p jsonb; d jsonb;
begin
 if not public.is_super_admin() then raise exception 'permission denied' using errcode='42501'; end if;
 if _enabled is null then raise exception 'enabled required' using errcode='22023'; end if;
 if _key in ('president','appeals','employee') then
   col := _key || '_enabled';
   perform 1 from public.slide_settings where status='draft' for update;
   execute format('update public.slide_settings set %I=$1, published_at=case when status=''published'' then now() else null end, published_by=case when status=''published'' then auth.uid() else null end',col) using _enabled;
 elsif _key in ('schedule','birthday','managers') then
   t := _key || '_content';
   if _key='managers' then
     if _index is null or _index not between 0 and 3 then raise exception 'invalid manager index' using errcode='22023'; end if;
     path := array['managers',_index::text,'enabled'];
   else path := array['enabled'];
   end if;
   -- Same draft-then-published lock order as the content publish RPCs.
   execute format('select payload from public.%I where status=''draft'' for update',t) into strict d;
   execute format('select payload from public.%I where status=''published'' for update',t) into strict p;
   p := jsonb_set(p,path,to_jsonb(_enabled));
   -- Disabled, incomplete drafts may be in progress. Check both before writing.
   d := jsonb_set(d,path,to_jsonb(_enabled));
   if not public.valid_department_content(_key,p) or not public.valid_department_content(_key,d) then
     raise exception 'Complete and publish this slide before enabling it' using errcode='23514';
   end if;
   execute format('update public.%I set payload=case when status=''draft'' then $1 else $2 end, published_at=case when status=''published'' then now() else null end, published_by=case when status=''published'' then auth.uid() else null end',t) using d,p;
 else raise exception 'invalid slide key' using errcode='22023';
 end if;
end;
$$;
revoke all on function public.set_slide_visibility(text,boolean,integer) from public,anon;
grant execute on function public.set_slide_visibility(text,boolean,integer) to authenticated;
