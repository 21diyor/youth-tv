# Supabase migration — YIA TV platform

Status: **migration 000001 applied; 000002 not applied.**
The app still runs on `VITE_DATA_BACKEND=local`.

## Supabase project

| | |
|---|---|
| Project | `yia-tv-platform` (dedicated — shares nothing with any other project) |
| Project ref | `ymztqfzujdwfkqrsqzyu` |
| Organization | YRO |
| Region | `eu-central-1` (Frankfurt) |
| API URL | `https://ymztqfzujdwfkqrsqzyu.supabase.co` |
| Frontend key | publishable key only, in git-ignored `.env.local` (see `.env.example`) |

## Migration files

| File | Contents | Status |
|---|---|---|
| `migrations/20260919000001_tv_content_draft_publish.sql` | enums, `user_roles`, role helpers, 4 draft/published content tables, audit log, seed fallback, triggers, publish RPCs, RLS, grants, realtime publication | **Applied 2026-09-19** (remote version `20260919105811`, name `tv_content_draft_publish`; content checksum identical to this file). The file's header still reads "PROPOSED — NOT APPLIED" because applied SQL is kept byte-for-byte unchanged. |
| `migrations/20260919000002_tv_media_storage.sql` | private `tv-media` bucket + storage policies | **Not applied** — planned for step 9 |

## Auth

- Public sign-ups: disabled. Email confirmation: disabled. Site URL: `http://localhost:5173`.
- Accounts are created by an administrator in the Supabase Dashboard
  (Authentication → Users → Add user), passwords entered there — never in chat or code.
- First Super Admin created and assigned `super_admin` on 2026-09-19 (step 4A).
- Press Admin, Appeals Admin and TV accounts (`tv-1`, `tv-2`, `tv-3`): not created yet.

## Sequence

| # | Step | Status |
|---|---|---|
| 0 | Git baseline, `@supabase/supabase-js`, `.env.example` | done |
| 1 | localStorage behind adapter, `subscribe()`, async saves, save errors | done |
| 2 | Draft/publish in the frontend on the **local** adapter: draft keys, `Saqlash` = save draft, outline `E’lon qilish` button, "E’lon qilinmagan o‘zgarishlar bor" status. Existing published localStorage keys unchanged, so the TV keeps showing live content | done |
| 3 | Create dedicated project `yia-tv-platform`; apply `…000001`; run security/performance advisors | done (2026-09-19) |
| 4A | First Super Admin account + `super_admin` role; disable public sign-ups; `src/lib/supabase.ts` client (not yet used) | done (2026-09-19) |
| 4B | Create Press Admin, Appeals Admin, `tv-1`, `tv-2`, `tv-3`; assign roles | |
| 5 | Implement Supabase adapter (published reads, draft saves, publish RPCs, published-only realtime) — tested in development only; production stays `local` | |
| 6 | Auth gate + role-filtered admin in the frontend | |
| 7 | **One-time localStorage → Supabase initial import (mandatory gate — see below)** | |
| 8 | Activate `VITE_DATA_BACKEND=supabase`; sign in each TV with its own account. localStorage data is left untouched as a rollback path | |
| 9 | Apply `…000002`; portrait / employee photo upload | |
| 10 | Hardening: offline read cache, reconnect refetch, kiosk setup, cleanup | |

## Step 7 — initial import (required before step 8)

The SQL seed contains `tvData.ts` defaults and is only a fallback for a brand-new
installation. The live TV content lives in the browser's localStorage and must
not be lost.

1. Run on the browser profile whose localStorage holds the content currently
   shown on the TVs, signed in as **Super Admin** (the only role allowed to
   write all four content types, including slide settings).
2. Read the current **published** localStorage values:
   `youth-tv-president-content`, `youth-tv-appeals-content`,
   `youth-tv-employee-content`, `youth-tv-slide-settings`.
   Unpublished local drafts are not imported — publish or discard them first;
   the import warns if any local draft differs from its published value.
3. Show a preview and validate each value against the database constraints
   (appeals sum = total, array lengths, interval 5–300, ≥ 1 slide enabled,
   year range). Any failure stops the import for that content type — nothing
   is silently dropped or altered.
4. For each content type, write the value to **both** rows through the normal
   secured path: save the draft row, then call `publish_*()`, which copies the
   draft into the published row atomically. Result: draft = published = live
   TV content, recorded in `audit_log`.
5. If a key is absent in localStorage, the TV is currently showing the
   `tvData.ts` defaults, which equal the seed — no import needed for that type.
6. Verify: read back both Supabase rows and compare field-by-field with the
   localStorage values. Only after all four match may step 8 begin.

The import is run after step 5 testing, so any test data written to Supabase
during development is overwritten by the live content.
