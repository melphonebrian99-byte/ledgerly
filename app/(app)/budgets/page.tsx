import { AlertTriangle, CheckCircle2, Plus, Target } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/money";

// ---------------------------------------------------------------------------
// SAMPLE DATA — replaced by real Supabase queries in step 5.
// ---------------------------------------------------------------------------
const ksh = (major: number) => major * 100;

const budgets = [
  { name: "Housing & Rent", spent: ksh(45_000), limit: ksh(60_000), color: "#8b5cf6" },
  { name: "Food & Groceries", spent: ksh(24_600), limit: ksh(30_000), color: "#fb923c" },
  { name: "Entertainment", spent: ksh(10_400), limit: ksh(10_000), color: "#2dd4bf" },
];

export default function BudgetsPage() {
  return (
    <>
      <PageHeader
        title="Budgets"
        description="October 2026 · limits reset on the 1st"
        action={
          <>
            <Badge variant="outline">Sample data</Badge>
            <Button size="sm" disabled title="Available in step 5">
              <Plus className="size-4" aria-hidden />
              Set budget
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => {
          const percent = Math.round((budget.spent / budget.limit) * 100);
          const remaining = budget.limit - budget.spent;
          const over = remaining < 0;
          const near = percent >= 80 && !over;

          return (
            <Card key={budget.name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: budget.color }}
                    aria-hidden
                  />
                  {budget.name}
                </CardTitle>
                <CardDescription className="tabular">
                  {formatCurrency(budget.spent, { hideZeroCents: true })} of{" "}
                  {formatCurrency(budget.limit, { hideZeroCents: true })}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <Progress
                  value={Math.min(percent, 100)}
                  aria-label={`${budget.name}: ${percent}% of budget used`}
                  className="h-1.5"
                  indicatorClassName={over ? "bg-negative" : near ? "bg-warning" : "bg-positive"}
                />

                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className={
                      over
                        ? "border-negative/40 text-negative"
                        : near
                          ? "border-warning/40 text-warning"
                          : "border-positive/40 text-positive"
                    }
                  >
                    {over ? (
                      <AlertTriangle className="size-3" aria-hidden />
                    ) : (
                      <CheckCircle2 className="size-3" aria-hidden />
                    )}
                    {percent}%
                  </Badge>

                  <p className={over ? "tabular text-xs text-negative" : "tabular text-xs text-muted-foreground"}>
                    {over
                      ? `${formatCurrency(Math.abs(remaining), { hideZeroCents: true })} over`
                      : `${formatCurrency(remaining, { hideZeroCents: true })} left`}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Card className="border-dashed bg-transparent">
          <CardContent className="flex h-full flex-col items-center justify-center gap-2 py-6 text-center">
            <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Target className="size-4" aria-hidden />
            </span>
            <p className="text-sm font-medium">Add a category budget</p>
            <p className="max-w-[16rem] text-xs text-muted-foreground">
              Budget editing is wired up with the transaction data layer in step 5.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
