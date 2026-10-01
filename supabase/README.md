# Supabase — Youth TV

## Verified 2026-10-01

- Project: `yia-tv-platform` (`ymztqfzujdwfkqrsqzyu`), Frankfurt; active and healthy.
- API: `https://ymztqfzujdwfkqrsqzyu.supabase.co`.
- Schema, storage, public TV and department migrations are applied.
- Six accounts have roles: one Super Admin, one Press Admin, one Appeals Admin,
  and three TV Viewers.
- All nine public tables have row-level security enabled.
- All seven content types have draft and published rows. Existing published data
  was preserved; no seed or initial import was rerun.
- Realtime publishes all seven content tables. Clients subscribe to published updates.
- HR owns schedule, employee and birthday content. Appeals owns citizen and manager
  statistics. Super Admin owns all content. Legacy Press Admin retains the quote.
- The four user-provided manager names/titles are saved in manager and schedule
  drafts. New slides remain disabled pending real counts, schedule and birthday
  details. No account has been reassigned to HR.
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

The security advisor reports thirteen authenticated SECURITY DEFINER RPC/helper warnings.
The helpers check `auth.uid()` against the role table; publish functions enforce the
required role and use an empty search path. These functions support atomic publishing
and role lookups. They were reviewed and retained. Leaked-password protection is
reported disabled and should be reviewed by the account administrator.

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
The Auth settings endpoint currently reports `disable_signup=false`; the earlier
setup notes claiming signups were disabled were stale. New accounts receive no
application role and cannot access content. Disable new signups in the Supabase
Auth settings if this deployment should remain invitation-only.
