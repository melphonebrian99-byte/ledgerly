"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { CategorySpend } from "@/lib/data/finance";
import { formatCurrency } from "@/lib/money";

/**
 * Spending by category. The chart is decoration on top of the list: every value
 * is also written out with its name and share, so nothing here depends on
 * telling two colours apart.
 */
export function CategoryChart({
  data,
  totalCents,
}: {
  data: CategorySpend[];
  totalCents: number;
}) {
  const chartData = data.map((item) => ({
    name: item.name,
    value: item.amountCents,
    color: item.color,
  }));

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,240px)_1fr] md:items-center">
      <div
        className="relative h-[220px]"
        role="img"
        aria-label="Donut chart of spending by category. The same totals are listed after the chart."
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={64}
              outerRadius={92}
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
                color: "var(--popover-foreground)",
                fontSize: "0.75rem",
              }}
              itemStyle={{ color: "var(--popover-foreground)" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Total spent</span>
          <span className="text-base font-semibold tabular-nums">
            {formatCurrency(totalCents)}
          </span>
        </div>
      </div>

      <ul className="space-y-2">
        {data.map((item) => {
          const share = Math.round((item.amountCents / totalCents) * 100);
          return (
            <li key={item.categoryId} className="flex items-center gap-3 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              <span className="tabular-nums text-muted-foreground">
                {share === 0 ? "<1%" : `${share}%`}
              </span>
              <span className="w-24 text-right font-medium tabular-nums">
                {formatCurrency(item.amountCents)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
