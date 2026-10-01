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
- `Saqlash` saves a draft; `E’lon qilish` publishes it to the TVs.
- Arrow keys change slides.
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
| `press_admin` | President and employee editors |
| `appeals_admin` | Appeals editor |
| Visitor (no login) | Published slideshow and its photos |

Accounts and roles are managed by an administrator in Supabase. Database row-level
security enforces permissions independently of the frontend. Uploaded JPG, PNG
and WebP images use the private `tv-media` bucket (maximum 5 MB).

TVs retain a published-content snapshot for temporary backend outages after a
successful load. This is not a full offline web app: a cold browser launch still
needs the frontend assets, and uncached private images require connectivity.

## Validate

```powershell
npm run lint
npm run build
npm run preview
```

`supabase/tests/permissions.sql` tests the existing roles' read, draft-write and
publish permissions. Run as postgres in the project's SQL editor. All test writes
are inside a transaction ending in `ROLLBACK`; a failure must not be committed.
It requires at least one existing account for each role being tested.
`supabase/tests/public-tv.sql` verifies anonymous access is limited to published
content and its images. `node scripts/verify-public-tv.mjs` checks real anonymous
API reads, published image downloads and the Realtime subscription.

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
