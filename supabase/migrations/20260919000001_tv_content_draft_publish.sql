-- ============================================================================
-- YIA TV Monitoring Platform — draft/publish content schema
-- Migration: 20260919000001_tv_content_draft_publish.sql
--
-- STATUS: PROPOSED — NOT APPLIED.
--   Approved design, 2026-09-19. Do not run until explicitly approved.
--
-- Seed rows below are tvData.ts defaults and are ONLY a fallback for a
-- brand-new installation. Before VITE_DATA_BACKEND is switched to "supabase",
-- the one-time localStorage → Supabase import MUST copy the live published
-- localStorage values into BOTH the draft and published rows.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUMS
-- ----------------------------------------------------------------------------
create type public.app_role as enum
  ('super_admin', 'appeals_admin', 'press_admin', 'tv_viewer');

create type public.content_status as enum
  ('draft', 'published');

-- ----------------------------------------------------------------------------
-- 2. ROLES TABLE
-- ----------------------------------------------------------------------------
create table public.user_roles (
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- ----------------------------------------------------------------------------
-- 3. ROLE HELPERS (security definer: read user_roles without RLS recursion)
-- ----------------------------------------------------------------------------
create or replace function public.has_role(_role public.app_role)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = _role
  );
$$;

create or replace function public.has_any_role()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select public.has_role('super_admin');
$$;

-- President quote + Employee of the Month
create or replace function public.can_manage_press()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select public.has_role('super_admin') or public.has_role('press_admin');
$$;

-- Citizen appeals
create or replace function public.can_manage_appeals()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select public.has_role('super_admin') or public.has_role('appeals_admin');
$$;

-- ----------------------------------------------------------------------------
-- 4. CONTENT TABLES (exactly one 'draft' + one 'published' row each)
-- ----------------------------------------------------------------------------
create table public.president_content (
  status        public.content_status primary key,
  name          text not null,
  position      text not null,
  quote         text not null,
  source_date   text not null,
  portrait_path text,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null,
  published_at  timestamptz,
  published_by  uuid references auth.users (id) on delete set null,
  constraint president_portrait_path_chk
    check (portrait_path is null or portrait_path like 'president/%'),
  constraint president_published_at_chk
    check ((status = 'published') = (published_at is not null))
);

create table public.appeals_content (
  status       public.content_status primary key,
  total        integer not null check (total >= 0),
  resolved     integer not null check (resolved >= 0),
  in_progress  integer not null check (in_progress >= 0),
  overdue      integer not null check (overdue >= 0),
  trend        jsonb not null,
  categories   jsonb not null,
  regions      jsonb not null,
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  published_by uuid references auth.users (id) on delete set null,
  constraint appeals_status_sum_chk
    check (resolved + in_progress + overdue = total),
  constraint appeals_trend_chk check (
    case when jsonb_typeof(trend) = 'array'
      then jsonb_array_length(trend) between 1 and 12 else false end),
  constraint appeals_categories_chk check (
    case when jsonb_typeof(categories) = 'array'
      then jsonb_array_length(categories) = 4 else false end),
  constraint appeals_regions_chk check (
    case when jsonb_typeof(regions) = 'array'
      then jsonb_array_length(regions) = 5 else false end),
  constraint appeals_published_at_chk
    check ((status = 'published') = (published_at is not null))
);

create table public.employee_content (
  status       public.content_status primary key,
  month        text not null,
  year         integer not null check (year between 2000 and 2100),
  name         text not null,
  position     text not null,
  department   text not null,
  recognition  text not null,
  achievements jsonb not null,
  photo_path   text,
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  published_by uuid references auth.users (id) on delete set null,
  constraint employee_achievements_chk check (
    case when jsonb_typeof(achievements) = 'array'
      then jsonb_array_length(achievements) = 3 else false end),
  constraint employee_photo_path_chk
    check (photo_path is null or photo_path like 'employee/%'),
  constraint employee_published_at_chk
    check ((status = 'published') = (published_at is not null))
);

