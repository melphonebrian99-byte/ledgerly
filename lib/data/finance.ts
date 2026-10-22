import type { SupabaseClient } from "@supabase/supabase-js";

import { monthRange, monthStart } from "@/lib/period";
import type { Category, Database, TransactionKind } from "@/types/database";

/**
 * Read-side queries for the finance screens.
 *
 * Every query runs as the signed-in user through RLS; there is no service key
 * here and no `user_id = ...` filter that could be forgotten, because the
 * database refuses to return another user's rows regardless.
 *
 * Aggregates go through the `finance_summary` RPC. Summing in JavaScript would
 * require fetching every transaction, and PostgREST silently truncates selects
 * at 1000 rows — a total that is quietly wrong is worse than a slow one.
 */

type Db = SupabaseClient<Database>;

export type CategoryOption = Pick<Category, "id" | "name" | "kind" | "icon" | "color">;

export type TransactionRow = {
  id: string;
  title: string;
  amountCents: number;
  kind: TransactionKind;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  occurredOn: string;
  note: string | null;
};

export type BudgetRow = {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  monthStart: string;
  limitCents: number;
  spentCents: number;
};

export type FinanceSummary = {
  totalBalanceCents: number;
  monthIncomeCents: number;
  monthExpenseCents: number;
  monthIncomeCount: number;
  monthExpenseCount: number;
};

export type CategorySpend = {
  categoryId: string;
  name: string;
  color: string;
  amountCents: number;
};

function fail(what: string, message: string): never {
  throw new Error(`Could not load ${what}: ${message}`);
}

export async function getCategories(db: Db): Promise<CategoryOption[]> {
  const { data, error } = await db
    .from("categories")
    .select("id, name, kind, icon, color")
    .order("kind")
    .order("name");

  if (error) fail("categories", error.message);
  return data ?? [];
}

export async function getFinanceSummary(db: Db, monthKey: string): Promise<FinanceSummary> {
  const { data, error } = await db.rpc("finance_summary", {
    p_month_start: monthStart(monthKey),
  });

  if (error) fail("your balance", error.message);

  const row = data?.[0];
  return {
    totalBalanceCents: Number(row?.total_balance_cents ?? 0),
    monthIncomeCents: Number(row?.month_income_cents ?? 0),
    monthExpenseCents: Number(row?.month_expense_cents ?? 0),
    monthIncomeCount: Number(row?.month_income_count ?? 0),
    monthExpenseCount: Number(row?.month_expense_count ?? 0),
  };
}

export async function getMonthTransactions(db: Db, monthKey: string): Promise<TransactionRow[]> {
  const { start, end } = monthRange(monthKey);

  const [transactions, categories] = await Promise.all([
    db
      .from("transactions")
      .select("id, title, amount_cents, kind, category_id, occurred_on, note")
      .gte("occurred_on", start)
      .lt("occurred_on", end)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false }),
    getCategories(db),
  ]);

  if (transactions.error) fail("transactions", transactions.error.message);

  const byId = new Map(categories.map((category) => [category.id, category]));

  return (transactions.data ?? []).map((row) => {
    const category = byId.get(row.category_id);
    return {
      id: row.id,
      title: row.title,
      amountCents: Number(row.amount_cents),
      kind: row.kind,
      categoryId: row.category_id,
      categoryName: category?.name ?? "Uncategorised",
      categoryColor: category?.color ?? "#94a3b8",
      categoryIcon: category?.icon ?? "Circle",
      occurredOn: row.occurred_on,
      note: row.note,
    };
  });
}

export async function getMonthBudgets(db: Db, monthKey: string): Promise<BudgetRow[]> {
  const { start } = monthRange(monthKey);

  const [budgets, categories, transactions] = await Promise.all([
    db
      .from("budgets")
      .select("id, category_id, limit_cents, month_start")
      .eq("month_start", start)
      .order("created_at", { ascending: true }),
    getCategories(db),
    getMonthTransactions(db, monthKey),
  ]);

  if (budgets.error) fail("budgets", budgets.error.message);

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const spentByCategory = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.kind !== "expense") continue;
    spentByCategory.set(
      transaction.categoryId,
      (spentByCategory.get(transaction.categoryId) ?? 0) + transaction.amountCents,
    );
  }

  return (budgets.data ?? []).map((row) => {
    const category = categoryById.get(row.category_id);
    return {
      id: row.id,
      categoryId: row.category_id,
      categoryName: category?.name ?? "Uncategorised",
      categoryColor: category?.color ?? "#94a3b8",
      categoryIcon: category?.icon ?? "Circle",
      monthStart: row.month_start,
      limitCents: Number(row.limit_cents),
      spentCents: spentByCategory.get(row.category_id) ?? 0,
    };
  });
}

/** Expenses for a month grouped by category, largest first. */
export function spendByCategory(transactions: TransactionRow[]): CategorySpend[] {
  const totals = new Map<string, CategorySpend>();

  for (const transaction of transactions) {
    if (transaction.kind !== "expense") continue;
    const existing = totals.get(transaction.categoryId);
    if (existing) {
      existing.amountCents += transaction.amountCents;
    } else {
      totals.set(transaction.categoryId, {
        categoryId: transaction.categoryId,
        name: transaction.categoryName,
        color: transaction.categoryColor,
        amountCents: transaction.amountCents,
      });
    }
  }

  return [...totals.values()].sort((a, b) => b.amountCents - a.amountCents);
}
