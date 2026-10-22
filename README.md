# Ledgerly

A dark-mode-first personal finance tracker: dashboard totals, spending by
category, transaction CRUD, and monthly budget goals.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · shadcn/ui
(Radix) · Lucide · Supabase (Auth + Postgres) · Recharts

## Status

| Step | Scope | State |
| --- | --- | --- |
| 1 | Scaffold, theme tokens, base shell | ✅ done |
| 2 | Supabase schema + RLS | ⏳ next |
| 3 | shadcn primitives + Supabase clients | ⏳ |
| 4 | Auth screens + route guard | ⏳ |
| 5 | Dashboard, transactions, budgets | ⏳ |

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
