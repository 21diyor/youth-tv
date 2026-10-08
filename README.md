# Youth TV

Uzbek-language TV slideshow and administration panel for Yoshlar ishlari agentligi.
Built with React, TypeScript and Vite; Supabase provides authentication, Postgres,
Realtime and private image storage. Vercel hosts the frontend.

## Run locally

Use Node.js 24 and npm.

```powershell
npm ci
Copy-Item .env.example .env.local
# Set the project URL and publishable key in .env.local.
npm run dev
```

- `/`: public TV slideshow; no account or password required.
- `/admin`: administrator login, draft editing and publishing.
- All administrators sign in at `/admin`. Department usernames and Super Admin
  email addresses use the same login field. Older department URLs return here.
- `Saqlash` saves a draft; `E’lon qilish` publishes it to the TVs.
- Arrow keys change slides.
- Bottom controls provide Previous, Pause/Play, Next and Fullscreen. Space pauses
  playback; the timer and progress bar resume where they stopped. Controls fade
  after six seconds and reappear on pointer, touch or keyboard interaction.
- The bottom progress line shows time remaining before the next animated slide.
- TV mode uses large type and simplified content for viewing from a distance.
  Schedule cards use a two-by-two layout. Appeals retain trend, status and bar
  charts with large labels. Extra achievements and department text remain saved
  in the admin editors but are omitted on TV.
- TV colors follow Asia/Tashkent: light from 06:00 (inclusive) to 18:30,
  dark from 18:30 through 05:59. Open TVs check every second and on wake/resume;
  a theme change does not restart the slideshow or require a reload.
- Order: citizen appeals, management schedule, four manager statistics slides,
  birthday, Employee of the Month, President quote. Disabled slides are skipped.
- Calendar dates and the displayed employee month/year follow Asia/Tashkent
  automatically. The President quote's source date remains historical attribution.
- New department slides start disabled. Enter real content, enable the slide,
  save, then publish. Birthday slides stay active until HR disables and publishes
  them; no personal birth date is collected.
- Published changes arrive through Realtime, with a 30-second background refetch.
  TVs also refetch on reconnect and when the browser becomes visible again.
  Failed initial loads and photo downloads retry automatically every 30 seconds.

`VITE_DATA_BACKEND=supabase` enables the shared backend. Set it to `local` only
for the original browser-local prototype. Existing local content is retained.
Never put a Supabase secret/service-role key in a `VITE_*` variable.

## Access

| Role | Access |
| --- | --- |
| `super_admin` | All editors, slideshow settings and overview |
| `press_admin` | President editor (legacy role) |
| `hr_admin` | Management schedule, Employee of the Month, birthday |
| `appeals_admin` | Citizen appeals and four manager statistics editors |
| Visitor (no login) | Published slideshow and its photos |

Accounts and roles are managed by an administrator in Supabase. Database row-level
security enforces permissions independently of the frontend. Uploaded JPG, PNG
and WebP images use the private `tv-media` bucket (maximum 5 MB).

Upload each manager's portrait in HR → Management schedule. Manager appeals slides
reuse that portrait unless a separate photo is uploaded in the appeals editor.
Save and publish to show changed portraits on TVs.

Super Admin slideshow settings include all nine visibility switches. Each switch
immediately changes visibility without publishing other draft edits. Incomplete
slides must be completed and published before enabling them. The interval has its
own publish button. Each account sees its permitted editors after signing in.
The admin light/dark button changes this browser's admin appearance and remembers
the choice. TVs keep their automatic Tashkent schedule.

Department logins `murojaatlar` and `hr2026` resolve to internal Supabase Auth
identities and have only `appeals_admin` and `hr_admin` respectively. Passwords
are managed in Supabase Auth and must never be stored in the repository.

TVs retain a published-content snapshot for temporary backend outages after a
successful load. This is not a full offline web app: a cold browser launch still
needs the frontend assets, and uncached private images require connectivity.

## Validate

```powershell
npm run lint
npm run build
node --test scripts/tashkent-time.test.mjs
npm run preview
```

