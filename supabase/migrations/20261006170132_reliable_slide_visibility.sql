create or replace function public.set_slide_visibility(_key text, _enabled boolean, _index integer default 0)
returns void language plpgsql security definer set search_path='' as $$
declare t text; col text; path text[]; p jsonb; d jsonb;
begin
 if not public.is_super_admin() then raise exception 'permission denied' using errcode='42501'; end if;
 if _enabled is null then raise exception 'enabled required' using errcode='22023'; end if;
 if _key in ('president','appeals','employee') then
   col := _key || '_enabled';
   perform 1 from public.slide_settings where status='draft' for update;
   execute format('update public.slide_settings set %I=$1, published_at=case when status=''published'' then now() else null end, published_by=case when status=''published'' then auth.uid() else null end where status in (''draft'',''published'')',col) using _enabled;
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
   execute format('update public.%I set payload=case when status=''draft'' then $1 else $2 end, published_at=case when status=''published'' then now() else null end, published_by=case when status=''published'' then auth.uid() else null end where status in (''draft'',''published'')',t) using d,p;
 else raise exception 'invalid slide key' using errcode='22023';
 end if;
end;
$$;
revoke all on function public.set_slide_visibility(text,boolean,integer) from public,anon;
grant execute on function public.set_slide_visibility(text,boolean,integer) to authenticated;