create table public.slide_settings (
  status            public.content_status primary key,
  interval_seconds  integer not null check (interval_seconds between 5 and 300),
  president_enabled boolean not null,
  appeals_enabled   boolean not null,
  employee_enabled  boolean not null,
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users (id) on delete set null,
  published_at      timestamptz,
  published_by      uuid references auth.users (id) on delete set null,
  constraint slide_settings_one_enabled_chk
    check (president_enabled or appeals_enabled or employee_enabled),
  constraint slide_settings_published_at_chk
    check ((status = 'published') = (published_at is not null))
);

-- ----------------------------------------------------------------------------
-- 5. AUDIT LOG
-- ----------------------------------------------------------------------------
create table public.audit_log (
  id          bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor       uuid,
  table_name  text not null,
  row_status  public.content_status,
  action      text not null
    check (action in ('save_draft', 'publish', 'role_grant', 'role_revoke')),
  old_row     jsonb,
  new_row     jsonb
);

create index audit_log_table_time_idx
  on public.audit_log (table_name, occurred_at desc);

-- ----------------------------------------------------------------------------
-- 6. SEED — tvData.ts defaults, identical draft + published.
--    Fallback for a new installation only; overwritten by the one-time
--    localStorage import before the supabase backend is activated.
-- ----------------------------------------------------------------------------
insert into public.president_content
  (status, name, position, quote, source_date, published_at)
select s,
  'Shavkat Mirziyoyev',
  'O‘zbekiston Respublikasi Prezidenti',
  'Sizlar Yangi O‘zbekistonda yangi uyg‘onish davri – Uchinchi Renessans poydevorini yaratadigan kuch bo‘lishingiz kerak!',
  '30 iyun 2026',
  case when s = 'published' then now() end
from unnest(enum_range(null::public.content_status)) as s;

insert into public.appeals_content
  (status, total, resolved, in_progress, overdue, trend, categories, regions, published_at)
select s, 12842, 10491, 1924, 427,
  $j$[{"month":"Yan","appeals":820},{"month":"Fev","appeals":940},
      {"month":"Mar","appeals":875},{"month":"Apr","appeals":1120},
      {"month":"May","appeals":1060},{"month":"Iyun","appeals":1240},
      {"month":"Iyul","appeals":1180},{"month":"Avg","appeals":1390},
      {"month":"Sen","appeals":1425}]$j$::jsonb,
  $j$[{"category":"Bandlik","appeals":3421},{"category":"Ta'lim","appeals":2845},
      {"category":"Ijtimoiy yordam","appeals":2104},{"category":"Uy-joy","appeals":1608}]$j$::jsonb,
  $j$[{"region":"Toshkent shahri","appeals":1482},{"region":"Samarqand","appeals":1237},
      {"region":"Farg'ona","appeals":1104},{"region":"Andijon","appeals":986},
      {"region":"Qashqadaryo","appeals":941}]$j$::jsonb,
  case when s = 'published' then now() end
from unnest(enum_range(null::public.content_status)) as s;

insert into public.employee_content
  (status, month, year, name, position, department, recognition, achievements, published_at)
select s, 'Sentabr', 2026, 'Ism Familiya', 'Bosh mutaxassis', 'Bo‘lim nomi',
  $t$Agentlik faoliyatiga qo‘shgan munosib hissasi, tashabbuskorligi va belgilangan vazifalarni yuqori sifat bilan amalga oshirgani uchun e'tirof etildi.$t$,
  $j$["Agentlik faoliyatidagi muhim loyihalarni belgilangan muddatlarda va yuqori sifat bilan amalga oshirdi.",
      "Ish jarayonlarini takomillashtirish bo‘yicha samarali tashabbuslarni ilgari surdi.",
      "Jamoaviy ishlarda faollik ko‘rsatib, bo‘lim faoliyati samaradorligiga munosib hissa qo‘shdi."]$j$::jsonb,
  case when s = 'published' then now() end
from unnest(enum_range(null::public.content_status)) as s;