`supabase/tests/permissions.sql` tests the existing roles' read, draft-write and
publish permissions. Run as postgres in the project's SQL editor. All test writes
are inside a transaction ending in `ROLLBACK`; a failure must not be committed.
It requires at least one existing account for each role being tested.
`supabase/tests/public-tv.sql` verifies anonymous access is limited to published
content and its images. `node scripts/verify-public-tv.mjs` checks real anonymous
API reads, published image downloads and the Realtime subscription.
`supabase/tests/department-content.sql` verifies JSON validation for the new
content tables using fixtures. Department access is also enforced by publish RPC
guards and media policies.
`supabase/tests/slide-visibility.sql` verifies visibility permissions and that
switching slides preserves unrelated draft and published fields (rolled back).

All administrators use `/admin`; their role determines the department panel.
Existing accounts are not reassigned automatically when adding HR. Grant
`hr_admin` only to the intended HR account in Supabase.

## Deploy

The existing Vercel project is `youth-agency-tv` in
`mrdiyor7736-9364s-projects`. Framework: Vite; build: `npm run build`; output: `dist`.
`vercel.json` handles the `/admin` SPA route and basic security headers.

Set these variables for Production and Preview in Vercel before building:

- `VITE_DATA_BACKEND=supabase`
- `VITE_SUPABASE_URL`: the project API URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: its browser-safe publishable key

```powershell
npx vercel@61.1.0 link --project youth-agency-tv --scope mrdiyor7736-9364s-projects
npx vercel@61.1.0 deploy --prod
```

Environment files, deployment credentials, local archives and build outputs are
excluded from Git. Local secrets and archives are also excluded from Vercel uploads.

See [supabase/README.md](supabase/README.md) for backend status and migration notes.

## Private director dashboard

### Dashboard administration

`/dashboard-admin` (also `/dashboard/admin`) is the dedicated editor. Its `dashboard` username resolves to a separate dashboard-editor Auth identity, with its own session storage. The same username on `/dashboard` resolves to the read-only director identity. Super Admin can also sign in with email. HR, appeals and the director's read-only account cannot edit reports. The dashboard editor has no TV roles. Passwords are provisioned only in Supabase Auth, never in source. Apply `20261008045632_dashboard_editor_access.sql` and provision the editor privately in `dashboard_editors`. The existing TV admin entry also opens this editor.

**Ma’lumotlar** manages section titles, categories, metrics, values, units, periods and source notes. Sections and metrics can be added, removed with undo, and reordered. **Slaydlar va vaqt** controls visibility, default/per-section durations (5–300 seconds), overview title and four headline metrics. Each section supports automatic charts, comparison bars or number cards, with 2–6 metrics per slide. Bars require compatible units and periods; otherwise cards preserve the separate measures.

**Ko‘rib chiqish** previews the current unsaved draft in the actual slideshow. **Qoralamani saqlash** saves privately; **Saqlash va e’lon qilish** saves then publishes with optimistic version checks. Published data updates on the director page within one minute. **Hisobot sozlamalari** manages report date/title/source and restores the published copy into the draft. No source data is embedded in the frontend. Existing database RLS/RPC guards remain the authority; no database migration is needed for the optional presentation fields.

`/dashboard` has a separate Supabase Auth session and a single designated owner account. The username is `dashboard`; its password is provisioned in Auth and is never stored in source code. The owner can read published reports only. Anonymous visitors and department accounts cannot retrieve dashboard data. Super Admin manages the data through `/admin` → **Rahbar paneli ma’lumotlari**, but does not receive access to the director dashboard itself.

The initial report contains 222 indicators in 26 sections from the supplied 1 June 2026 report. Eight views offer chart drilldowns, sorting, indicator search, scoped CSV downloads, source notes, and a report-date selector. Missing values remain missing; overlapping categories are not added together. Source discrepancies are retained and explained.

The director dashboard opens in slideshow mode, using the TV site's light/dark palette. The initial report produces 48 slides, including an overview, youth balance, period comparisons and paginated section charts. All indicators remain available. Figures open source details and pause playback; **Slaydlar** searches and jumps to a slide. Previous/next, pause, 10–60 second intervals and fullscreen are available. Manual navigation pauses playback, and background tabs pause automatically. **Batafsil tahlil** opens the existing searchable dashboard, with **Slayd rejimi** returning to the presentation. The displayed date is the report date, not today's date. Run `node --test scripts/dashboard-model.test.mjs scripts/dashboard-presentation.test.mjs` for source-preservation and comparison checks.

