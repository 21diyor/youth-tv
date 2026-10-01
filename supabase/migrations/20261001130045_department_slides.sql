-- Department-owned content. New slides start disabled until real content is published.
create function public.can_manage_hr() returns boolean language sql stable security definer set search_path = '' as $$
 select public.has_role('super_admin') or public.has_role('hr_admin');
$$;
revoke all on function public.can_manage_hr() from public, anon;
grant execute on function public.can_manage_hr() to authenticated;

-- Validate the JSON boundary independently of the editor.
create function public.valid_department_content(kind text, value jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare item jsonb; field text; n numeric;
begin
 if jsonb_typeof(value) is distinct from 'object' then return false; end if;
 if kind = 'managers' then
   if jsonb_typeof(value->'managers') is distinct from 'array' then return false; end if;
   if jsonb_array_length(value->'managers') <> 4 then return false; end if;
   for item in select * from jsonb_array_elements(value->'managers') loop
     if jsonb_typeof(item->'enabled') is distinct from 'boolean' then return false; end if;
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
revoke all on function public.valid_department_content(text,jsonb) from public, anon;
grant execute on function public.valid_department_content(text,jsonb) to authenticated;


create table public.schedule_content (
 status public.content_status primary key,
 payload jsonb not null constraint schedule_content_payload_chk check (public.valid_department_content('schedule',payload)),
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id) on delete set null,
 published_at timestamptz,
 published_by uuid references auth.users(id) on delete set null,
 check ((status='published')=(published_at is not null))
);
insert into public.schedule_content(status,payload,published_at)
select s, $json${"enabled":false,"entries":[{"name":"","title":"","day":"","time":"","location":""},{"name":"","title":"","day":"","time":"","location":""},{"name":"","title":"","day":"","time":"","location":""},{"name":"","title":"","day":"","time":"","location":""}]}$json$::jsonb, case when s='published' then now() end
from unnest(enum_range(null::public.content_status)) s;
alter table public.schedule_content enable row level security;
revoke all on public.schedule_content from anon, authenticated;
grant select on public.schedule_content to anon, authenticated;
grant update(payload) on public.schedule_content to authenticated;
create policy schedule_content_public on public.schedule_content for select to anon using (status='published');
create policy schedule_content_select on public.schedule_content for select to authenticated
 using (status='published' or (status='draft' and (select public.can_manage_hr())));
create policy schedule_content_update on public.schedule_content for update to authenticated
 using(status='draft' and (select public.can_manage_hr()))
 with check(status='draft' and (select public.can_manage_hr()));
create trigger schedule_content_before_update before update on public.schedule_content for each row execute function public.tv_content_before_update();
create trigger schedule_content_block_rows before insert or delete on public.schedule_content for each row execute function public.tv_content_block_row_changes();
create trigger schedule_content_block_truncate before truncate on public.schedule_content for each statement execute function public.tv_content_block_row_changes();
create trigger schedule_content_audit after update on public.schedule_content for each row execute function public.tv_content_audit();
create function public.publish_schedule_content() returns public.schedule_content
language plpgsql security definer set search_path='' as $$
declare d public.schedule_content; p public.schedule_content;
begin
 if not public.can_manage_hr() then raise exception 'permission denied' using errcode='42501'; end if;
 select * into strict d from public.schedule_content where status='draft' for update;
 update public.schedule_content set payload=d.payload,published_at=now(),published_by=auth.uid() where status='published' returning * into strict p;
 return p;
end;
$$;
revoke all on function public.publish_schedule_content() from public, anon;
grant execute on function public.publish_schedule_content() to authenticated;
alter publication supabase_realtime add table public.schedule_content;

create table public.managers_content (
 status public.content_status primary key,
 payload jsonb not null constraint managers_content_payload_chk check (public.valid_department_content('managers',payload)),
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id) on delete set null,
 published_at timestamptz,
 published_by uuid references auth.users(id) on delete set null,
 check ((status='published')=(published_at is not null))
);
insert into public.managers_content(status,payload,published_at)
select s, $json${"managers":[{"enabled":false,"name":"","title":"","total":0,"resolved":0,"inProgress":0,"overdue":0},{"enabled":false,"name":"","title":"","total":0,"resolved":0,"inProgress":0,"overdue":0},{"enabled":false,"name":"","title":"","total":0,"resolved":0,"inProgress":0,"overdue":0},{"enabled":false,"name":"","title":"","total":0,"resolved":0,"inProgress":0,"overdue":0}]}$json$::jsonb, case when s='published' then now() end
from unnest(enum_range(null::public.content_status)) s;
alter table public.managers_content enable row level security;
revoke all on public.managers_content from anon, authenticated;
grant select on public.managers_content to anon, authenticated;
grant update(payload) on public.managers_content to authenticated;
create policy managers_content_public on public.managers_content for select to anon using (status='published');
create policy managers_content_select on public.managers_content for select to authenticated
 using (status='published' or (status='draft' and (select public.can_manage_appeals())));
create policy managers_content_update on public.managers_content for update to authenticated
 using(status='draft' and (select public.can_manage_appeals()))
 with check(status='draft' and (select public.can_manage_appeals()));
