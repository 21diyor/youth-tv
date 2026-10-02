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