Editors use **Saqlash** for drafts, then **E’lon qilish** to publish. The director page refreshes every minute. **Yangi hisobot** creates an empty report using the existing metric structure; fill its date, periods, values and source notes before publishing. Concurrent edits are version-checked. Future integrations can populate this same schema; no external integrations are enabled yet.

Apply `20261005124035_private_director_dashboard.sql` before deploying the frontend. Provision the Auth owner and seed report privately through database administration; source documents and report values are intentionally excluded from Git and the public bundle. `dashboard_owner` deliberately has no client RLS policies. Its guarded SECURITY DEFINER RPCs are the only reader path. Run `supabase/tests/dashboard.sql` as the database owner on a provisioned project for rollback-only access/publication tests, and `node --test scripts/dashboard-model.test.mjs` for calculation tests.

## Staff and HR scheduling

HR and Super Admin maintain profiles under **Xodimlar**: name, position, department, portrait and birthday. **Tug‘ilgan kunlar** separately manages greetings and whether annual birthday slides are enabled. Saving complete birthday settings activates the annual greeting in Asia/Tashkent; February 29 appears only in leap years.

In **Oy xodimi**, choose **+ Oyga xodim qo‘shish**, select a month and staff member, and enter the recognition reason. **Saqlash va e’lon qilish** saves and publishes together. Future months can be prepared in advance; only the current month is shown. New entries reuse the selected month, so several staff can be added to it. Profiles and portraits come from the staff directory, including later saved changes, without republishing each monthly award. Legacy records without a unique staff match require selection from the directory.

Only eligible published birthdays and monthly awards are returned to TVs. Future plans and the full staff directory remain private. Global slide toggles still apply.

## Synchronized TV playback

All TVs obtain the same published playlist and server time through `tv_playback_state()` every ten seconds. Playback uses absolute server time anchored to the browser's monotonic clock, so opening or reloading a TV does not restart the slideshow. Transitions are included in each slide's duration. Existing open TVs need one reload when upgrading to this player.

Super Admin can set individual slide durations (5–300 seconds) under **Slayd sozlamalari**, then **Vaqtlarni e’lon qilish**. Blank values use the default duration; the birthday duration applies to each eligible birthday. Previous/next and pause affect only that screen; **Sinxron efirga qaytish** immediately rejoins the shared timeline. An already-running screen retains its last playlist and clock during a network interruption and resynchronizes on reconnection.

Apply `20261006102938_staff_profiles_and_synced_playback.sql` before deploying this frontend. `supabase/tests/synced-playback.sql` checks live profile projection, private/future data exclusion, duration validation and anonymous permissions using rolled-back fixtures. `node --test scripts/playback-timeline.test.mjs` verifies timing boundaries and independently started screens.

## Group celebrations

Monthly awards support multiple distinct staff per month. Each entry keeps its own recognition reason. TVs show **Oy xodimlari**, followed by each employee poster. Birthdays follow the same sequence for today’s staff. Overview pages contain up to six people to keep names readable, with no fixed total staff limit. Separate group durations are available in Slayd sozlamalari; existing employee/birthday switches control the entire sequence. Apply `20261006162731_multiple_hr_awards.sql`; verify with the rollback-only `supabase/tests/multiple-hr-awards.sql`.

## Unattended updates and portraits

Production builds emit version.json; TV pages check it every 30 seconds and reload on a new release. One initial manual reload installs this capability on older players. Admin pages do not auto-reload and discard drafts.

The /api/tv-image endpoint downloads using the anonymous publishable key, so Storage RLS still permits only published media. It serves baseline JPEGs bounded to 1200×1400, including older large uploads. Uploads are also resized and compressed in the admin browser. TV portraits are preloaded with two workers, retried after failures, and held in a bounded memory cache that never revokes actively displayed URLs. Responses are not persisted in the HTTP cache.

The visibility RPC now explicitly filters its draft/published rows, satisfying the API's safeupdate protection. Existing role checks remain in place.
