import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  PieChart,
  Plus,
  Receipt,
  Target,
  Wallet,
} from "lucide-react";
import { cn } from "cn";

import { CategoryChart } from "@/components/finance/category-chart";
import { CategoryIcon } from "@/components/finance/category-icon";
import { TransactionDialog } from "@/components/finance/transaction-dialog";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { requireUser } from "@/lib/auth";
import {
  getCategories,
  getFinanceSummary,
  getMonthBudgets,
  getMonthTransactions,
  spendByCategory,
  type BudgetRow,
} from "@/lib/data/finance";
import { formatCurrency } from "@/lib/money";
import { currentMonthKey, formatDayLabel, monthLabel, todayISO } from "@/lib/period";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Overview" };

/** Money out reads as a negative number everywhere, never colour alone. */
function asOutflow(cents: number): string {
  return cents === 0 ? formatCurrency(0) : formatCurrency(-cents);
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Wallet;
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <Icon
            className={cn(
              "size-4",
              tone === "positive" && "text-emerald-600 dark:text-emerald-400",
              tone === "negative" && "text-rose-600 dark:text-rose-400",
              tone === "neutral" && "text-muted-foreground",
            )}
            aria-hidden
          />
          {label}
        </CardDescription>
        <CardTitle
          className={cn(
            "text-2xl font-semibold tabular-nums",
            tone === "negative" && "text-rose-600 dark:text-rose-400",
          )}
        >
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{hint}</CardContent>
    </Card>
  );
}

function BudgetMini({ budget }: { budget: BudgetRow }) {
  const ratio = budget.limitCents === 0 ? 0 : budget.spentCents / budget.limitCents;
  const percentUsed = Math.round(ratio * 100);
  const progressValue = Math.min(100, percentUsed);
  const over = budget.spentCents > budget.limitCents;
  const near = !over && ratio >= 0.8;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="truncate font-medium">{budget.categoryName}</span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {formatCurrency(budget.spentCents)} of {formatCurrency(budget.limitCents)}
        </span>
      </div>
      <Progress
        value={progressValue}
        className="h-1.5"
        indicatorClassName={cn(
          over ? "bg-rose-500" : near ? "bg-amber-400" : "bg-emerald-500",
        )}
        aria-label={`${budget.categoryName}: ${percentUsed}% of budget used`}
      />
      <p
        className={cn(
          "text-xs",
          over
            ? "text-rose-600 dark:text-rose-400"
            : near
              ? "text-amber-600 dark:text-amber-400"
              : "text-muted-foreground",
        )}
      >
        {over
          ? `Over budget by ${formatCurrency(budget.spentCents - budget.limitCents)}`
          : near
            ? `Near limit — ${formatCurrency(budget.limitCents - budget.spentCents)} left`
            : `${formatCurrency(budget.limitCents - budget.spentCents)} left`}
      </p>
    </div>
  );
}

function TransactionLine({
  title,
  categoryName,
  categoryIcon,
  categoryColor,
  occurredOn,
  kind,
  amountCents,
}: {
  title: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  occurredOn: string;
  kind: "income" | "expense";
  amountCents: number;
}) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${categoryColor}1f`, color: categoryColor }}
      >
        <CategoryIcon name={categoryIcon} className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {categoryName} · {formatDayLabel(occurredOn)}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 text-sm font-medium tabular-nums",
          kind === "income"
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-rose-600 dark:text-rose-400",
        )}
      >
        {kind === "income" ? formatCurrency(amountCents, { signed: true }) : asOutflow(amountCents)}
      </span>
    </li>
  );
}

export default async function DashboardPage() {
  await requireUser();

  const supabase = await createClient();
  const monthKey = currentMonthKey();

  const [summary, transactions, budgets, categories] = await Promise.all([
    getFinanceSummary(supabase, monthKey),
    getMonthTransactions(supabase, monthKey),
    getMonthBudgets(supabase, monthKey),
    getCategories(supabase),
  ]);

  const spend = spendByCategory(transactions);
  const totalSpend = spend.reduce((total, item) => total + item.amountCents, 0);
  const recent = transactions.slice(0, 5);

  const topBudgets = [...budgets]
    .sort((a, b) => b.spentCents / Math.max(b.limitCents, 1) - a.spentCents / Math.max(a.limitCents, 1))
    .slice(0, 3);

  return (
    <>
      <PageHeader
        title="Overview"
        description={`${monthLabel(monthKey)} · all amounts in Kenyan shillings`}
        action={
          <TransactionDialog categories={categories} today={todayISO()}>
            <Button size="sm">
              <Plus aria-hidden />
              Add transaction
            </Button>
          </TransactionDialog>
        }
      />

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total balance"
          value={formatCurrency(summary.totalBalanceCents)}
          hint="Income minus expenses, all time"
          icon={Wallet}
          tone={summary.totalBalanceCents < 0 ? "negative" : "neutral"}
        />
        <StatCard
          label="Income this month"
          value={formatCurrency(summary.monthIncomeCents, { signed: true })}
          hint={`${summary.monthIncomeCount} ${
            summary.monthIncomeCount === 1 ? "deposit" : "deposits"
          } this month`}
          icon={ArrowUpRight}
          tone="positive"
        />
        <StatCard
          label="Expenses this month"
          value={asOutflow(summary.monthExpenseCents)}
          hint={`${summary.monthExpenseCount} ${
            summary.monthExpenseCount === 1 ? "transaction" : "transactions"
          } this month`}
          icon={ArrowDownRight}
          tone="negative"
        />
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Where the money went</CardTitle>
            <CardDescription>
              {monthLabel(monthKey)} spending, grouped by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {spend.length > 0 ? (
              <CategoryChart data={spend} totalCents={totalSpend} />
            ) : (
              <EmptyState
                icon={PieChart}
                title="No spending yet this month"
                description="Add an expense and it will show up here, split by category."
              >
                <TransactionDialog categories={categories} today={todayISO()}>
                  <Button size="sm" variant="outline">
                    <Plus aria-hidden />
                    Add an expense
                  </Button>
                </TransactionDialog>
              </EmptyState>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget health</CardTitle>
            <CardDescription>Categories closest to their limit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topBudgets.length > 0 ? (
              topBudgets.map((budget) => <BudgetMini key={budget.id} budget={budget} />)
            ) : (
              <EmptyState
                icon={Target}
                title="No budgets set"
                description="Set a monthly limit for the categories you want to keep an eye on."
              />
            )}
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/budgets">
                <Target aria-hidden />
                {topBudgets.length > 0 ? "Manage budgets" : "Set a budget"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Newest entries in {monthLabel(monthKey)}</CardDescription>
          <CardAction>
            <Button asChild variant="ghost" size="sm">
              <Link href="/transactions">View all</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {recent.length > 0 ? (
            <ul className="divide-y divide-border">
              {recent.map((transaction) => (
                <TransactionLine
                  key={transaction.id}
                  title={transaction.title}
                  categoryName={transaction.categoryName}
                  categoryIcon={transaction.categoryIcon}
                  categoryColor={transaction.categoryColor}
                  occurredOn={transaction.occurredOn}
                  kind={transaction.kind}
                  amountCents={transaction.amountCents}
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Receipt}
              title="Nothing recorded this month"
              description="Transactions you add will appear here, newest first."
            >
              <TransactionDialog categories={categories} today={todayISO()}>
                <Button size="sm">
                  <Plus aria-hidden />
                  Add your first transaction
                </Button>
              </TransactionDialog>
            </EmptyState>
          )}
        </CardContent>
      </Card>
    </>
  );
}