create trigger managers_content_before_update before update on public.managers_content for each row execute function public.tv_content_before_update();
create trigger managers_content_block_rows before insert or delete on public.managers_content for each row execute function public.tv_content_block_row_changes();
create trigger managers_content_block_truncate before truncate on public.managers_content for each statement execute function public.tv_content_block_row_changes();
create trigger managers_content_audit after update on public.managers_content for each row execute function public.tv_content_audit();
create function public.publish_managers_content() returns public.managers_content
language plpgsql security definer set search_path='' as $$
declare d public.managers_content; p public.managers_content;
begin
 if not public.can_manage_appeals() then raise exception 'permission denied' using errcode='42501'; end if;
 select * into strict d from public.managers_content where status='draft' for update;
 update public.managers_content set payload=d.payload,published_at=now(),published_by=auth.uid() where status='published' returning * into strict p;
 return p;
end;
$$;
revoke all on function public.publish_managers_content() from public, anon;
grant execute on function public.publish_managers_content() to authenticated;
alter publication supabase_realtime add table public.managers_content;

create table public.birthday_content (
 status public.content_status primary key,
 payload jsonb not null constraint birthday_content_payload_chk check (public.valid_department_content('birthday',payload)),
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id) on delete set null,
 published_at timestamptz,
 published_by uuid references auth.users(id) on delete set null,
 check ((status='published')=(published_at is not null))
);
insert into public.birthday_content(status,payload,published_at)
select s, $json${"enabled":false,"name":"","department":"","message":"Tug‘ilgan kuningiz muborak! Sizga mustahkam sog‘liq, baxt va ulkan muvaffaqiyatlar tilaymiz!","photoPath":null}$json$::jsonb, case when s='published' then now() end
from unnest(enum_range(null::public.content_status)) s;
alter table public.birthday_content enable row level security;
revoke all on public.birthday_content from anon, authenticated;
grant select on public.birthday_content to anon, authenticated;
grant update(payload) on public.birthday_content to authenticated;
create policy birthday_content_public on public.birthday_content for select to anon using (status='published');
create policy birthday_content_select on public.birthday_content for select to authenticated
 using (status='published' or (status='draft' and (select public.can_manage_hr())));
create policy birthday_content_update on public.birthday_content for update to authenticated
 using(status='draft' and (select public.can_manage_hr()))
 with check(status='draft' and (select public.can_manage_hr()));
create trigger birthday_content_before_update before update on public.birthday_content for each row execute function public.tv_content_before_update();
create trigger birthday_content_block_rows before insert or delete on public.birthday_content for each row execute function public.tv_content_block_row_changes();
create trigger birthday_content_block_truncate before truncate on public.birthday_content for each statement execute function public.tv_content_block_row_changes();
create trigger birthday_content_audit after update on public.birthday_content for each row execute function public.tv_content_audit();
create function public.publish_birthday_content() returns public.birthday_content
language plpgsql security definer set search_path='' as $$
declare d public.birthday_content; p public.birthday_content;
begin
 if not public.can_manage_hr() then raise exception 'permission denied' using errcode='42501'; end if;
 select * into strict d from public.birthday_content where status='draft' for update;
 update public.birthday_content set payload=d.payload,published_at=now(),published_by=auth.uid() where status='published' returning * into strict p;
 return p;
end;
$$;
revoke all on function public.publish_birthday_content() from public, anon;
grant execute on function public.publish_birthday_content() to authenticated;
alter publication supabase_realtime add table public.birthday_content;

-- Employee of the Month belongs to HR.
alter policy employee_content_select on public.employee_content
 using ((status='published' and (select public.has_any_role())) or (status='draft' and (select public.can_manage_hr())));
alter policy employee_content_update_draft on public.employee_content
 using (status='draft' and (select public.can_manage_hr()))
 with check (status='draft' and (select public.can_manage_hr()));
-- Keep the existing atomic publish implementation; replace its permission guard.
do $migration$
declare definition text;
begin
 select pg_get_functiondef('public.publish_employee_content()'::regprocedure) into definition;
 execute replace(definition, 'public.can_manage_press()', 'public.can_manage_hr()');
end;
$migration$;

alter policy tv_media_select on storage.objects using (
 bucket_id='tv-media' and (
 ((storage.foldername(name))[1]='president' and (select public.can_manage_press()))
 or ((storage.foldername(name))[1] in ('employee','birthday') and (select public.can_manage_hr()))
 or exists(select 1 from public.president_content p where p.status='published' and p.portrait_path=storage.objects.name)
 or exists(select 1 from public.employee_content e where e.status='published' and e.photo_path=storage.objects.name)
 or exists(select 1 from public.birthday_content b where b.status='published' and b.payload->>'photoPath'=storage.objects.name)
 ));
alter policy tv_media_insert on storage.objects with check (
 bucket_id='tv-media' and (
 ((storage.foldername(name))[1]='president' and (select public.can_manage_press()))
 or ((storage.foldername(name))[1] in ('employee','birthday') and (select public.can_manage_hr()))
 ));
alter policy tv_media_public_published on storage.objects using (
 bucket_id='tv-media' and (
 exists(select 1 from public.president_content p where p.status='published' and p.portrait_path=storage.objects.name)
 or exists(select 1 from public.employee_content e where e.status='published' and e.photo_path=storage.objects.name)
 or exists(select 1 from public.birthday_content b where b.status='published' and b.payload->>'photoPath'=storage.objects.name)
 ));
alter policy tv_media_delete on storage.objects using (
 bucket_id='tv-media' and (select public.is_super_admin())
 and not exists(select 1 from public.president_content p where p.portrait_path=storage.objects.name)
 and not exists(select 1 from public.employee_content e where e.photo_path=storage.objects.name)
 and not exists(select 1 from public.birthday_content b where b.payload->>'photoPath'=storage.objects.name)
);
