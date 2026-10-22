-- =============================================================================
-- 0001_init.sql — Ledgerly core schema, constraints, triggers, and RLS
-- =============================================================================
-- Apply with: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Idempotency: this file is NOT re-runnable. It is written to run once against
-- a fresh project. If it fails partway, the transaction rolls back as a whole,
-- so you can fix and re-run from the top.
--
-- Requires PostgreSQL 15+ (uses UNIQUE NULLS NOT DISTINCT). Supabase projects
-- are 15+, so this is safe.
--
-- Security model:
--   * Every row is owned by auth.users(id) via user_id.
--   * RLS is ENABLED on all tables. There is no table with an "allow all" policy.
--   * System categories have user_id IS NULL and are read-only to everyone.
--   * Amounts are integer cents (bigint), never floats.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Types
-- -----------------------------------------------------------------------------
create type public.transaction_kind as enum ('income', 'expense');

-- -----------------------------------------------------------------------------
-- 2. Tables
-- -----------------------------------------------------------------------------

-- One row per authenticated user. Created automatically by a trigger on
-- auth.users so the app never has to bootstrap it.
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  currency   text not null default 'KES'
               check (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Per-user settings. Row is created by on_auth_user_created trigger.';

-- Categories are either global defaults (user_id IS NULL, read-only) or
-- user-defined (user_id = the owner). The `kind` split stops an income
-- category being attached to an expense.
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete cascade,
  name       text not null check (length(btrim(name)) between 1 and 40),
  icon       text not null default 'Circle',
  color      text not null default '#94a3b8'
               check (color ~* '^#[0-9a-f]{6}$'),
  kind       public.transaction_kind not null,
  created_at timestamptz not null default now(),

  -- Duplicate names per user are a UI annoyance and break "add budget by
  -- category" pickers. NULLS NOT DISTINCT also protects the seed rows.
  constraint categories_name_unique unique nulls not distinct (user_id, name, kind)
);

comment on table public.categories is
  'Global defaults have user_id IS NULL. User rows are private to their owner.';

create table public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null check (length(btrim(title)) between 1 and 120),
  -- Always positive; direction lives in `kind`. This makes double-negation
  -- bugs impossible and keeps SUM() trivial.
  amount_cents bigint not null check (amount_cents > 0),
  kind        public.transaction_kind not null,
  -- RESTRICT, not CASCADE: deleting a category must never silently delete
  -- financial history.
  category_id uuid not null references public.categories (id) on delete restrict,
  -- A date, not a timestamptz: a transaction belongs to a calendar day, and
  -- month grouping must not shift with the viewer's timezone.
  occurred_on date not null default current_date,
  note        text check (note is null or length(note) <= 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on column public.transactions.amount_cents is
  'Positive integer cents. Sign comes from `kind`, never from this value.';

create table public.budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  -- Always the first day of the month. Storing a period start (rather than
  -- "October") makes month lookups exact and history queryable.
  month_start date not null,
  limit_cents bigint not null check (limit_cents > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint budgets_month_is_first_day
    check (month_start = date_trunc('month', month_start)::date),
  constraint budgets_one_per_category_per_month
    unique (user_id, category_id, month_start)
);

-- -----------------------------------------------------------------------------
-- 3. Indexes
-- -----------------------------------------------------------------------------
-- Dashboard reads newest-first; transaction list pages by date.
create index transactions_user_date_idx
  on public.transactions (user_id, occurred_on desc, created_at desc);

create index transactions_user_category_idx
  on public.transactions (user_id, category_id);

create index categories_user_idx
  on public.categories (user_id);

create index budgets_user_month_idx
  on public.budgets (user_id, month_start);

-- -----------------------------------------------------------------------------
-- 4. Trigger functions
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Creates the profile row for a new auth user. SECURITY DEFINER is required:
-- the insert happens on auth.users, where the calling role has no rights on
-- public.profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Guards against a user attaching another user's category to their own row.
-- The FK alone cannot express this: it only proves the category exists.
create or replace function public.enforce_category_ownership()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.categories c
    where c.id = new.category_id
      and (c.user_id is null or c.user_id = new.user_id)
  ) then
    raise exception 'category % is not available to this user', new.category_id
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_category_ownership() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. Triggers
-- -----------------------------------------------------------------------------
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

create trigger budgets_set_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

