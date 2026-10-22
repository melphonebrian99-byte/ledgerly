# Ledgerly

A dark-mode-first personal finance tracker: dashboard totals, spending by
category, transaction CRUD, and monthly budget goals.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · shadcn/ui
(Radix) · Lucide · Supabase (Auth + Postgres) · Recharts

## Status

| Step | Scope | State |
| --- | --- | --- |
| 1 | Scaffold, theme tokens, base shell | ✅ done |
| 2 | Supabase schema + RLS | ✅ authored — **needs applying to a project** |
| 3 | shadcn primitives + Supabase clients | ✅ done — app shell renders with sample data |
| 4 | Auth screens + route guard | ✅ code done — **needs credentials to verify live** |
| 5 | Dashboard, transactions, budgets | ⏳ next |

Email confirmation is **on**: signup redirects to `/auth/callback?token_hash=…`
and the session is only created after the link is clicked. `code` (PKCE) links
are accepted too, so the flow does not hinge on one email template.

Currency is **KES** (Kenyan shilling), displayed as `Ksh 1,234.50` via
`lib/money.ts`.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase project values
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Where to find it | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Safe in the browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | Safe in the browser; RLS is what protects data |

Never add `SUPABASE_SERVICE_ROLE_KEY` to this app: it bypasses Row Level
Security.

`NEXT_PUBLIC_*` values are **inlined at build time**. After changing them,
restart the dev server (or rebuild) — a stale `.next` cache will keep using the
old project.

### Supabase setup

Four one-time steps in the dashboard. The app runs without them, but auth and
data will not work.

1. **Apply the schema.** Paste `supabase/migrations/0001_init.sql` into the SQL
   Editor and run it. It creates the tables, constraints, triggers, RLS policies,
   and the 15 default categories.
2. **Prove the RLS works.** Run `supabase/tests/rls_test.sql` in the same editor.
   It creates two throwaway users, asserts that neither can read or write the
   other's rows, then rolls everything back. The output should be PASS lines only.
3. **Set the auth URLs.** Authentication → URL Configuration:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
     (add the production equivalent when you deploy)
4. **Point the confirmation email at the callback.** Authentication → Emails →
   *Confirm signup*, replace the body's link with:

   ```html
   <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">
     Confirm your email
   </a>
   ```

   The default `{{ .ConfirmationURL }}` round-trips through GoTrue and only works
   in the same browser that signed up. `token_hash` works from any device, which
   is what people expect from an email link. `/auth/callback` also accepts the
   default template's `code` parameter, so nothing breaks if you skip this step —
   you just lose the cross-device case. The `type` value must match the template
   (`email` for this one; `signup` is also accepted).

### Auth behaviour

- Sign-in and sign-up are Server Actions backed by `lib/validation/auth.ts`,
  which the browser also runs for instant field feedback.
- `proxy.ts` refreshes the session cookie and redirects signed-out visitors away
  from `/dashboard`, `/transactions`, and `/budgets`, appending `?next=` so they
  land where they were headed after signing in.
- `app/(app)/layout.tsx` calls `requireUser()` as the authoritative check. The
  layout is also `force-dynamic`, because a build without credentials would
  otherwise freeze a "redirect to /login" page into the static output.
- Sign-out posts a Server Action form, so it works before hydration.

Not implemented in v1: password reset, email change, OAuth providers, and
account deletion.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build + type check |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## Conventions

- **Money is integer cents** (`amount_cents bigint`). Formatting happens once,
  at the edge, via helpers in `lib/`. No floats on monetary values.
- **Reads are Server Components, writes are Server Actions.** Validation
  schemas in `lib/validation/` are shared by the browser form and the server
  action, so client checks can never be the only check.
- **RLS is the security boundary.** UI filtering is convenience only.
- **Color is never the only signal.** Income/expense always pair a semantic
  color with an icon and a `+`/`-` sign.
- **Dark first.** Tokens live in `app/globals.css`; `class="dark"` on `<html>`
  is the entire theme switch.
- **Session refresh lives in `proxy.ts`.** Next 16 renamed `middleware.ts` to
  `proxy.ts`; the proxy revalidates the Supabase cookie on every matched request.
  With no credentials configured it no-ops, so the app still boots.
- **Missing config fails at use, not at import.** `lib/env.ts` throws a
  directional error only when a Supabase client is actually constructed, which
  keeps `npm run build` usable before a project exists.