insert into public.slide_settings
  (status, interval_seconds, president_enabled, appeals_enabled, employee_enabled, published_at)
select s, 12, true, true, true,
  case when s = 'published' then now() end
from unnest(enum_range(null::public.content_status)) as s;

-- ----------------------------------------------------------------------------
-- 7. CONTENT TRIGGERS
-- ----------------------------------------------------------------------------

-- Stamp metadata, freeze status, keep draft rows free of publish metadata.
create or replace function public.tv_content_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    raise exception 'status is immutable' using errcode = '42501';
  end if;

  new.updated_at := now();
  new.updated_by := auth.uid();

  if new.status = 'draft' then
    new.published_at := null;
    new.published_by := null;
  end if;

  return new;
end;
$$;

-- Exactly two rows forever: no insert / delete / truncate after seeding.
create or replace function public.tv_content_block_row_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% rows are fixed (draft + published); % is not allowed',
    tg_table_name, tg_op
    using errcode = '42501';
end;
$$;

-- Audit every draft save and publish.
create or replace function public.tv_content_audit()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.audit_log
    (actor, table_name, row_status, action, old_row, new_row)
  values (
    auth.uid(),
    tg_table_name,
    new.status,
    case when new.status = 'published' then 'publish' else 'save_draft' end,
    to_jsonb(old),
    to_jsonb(new)
  );
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'president_content', 'appeals_content', 'employee_content', 'slide_settings'
  ] loop
    execute format(
      'create trigger %1$s_before_update before update on public.%1$I
         for each row execute function public.tv_content_before_update()', t);
    execute format(
      'create trigger %1$s_block_rows before insert or delete on public.%1$I
         for each row execute function public.tv_content_block_row_changes()', t);
    execute format(
      'create trigger %1$s_block_truncate before truncate on public.%1$I
         for each statement execute function public.tv_content_block_row_changes()', t);
    execute format(
      'create trigger %1$s_audit after update on public.%1$I
         for each row execute function public.tv_content_audit()', t);
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- 8. USER_ROLES TRIGGERS (last super admin, TV-account isolation, audit)
-- ----------------------------------------------------------------------------
create or replace function public.user_roles_guard()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.role = 'super_admin' and (
      select count(*) from public.user_roles where role = 'super_admin'
    ) <= 1 then
      raise exception 'cannot remove the last super_admin' using errcode = 'P0001';
    end if;
    return old;
  end if;

  if new.role = 'tv_viewer' and exists (
    select 1 from public.user_roles
    where user_id = new.user_id and role <> 'tv_viewer'
  ) then
    raise exception 'tv_viewer accounts cannot hold admin roles' using errcode = 'P0001';
  end if;

  if new.role <> 'tv_viewer' and exists (
    select 1 from public.user_roles
    where user_id = new.user_id and role = 'tv_viewer'
  ) then
    raise exception 'tv_viewer accounts cannot hold admin roles' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger user_roles_guard
  before insert or delete on public.user_roles
  for each row execute function public.user_roles_guard();

create or replace function public.user_roles_audit()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.audit_log (actor, table_name, action, old_row, new_row)
  values (
    auth.uid(),
    'user_roles',
    case when tg_op = 'INSERT' then 'role_grant' else 'role_revoke' end,
    case when tg_op = 'DELETE' then to_jsonb(old) end,
    case when tg_op = 'INSERT' then to_jsonb(new) end
  );
  return null;
end;
$$;

create trigger user_roles_audit
  after insert or delete on public.user_roles
  for each row execute function public.user_roles_audit();

-- ----------------------------------------------------------------------------
-- 9. PUBLISH RPCs (atomic, permission-checked, draft row locked)
-- ----------------------------------------------------------------------------
create or replace function public.publish_president_content()
returns public.president_content
language plpgsql security definer
set search_path = ''
as $$
declare
  _draft     public.president_content;
  _published public.president_content;
begin
  if not public.can_manage_press() then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select * into _draft
  from public.president_content
  where status = 'draft'
  for update;

  if not found then
    raise exception 'president_content draft row missing';
  end if;

  update public.president_content
  set name          = _draft.name,
      position      = _draft.position,
      quote         = _draft.quote,
      source_date   = _draft.source_date,
      portrait_path = _draft.portrait_path,
      published_at  = now(),
      published_by  = auth.uid()
  where status = 'published'
  returning * into _published;

  if not found then
    raise exception 'president_content published row missing';
  end if;

  return _published;
end;
$$;

create or replace function public.publish_appeals_content()
returns public.appeals_content
language plpgsql security definer
set search_path = ''
as $$
declare
  _draft     public.appeals_content;
  _published public.appeals_content;
begin
  if not public.can_manage_appeals() then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select * into _draft
  from public.appeals_content
  where status = 'draft'
  for update;

  if not found then
    raise exception 'appeals_content draft row missing';
  end if;

  update public.appeals_content
  set total        = _draft.total,
      resolved     = _draft.resolved,
      in_progress  = _draft.in_progress,
      overdue      = _draft.overdue,
      trend        = _draft.trend,
      categories   = _draft.categories,
      regions      = _draft.regions,
      published_at = now(),
      published_by = auth.uid()
  where status = 'published'
  returning * into _published;

  if not found then
    raise exception 'appeals_content published row missing';
  end if;

  return _published;
end;
$$;

create or replace function public.publish_employee_content()
returns public.employee_content
language plpgsql security definer
set search_path = ''
as $$
declare
  _draft     public.employee_content;
  _published public.employee_content;
begin
  if not public.can_manage_press() then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select * into _draft
  from public.employee_content
  where status = 'draft'
  for update;

  if not found then
    raise exception 'employee_content draft row missing';
  end if;

  update public.employee_content
  set month        = _draft.month,
      year         = _draft.year,
      name         = _draft.name,
      position     = _draft.position,
      department   = _draft.department,
      recognition  = _draft.recognition,
      achievements = _draft.achievements,
      photo_path   = _draft.photo_path,
      published_at = now(),
      published_by = auth.uid()
  where status = 'published'
  returning * into _published;

  if not found then
    raise exception 'employee_content published row missing';
  end if;

  return _published;
end;
$$;

create or replace function public.publish_slide_settings()
returns public.slide_settings
language plpgsql security definer
set search_path = ''
as $$
declare
  _draft     public.slide_settings;
  _published public.slide_settings;
begin
  if not public.is_super_admin() then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select * into _draft
  from public.slide_settings
  where status = 'draft'
  for update;

  if not found then
    raise exception 'slide_settings draft row missing';
  end if;

  update public.slide_settings
  set interval_seconds  = _draft.interval_seconds,
      president_enabled = _draft.president_enabled,
      appeals_enabled   = _draft.appeals_enabled,
      employee_enabled  = _draft.employee_enabled,
      published_at      = now(),
      published_by      = auth.uid()
  where status = 'published'
  returning * into _published;

  if not found then
    raise exception 'slide_settings published row missing';
  end if;

  return _published;
end;
$$;

-- ----------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.user_roles        enable row level security;
alter table public.president_content enable row level security;
alter table public.appeals_content   enable row level security;
alter table public.employee_content  enable row level security;
alter table public.slide_settings    enable row level security;
alter table public.audit_log         enable row level security;

-- President: published → any role; draft → press/super
create policy president_content_select on public.president_content
  for select to authenticated
  using (
    (status = 'published' and (select public.has_any_role()))
    or (status = 'draft' and (select public.can_manage_press()))
  );

create policy president_content_update_draft on public.president_content
  for update to authenticated
  using      (status = 'draft' and (select public.can_manage_press()))
  with check (status = 'draft' and (select public.can_manage_press()));

-- Appeals: published → any role; draft → appeals/super
create policy appeals_content_select on public.appeals_content
  for select to authenticated
  using (
    (status = 'published' and (select public.has_any_role()))
    or (status = 'draft' and (select public.can_manage_appeals()))
  );

create policy appeals_content_update_draft on public.appeals_content
  for update to authenticated
  using      (status = 'draft' and (select public.can_manage_appeals()))
  with check (status = 'draft' and (select public.can_manage_appeals()));

-- Employee: published → any role; draft → press/super
create policy employee_content_select on public.employee_content
  for select to authenticated
  using (
    (status = 'published' and (select public.has_any_role()))
    or (status = 'draft' and (select public.can_manage_press()))
  );

create policy employee_content_update_draft on public.employee_content
  for update to authenticated
  using      (status = 'draft' and (select public.can_manage_press()))
  with check (status = 'draft' and (select public.can_manage_press()));

-- Slide settings: published → any role; draft → super only
create policy slide_settings_select on public.slide_settings
  for select to authenticated
  using (
    (status = 'published' and (select public.has_any_role()))
    or (status = 'draft' and (select public.is_super_admin()))
  );

create policy slide_settings_update_draft on public.slide_settings
  for update to authenticated
  using      (status = 'draft' and (select public.is_super_admin()))
  with check (status = 'draft' and (select public.is_super_admin()));

-- User roles
create policy user_roles_select on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_super_admin()));

create policy user_roles_insert on public.user_roles
  for insert to authenticated
  with check ((select public.is_super_admin()));

create policy user_roles_delete on public.user_roles
  for delete to authenticated
  using ((select public.is_super_admin()));

-- Audit log: super admin read-only; written only by definer triggers
create policy audit_log_select on public.audit_log
  for select to authenticated
  using ((select public.is_super_admin()));

-- ----------------------------------------------------------------------------
-- 11. GRANTS (no anon access; content-column-only updates)
-- ----------------------------------------------------------------------------
revoke all on
  public.user_roles, public.president_content, public.appeals_content,
  public.employee_content, public.slide_settings, public.audit_log
from anon, authenticated;

grant select on
  public.president_content, public.appeals_content,
  public.employee_content, public.slide_settings, public.audit_log
to authenticated;

grant update (name, position, quote, source_date, portrait_path)
  on public.president_content to authenticated;

grant update (total, resolved, in_progress, overdue, trend, categories, regions)
  on public.appeals_content to authenticated;

grant update (month, year, name, position, department, recognition, achievements, photo_path)
  on public.employee_content to authenticated;

grant update (interval_seconds, president_enabled, appeals_enabled, employee_enabled)
  on public.slide_settings to authenticated;

grant select, insert, delete on public.user_roles to authenticated;

revoke execute on function
  public.has_role(public.app_role), public.has_any_role(), public.is_super_admin(),
  public.can_manage_press(), public.can_manage_appeals(),
  public.publish_president_content(), public.publish_appeals_content(),
  public.publish_employee_content(), public.publish_slide_settings()
from public, anon;

grant execute on function
  public.has_role(public.app_role), public.has_any_role(), public.is_super_admin(),
  public.can_manage_press(), public.can_manage_appeals(),
  public.publish_president_content(), public.publish_appeals_content(),
  public.publish_employee_content(), public.publish_slide_settings()
to authenticated;

revoke execute on function
  public.tv_content_before_update(), public.tv_content_block_row_changes(),
  public.tv_content_audit(), public.user_roles_guard(), public.user_roles_audit()
from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 12. REALTIME (RLS-filtered; TV client subscribes with status=eq.published)
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table
  public.president_content,
  public.appeals_content,
  public.employee_content,
  public.slide_settings;

-- ============================================================================
-- BOOTSTRAP (manual, once, in the SQL editor after creating users in Auth):
--   insert into public.user_roles (user_id, role) values
--     ('<super-admin-uuid>', 'super_admin'),
--     ('<tv-1-uuid>', 'tv_viewer'),
--     ('<tv-2-uuid>', 'tv_viewer'),
--     ('<tv-3-uuid>', 'tv_viewer');
-- ============================================================================