create trigger transactions_category_ownership
  before insert or update of category_id, user_id on public.transactions
  for each row execute function public.enforce_category_ownership();

create trigger budgets_category_ownership
  before insert or update of category_id, user_id on public.budgets
  for each row execute function public.enforce_category_ownership();

-- -----------------------------------------------------------------------------
-- 6. Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.categories   enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets      enable row level security;

-- Intentionally NOT using FORCE ROW LEVEL SECURITY: the `postgres` owner role
-- (used by the Supabase dashboard and migrations) must still be able to read.

-- profiles: read and update your own row. No insert policy on purpose — rows
-- are only created by handle_new_user(); no delete policy — deleting the auth
-- user cascades.
create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- categories: everyone can read the shared defaults plus their own; only the
-- owner can write their own.
create policy categories_select_available on public.categories
  for select to authenticated
  using (user_id is null or (select auth.uid()) = user_id);

create policy categories_insert_own on public.categories
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy categories_update_own on public.categories
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy categories_delete_own on public.categories
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- transactions: full CRUD, strictly scoped to the owner.
create policy transactions_select_own on public.transactions
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy transactions_insert_own on public.transactions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy transactions_update_own on public.transactions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy transactions_delete_own on public.transactions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- budgets: full CRUD, strictly scoped to the owner.
create policy budgets_select_own on public.budgets
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy budgets_insert_own on public.budgets
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy budgets_update_own on public.budgets
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy budgets_delete_own on public.budgets
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- 7. Privileges
-- -----------------------------------------------------------------------------
-- Supabase's default privileges hand new tables in `public` to anon and
-- authenticated. Revoke explicitly rather than relying on RLS alone: two
-- independent layers should both encode the same intent.
revoke all on public.profiles     from anon, authenticated;
revoke all on public.categories   from anon;
revoke all on public.transactions from anon;
revoke all on public.budgets      from anon;

grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.budgets      to authenticated;
grant select, insert, update, delete on public.categories  to authenticated;

-- profiles rows are created by handle_new_user() and removed by the auth.users
-- cascade, so the app only ever needs to read and update its own row.
grant select, update                 on public.profiles    to authenticated;

-- TRUNCATE is not subject to row-level security, and Supabase's default
-- privileges hand it to `authenticated` on every new table. PostgREST cannot
-- reach TRUNCATE today, but the grant layer should not offer a lever that RLS
-- cannot see. REFERENCES and TRIGGER are likewise never needed by the app.
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 8. Seed: global default categories (user_id IS NULL)
-- -----------------------------------------------------------------------------
insert into public.categories (user_id, name, icon, color, kind) values
  -- Expenses (Kenyan spending patterns, deliberately broad)
  (null, 'Housing & Rent',        'Home',           '#8b5cf6', 'expense'),
  (null, 'Food & Groceries',      'ShoppingBasket', '#fb923c', 'expense'),
  (null, 'Transport & Fuel',      'Car',            '#22d3ee', 'expense'),
  (null, 'Utilities',             'Zap',            '#facc15', 'expense'),
  (null, 'Airtime & Internet',    'Smartphone',     '#60a5fa', 'expense'),
  (null, 'Health',                'HeartPulse',     '#f472b6', 'expense'),
  (null, 'Education',             'GraduationCap',  '#a78bfa', 'expense'),
  (null, 'Shopping',              'ShoppingBag',    '#f97316', 'expense'),
  (null, 'Entertainment',         'Film',           '#2dd4bf', 'expense'),
  (null, 'Savings & Investments', 'PiggyBank',      '#14b8a6', 'expense'),
  (null, 'Other',                 'Circle',         '#94a3b8', 'expense'),
  -- Income
  (null, 'Salary',                'Briefcase',      '#34d399', 'income'),
  (null, 'Business Income',       'Store',          '#10b981', 'income'),
  (null, 'Freelance',             'Laptop',         '#6ee7b7', 'income'),
  (null, 'Gifts Received',        'Gift',           '#a7f3d0', 'income');

commit;

-- =============================================================================
-- Post-apply checklist (run these, expect the stated results):
--
--   select count(*) from public.categories where user_id is null;  -- 15
--   select relname, relrowsecurity from pg_class
--    where relname in ('profiles','categories','transactions','budgets');
--     -- relrowsecurity = true for all four
--   select count(*) from pg_policies
--    where schemaname = 'public';  -- 14 policies
-- =============================================================================
