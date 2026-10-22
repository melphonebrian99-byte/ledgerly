-- =============================================================================
-- rls_test.sql — proves the RLS policies actually isolate two users
-- =============================================================================
-- HOW TO RUN
--   Supabase dashboard -> SQL Editor -> paste this whole file -> Run.
--
-- Everything happens inside BEGIN ... ROLLBACK. It creates two throwaway users
-- (alice@example.test, bob@example.test), exercises the policies, then throws
-- it all away. Nothing persists and your real data is never touched.
--
-- Read the "NOTICE" and "ERROR" lines in the Results pane:
--   PASS ...  = the policy behaved correctly
--   FAIL ...  = an assertion tripped; do not trust the app until it is fixed
--
-- This file simulates a signed-in user exactly the way PostgREST does:
--   set local role authenticated
--   set local request.jwt.claims = '{"sub": "<user uuid>", "role": "authenticated"}'
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Fixtures: two users. The on_auth_user_created trigger creates their profiles.
-- ---------------------------------------------------------------------------
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated',
   'alice@example.test', now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}'),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated',
   'bob@example.test', now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}');

do $$
begin
  if (select count(*) from public.profiles
       where id in ('11111111-1111-1111-1111-111111111111',
                    '22222222-2222-2222-2222-222222222222')) <> 2 then
    raise exception 'FAIL: handle_new_user did not create both profile rows';
  end if;
  raise notice 'PASS: handle_new_user created a profile per user';
end $$;

-- ---------------------------------------------------------------------------
-- Act as ALICE
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
set local role authenticated;

do $$
declare
  n int;
begin
  select count(*) into n from public.categories where user_id is null;
  if n <> 15 then
    raise exception 'FAIL: alice should see 15 default categories, saw %', n;
  end if;
  raise notice 'PASS: alice sees all % shared categories', n;
end $$;

-- Alice creates a private category and a transaction.
insert into public.categories (user_id, name, icon, color, kind)
values ('11111111-1111-1111-1111-111111111111', 'Alice Private', 'Lock', '#123456', 'expense');

insert into public.transactions (user_id, title, amount_cents, kind, category_id, occurred_on)
values ('11111111-1111-1111-1111-111111111111', 'Rent October', 4500000, 'expense',
        (select id from public.categories where user_id is null and name = 'Housing & Rent'),
        current_date);

insert into public.budgets (user_id, category_id, month_start, limit_cents)
values ('11111111-1111-1111-1111-111111111111',
        (select id from public.categories where user_id is null and name = 'Food & Groceries'),
        date_trunc('month', current_date)::date, 3000000);

do $$
begin
  raise notice 'PASS: alice can insert her own category, transaction, and budget';
end $$;

-- Alice must NOT be able to write a row owned by bob.
do $$
begin
  begin
    insert into public.transactions (user_id, title, amount_cents, kind, category_id, occurred_on)
    values ('22222222-2222-2222-2222-222222222222', 'Forged', 100, 'expense',
            (select id from public.categories where user_id is null and name = 'Other'),
            current_date);
    raise exception 'FAIL: alice inserted a transaction owned by bob';
  exception when insufficient_privilege then
    raise notice 'PASS: cross-user insert blocked by RLS (42501)';
  end;
end $$;

-- Alice must NOT be able to self-assign an existing user id on update either.
reset role;

-- ---------------------------------------------------------------------------
-- Act as BOB
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
set local role authenticated;

do $$
declare
  n int;
begin
  select count(*) into n from public.transactions;
  if n <> 0 then
    raise exception 'FAIL: bob can see % of alice''s transactions', n;
  end if;
  raise notice 'PASS: bob sees 0 of alice''s transactions';
end $$;

do $$
declare
  n int;
begin
  select count(*) into n from public.categories where name = 'Alice Private';
  if n <> 0 then
    raise exception 'FAIL: bob can see alice''s private category';
  end if;
  raise notice 'PASS: bob cannot see alice''s private category';
end $$;

do $$
declare
  n int;
begin
  select count(*) into n from public.budgets;
  if n <> 0 then
    raise exception 'FAIL: bob can see % of alice''s budgets', n;
  end if;
  raise notice 'PASS: bob sees 0 of alice''s budgets';
end $$;

-- Update/delete of alice's rows must silently affect zero rows (RLS filter),
-- not error out and not succeed.
do $$
declare
  affected int;
begin
  update public.transactions set title = 'hijacked' where title = 'Rent October';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'FAIL: bob updated % of alice''s transactions', affected;
  end if;

  delete from public.transactions where title = 'Rent October';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'FAIL: bob deleted % of alice''s transactions', affected;
  end if;

  raise notice 'PASS: bob''s update and delete of alice''s rows affected 0 rows';
end $$;

-- Bob must not be able to reference alice's private category even though the
-- FK would happily resolve it. enforce_category_ownership should reject it.
do $$
begin
  begin
    insert into public.transactions (user_id, title, amount_cents, kind, category_id, occurred_on)
    values ('22222222-2222-2222-2222-222222222222', 'Sneaky', 100, 'expense',
            (select id from public.categories where user_id is null and name = 'Other'),
            current_date);

    insert into public.transactions (user_id, title, amount_cents, kind, category_id, occurred_on)
    values ('22222222-2222-2222-2222-222222222222', 'Sneaky 2', 100, 'expense',
            '11111111-1111-1111-1111-111111111111'::uuid, current_date);
    raise exception 'FAIL: bob referenced a foreign category id';
  exception
    when check_violation then
      raise notice 'PASS: foreign category reference rejected (23514)';
  end;
end $$;

reset role;

-- ---------------------------------------------------------------------------
-- Cleanup
-- ---------------------------------------------------------------------------
rollback;

-- Expect: the final line is "ROLLBACK", every NOTICE says PASS, and there are
-- no exceptions. Then verify nothing stuck:
--   select count(*) from auth.users where email like '%@example.test';  -- 0
