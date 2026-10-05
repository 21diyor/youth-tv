# Supabase — Youth TV

## Verified 2026-10-02

- Project: `yia-tv-platform` (`ymztqfzujdwfkqrsqzyu`), Frankfurt; active and healthy.
- API: `https://ymztqfzujdwfkqrsqzyu.supabase.co`.
- Schema, storage, public TV and department migrations are applied.
- Two department accounts were added with only their intended role: `murojaatlar`
  (Appeals Admin) and `hr2026` (HR Admin). Existing accounts were retained.
- All nine public tables have row-level security enabled.
- All seven content types have draft and published rows. Existing published data
  was preserved; no seed or initial import was rerun.
- Realtime publishes all seven content tables. Clients subscribe to published updates.
- HR owns schedule, employee and birthday content. Appeals owns citizen and manager
  statistics. Super Admin owns all content. Legacy Press Admin retains the quote.
- The user has published manager statistics, schedule and birthday content.
  No account has been reassigned to HR.
- Schedule and manager portraits are supported by the private media policies.
  Super Admin can switch all nine slides without publishing unrelated drafts.
- `tv-media` is private, limited to 5 MB JPG/PNG/WebP files.
- Local configuration uses the Supabase backend.

## Migration history

On 2026-10-01, public TV access was added. Anonymous visitors can read published
content and referenced photos. Drafts, unused uploads, administration tables and
write/publish operations remain protected. The storage bucket remains private.

| Local source | Remote version | Name |
| --- | --- | --- |
| `migrations/20260919000001_tv_content_draft_publish.sql` | `20260919105811` | `tv_content_draft_publish` |
| `migrations/20260919000002_tv_media_storage.sql` | `20260919152536` | `tv_media_storage` |
| `migrations/20261001084833_public_tv_read_access.sql` | `20261001084850` | `public_tv_read_access` |
| `migrations/20261001130042_hr_role.sql` | `20261001130224` | `hr_role` |
| `migrations/20261001130045_department_slides.sql` | `20261001130238` | `department_slides` |
| `migrations/20261001153328_manager_portraits_and_visibility.sql` | `20261001153447` | `manager_portraits_and_visibility` |

The existing files predate their remote application timestamps. Their historical
headers say proposed/not applied; current remote history confirms both are applied.
Do not rerun them against this project or use `db push` without reconciling history.
The migration SQL is preserved unchanged.

## Verification

`tests/permissions.sql` passed against the existing project on 2026-10-01. It checks
published reads, draft visibility, draft updates and publish RPC authorization for
all four configured roles. HR was also tested by temporarily assigning a test
identity inside a transaction; all role and content writes were rolled back.
Anonymous access and department validation tests also passed.
Anonymous users cannot execute any public SECURITY DEFINER function.

The visibility permissions and preservation tests passed with all writes rolled back.
The security advisor reports fourteen authenticated SECURITY DEFINER RPC/helper warnings.
The helpers check `auth.uid()` against the role table; publish functions enforce the
required role and use an empty search path. These functions support atomic publishing
and role lookups. They were reviewed and retained. Leaked-password protection is
reported disabled and should be reviewed by the account administrator.
See the [function advisor guidance](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
and [password protection guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Existing browser-local installations

The historical localStorage import cannot be proven from this checkout. Do not
replace the current database with default seed values. If a TV still has newer
browser-local content, compare its four published keys before migrating it:

- `youth-tv-president-content`
- `youth-tv-appeals-content`
- `youth-tv-employee-content`
- `youth-tv-slide-settings`

Use a Super Admin, validate each value, save drafts through the secured client,
publish, and compare the resulting database content before switching that device.
Unpublished local drafts must be reviewed separately. Preserve local data for rollback.

## Account management

Use Supabase Authentication to manage users and `public.user_roles` to assign roles.
Keep passwords out of source files and chat. TVs no longer need accounts; the existing
viewer accounts are retained but are not used by the public TV page.
Set the Auth Site URL to the deployed origin before adding email redirect flows.
The app currently signs in with email and password and does not expose public signup.
Department usernames map to internal email identifiers before Supabase password
sign-in. The shared `/admin` screen also accepts the Super Admin email. Both new
accounts passed login, own-draft access and cross-department publish-denial tests.
The temporary account provisioning function is disabled (HTTP 410, JWT required).
The Auth settings endpoint currently reports `disable_signup=false`; the earlier
setup notes claiming signups were disabled were stale. New accounts receive no
application role and cannot access content. Disable new signups in the Supabase
Auth settings if this deployment should remain invitation-only.

### Scheduled HR content (2026-10-03)

Local migration `20261003050630_scheduled_hr_content.sql` is applied remotely as `20261003050825`. `hr_plans` is private to HR and Super Admin, with separate draft/published payloads. Authenticated clients can write only draft columns; publishing uses the role-checked `publish_hr_plan` RPC. A unique partial index enforces one enabled published employee per month.

`current_hr_slides()` intentionally allows anonymous execution as SECURITY DEFINER with an empty search path. It accepts no date parameter and returns only enabled published content for the current Asia/Tashkent date, omitting birthday dates. Supabase's anonymous-definer advisory is expected for this narrowly scoped public TV endpoint ([advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)). Scheduled media is readable anonymously only when currently eligible. Future records and drafts are not available through the public RPC.

Verified with rollback-only SQL fixtures: multiple same-day birthdays, exclusion of other dates and future monthly entries, leap-day validation, duplicate-month rejection, draft/publish separation, HR access, appeals-role denial, and anonymous privacy. HR draft creation was also verified through the browser, then the test-only draft was removed.

### Shared directory migration

`20261005061954_shared_staff_directory.sql` reuses private birthday records as staff profiles and adds `staffId` to monthly draft payloads. Existing employee profiles are copied into the directory with birthdays disabled until HR supplies a date. Publishing monthly awards resolves name, role, department and photo from the selected staff profile on the server. Storage accepts both existing HR photo prefixes, with public reads still limited to currently eligible published references. RLS and the date-only public RPC remain unchanged. Verified HR profile reuse, automatic birthday selection, future-month exclusion, and rejection of nonexistent staff IDs using rolled-back fixtures.
