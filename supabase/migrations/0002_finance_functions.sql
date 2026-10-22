-- -----------------------------------------------------------------------------
-- 0002 — server-side aggregates
--
-- Sums cannot be computed in the app: PostgREST returns at most 1000 rows per
-- request, so fetching every transaction to total it would silently under-count
-- once an account passes that mark. This function does the arithmetic in one
-- indexed pass and returns a single row.
--
-- `security invoker` plus the explicit user_id filter means RLS applies twice
-- over: the function can never see rows the caller could not select itself.
-- -----------------------------------------------------------------------------
create or replace function public.finance_summary(p_month_start date)
returns table (
  total_balance_cents bigint,
  month_income_cents  bigint,
  month_expense_cents bigint,
  month_income_count  bigint,
  month_expense_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with scoped as (
    select t.kind, t.amount_cents, t.occurred_on
      from public.transactions t
     where t.user_id = (select auth.uid())
  ),
  month_rows as (
    select s.kind, s.amount_cents
      from scoped s
     where s.occurred_on >= p_month_start
       and s.occurred_on < (p_month_start + interval '1 month')::date
  )
  select
    coalesce(
      (select sum(case when s.kind = 'income' then s.amount_cents else -s.amount_cents end)
         from scoped s),
      0
    )::bigint as total_balance_cents,
    coalesce((select sum(m.amount_cents) from month_rows m where m.kind = 'income'), 0)::bigint,
    coalesce((select sum(m.amount_cents) from month_rows m where m.kind = 'expense'), 0)::bigint,
    (select count(*) from month_rows m where m.kind = 'income')::bigint,
    (select count(*) from month_rows m where m.kind = 'expense')::bigint;
$$;

comment on function public.finance_summary(date) is
  'Dashboard totals for the caller: all-time balance plus one month of income/expense totals and counts.';

revoke all on function public.finance_summary(date) from public, anon;
grant execute on function public.finance_summary(date) to authenticated, service_role;
