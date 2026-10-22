import { ArrowDownRight, ArrowUpRight, Sparkles, Target, Wallet } from "lucide-react";

import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/money";

// ---------------------------------------------------------------------------
// SAMPLE DATA — replaced by real Supabase queries in step 5.
// Amounts are integer cents, as they are in the database.
// ---------------------------------------------------------------------------
const ksh = (major: number) => major * 100;

const stats = [
  {
    label: "Total balance",
    cents: ksh(124_805),
    icon: Wallet,
    tone: "neutral" as const,
    delta: "+2.4% vs September",
    up: true,
  },
  {
    label: "Income this month",
    cents: ksh(42_500),
    icon: ArrowUpRight,
    tone: "positive" as const,
    delta: "6 deposits",
    up: true,
  },
  {
    label: "Expenses this month",
    cents: ksh(29_153.5),
    icon: ArrowDownRight,
    tone: "negative" as const,
    delta: "24 transactions",
    up: false,
  },
];

const sampleBudgets = [
  { name: "Housing & Rent", spent: ksh(45_000), limit: ksh(60_000) },
  { name: "Food & Groceries", spent: ksh(24_600), limit: ksh(30_000) },
  { name: "Entertainment", spent: ksh(10_400), limit: ksh(10_000) },
];

function pct(spent: number, limit: number) {
  return Math.round((spent / limit) * 100);
}

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="October 2026 · all amounts in Kenyan shillings"
        action={<Badge variant="outline">Sample data</Badge>}
      />

      <section aria-label="Summary" className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription className="flex items-center justify-between gap-2">
                {stat.label}
                <stat.icon className="size-4 text-muted-foreground" aria-hidden />
              </CardDescription>
              <CardTitle
                className={
                  stat.tone === "positive"
                    ? "tabular text-2xl text-positive"
                    : stat.tone === "negative"
                      ? "tabular text-2xl text-negative"
                      : "tabular text-2xl"
                }
              >
                {formatCurrency(stat.cents)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                {stat.up ? (
                  <ArrowUpRight className="size-3.5 text-positive" aria-hidden />
                ) : (
                  <ArrowDownRight className="size-3.5 text-negative" aria-hidden />
                )}
                {stat.delta}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section aria-label="Budget health" className="mt-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-4 text-muted-foreground" aria-hidden />
              Budget health
            </CardTitle>
            <CardDescription>
              Thresholds are paired with labels and icons, so the state never depends on colour
              alone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sampleBudgets.map((budget) => {
              const percent = pct(budget.spent, budget.limit);
              const over = percent > 100;
              const near = percent >= 80 && !over;
              return (
                <div key={budget.name}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="text-sm">{budget.name}</span>
                    <span className="tabular text-xs text-muted-foreground">
                      {formatCurrency(budget.spent, { hideZeroCents: true })} of{" "}
                      {formatCurrency(budget.limit, { hideZeroCents: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress
                      value={Math.min(percent, 100)}
                      aria-label={`${budget.name}: ${percent}% of budget used`}
                      className="h-1.5"
                      indicatorClassName={over ? "bg-negative" : near ? "bg-warning" : "bg-positive"}
                    />
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
                      {percent}%
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="mt-3">
        <EmptyState
          icon={Sparkles}
          title="Charts arrive in step 5"
          description="The spending-by-category donut and six-month cash-flow bars are built with Recharts once the transaction data layer exists."
        />
      </section>
    </>
  );
}
