import type { Metadata } from "next";
import {
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Plus,
  Target,
  TriangleAlert,
} from "lucide-react";
import { cn } from "cn";

import { BudgetDialog } from "@/components/finance/budget-dialog";
import { CategoryIcon } from "@/components/finance/category-icon";
import { DeleteBudgetButton } from "@/components/finance/delete-budget-button";
import { MonthNav } from "@/components/finance/month-nav";
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
import { getCategories, getMonthBudgets, type BudgetRow, type CategoryOption } from "@/lib/data/finance";
import { formatCurrency } from "@/lib/money";
import { monthLabel, normalizeMonthKey } from "@/lib/period";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Budgets" };

function BudgetCard({
  budget,
  categories,
  monthKey,
}: {
  budget: BudgetRow;
  categories: CategoryOption[];
  monthKey: string;
}) {
  const ratio = budget.limitCents === 0 ? 0 : budget.spentCents / budget.limitCents;
  const percentUsed = Math.round(ratio * 100);
  const progressValue = Math.min(100, percentUsed);
  const over = budget.spentCents > budget.limitCents;
  const near = !over && ratio >= 0.8;
  const StatusIcon = over ? AlertTriangle : near ? TriangleAlert : CheckCircle2;

  const status = over
    ? `Over budget by ${formatCurrency(budget.spentCents - budget.limitCents)}`
    : `${formatCurrency(budget.limitCents - budget.spentCents)} left this month`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${budget.categoryColor}1f`, color: budget.categoryColor }}
          >
            <CategoryIcon name={budget.categoryIcon} className="size-4" />
          </span>
          <span className="truncate">{budget.categoryName}</span>
        </CardTitle>
        <CardDescription>{percentUsed}% of limit used</CardDescription>
        <CardAction className="flex gap-1">
          <BudgetDialog
            categories={categories}
            month={monthKey}
            budget={budget}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit the ${budget.categoryName} budget`}
            >
              <Pencil aria-hidden />
            </Button>
          </BudgetDialog>
          <DeleteBudgetButton id={budget.id} categoryName={budget.categoryName} />
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xl font-semibold tabular-nums">
            {formatCurrency(budget.spentCents)}
          </span>
          <span className="text-xs text-muted-foreground">
            of {formatCurrency(budget.limitCents)}
          </span>
        </div>

        <Progress
          value={progressValue}
          className="h-2"
          indicatorClassName={cn(
            over ? "bg-rose-500" : near ? "bg-amber-400" : "bg-emerald-500",
          )}
          aria-label={`${budget.categoryName}: ${percentUsed}% of budget used`}
        />

        <p
          className={cn(
            "flex items-center gap-1.5 text-xs",
            over
              ? "text-rose-600 dark:text-rose-400"
              : near
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground",
          )}
        >
          <StatusIcon className="size-3.5" aria-hidden />
          {status}
        </p>
      </CardContent>
    </Card>
  );
}

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  await requireUser();

  const params = await searchParams;
  const requested = Array.isArray(params.month) ? params.month[0] : params.month;
  const monthKey = normalizeMonthKey(requested);

  const supabase = await createClient();
  const [budgets, categories] = await Promise.all([
    getMonthBudgets(supabase, monthKey),
    getCategories(supabase),
  ]);

  const totalLimit = budgets.reduce((total, budget) => total + budget.limitCents, 0);
  const totalSpent = budgets.reduce((total, budget) => total + budget.spentCents, 0);

  return (
    <>
      <PageHeader
        title="Budgets"
        description={`${monthLabel(monthKey)} · limits are per category and reset each month`}
        action={
          <BudgetDialog categories={categories} month={monthKey}>
            <Button size="sm">
              <Plus aria-hidden />
              Set budget
            </Button>
          </BudgetDialog>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <MonthNav month={monthKey} basePath="/budgets" />
        {budgets.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground tabular-nums">
              {formatCurrency(totalSpent)}
            </span>{" "}
            spent of{" "}
            <span className="font-medium text-foreground tabular-nums">
              {formatCurrency(totalLimit)}
            </span>{" "}
            budgeted
          </p>
        ) : null}
      </div>

      {budgets.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Target}
              title={`No budgets for ${monthLabel(monthKey)}`}
              description="Set a monthly limit for an expense category and this page will track spending against it."
            >
              <BudgetDialog categories={categories} month={monthKey}>
                <Button size="sm">
                  <Plus aria-hidden />
                  Set your first budget
                </Button>
              </BudgetDialog>
            </EmptyState>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              categories={categories}
              monthKey={monthKey}
            />
          ))}
        </div>
      )}
    </>
  );
}
