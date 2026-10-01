-- A separate transaction makes the enum value usable in the next migration.
alter type public.app_role add value if not exists 'hr_admin';
