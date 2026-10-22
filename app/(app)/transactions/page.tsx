import type { Metadata } from "next";
import { Pencil, Plus, Receipt } from "lucide-react";
import { cn } from "cn";

import { DeleteTransactionButton } from "@/components/finance/delete-transaction-button";
import { MonthNav } from "@/components/finance/month-nav";
import { TransactionDialog } from "@/components/finance/transaction-dialog";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth";
import { getCategories, getMonthTransactions } from "@/lib/data/finance";
import { formatCurrency } from "@/lib/money";
import {
  formatDayLabel,
  monthKeyOf,
  monthLabel,
  normalizeMonthKey,
  todayISO,
} from "@/lib/period";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Transactions" };

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  await requireUser();

  const params = await searchParams;
  const requested = Array.isArray(params.month) ? params.month[0] : params.month;
  // A malformed ?month= is treated as "no filter" rather than an error page.
  const monthKey = requested ? normalizeMonthKey(requested) : monthKeyOf(todayISO());

  const supabase = await createClient();
  const [transactions, categories] = await Promise.all([
    getMonthTransactions(supabase, monthKey),
    getCategories(supabase),
  ]);

  const incomeCents = transactions
    .filter((transaction) => transaction.kind === "income")
    .reduce((total, transaction) => total + transaction.amountCents, 0);
  const expenseCents = transactions
    .filter((transaction) => transaction.kind === "expense")
    .reduce((total, transaction) => total + transaction.amountCents, 0);
  const netCents = incomeCents - expenseCents;

  return (
    <>
      <PageHeader
        title="Transactions"
        description={`${monthLabel(monthKey)} · ${
          transactions.length
        } ${transactions.length === 1 ? "entry" : "entries"}`}
        action={
          <TransactionDialog categories={categories} today={todayISO()}>
            <Button size="sm">
              <Plus aria-hidden />
              Add transaction
            </Button>
          </TransactionDialog>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <MonthNav month={monthKey} basePath="/transactions" />

        <dl className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground">Income</dt>
            <dd className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(incomeCents, { signed: true })}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground">Expenses</dt>
            <dd className="font-medium tabular-nums text-rose-600 dark:text-rose-400">
              {expenseCents === 0 ? formatCurrency(0) : formatCurrency(-expenseCents)}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground">Net</dt>
            <dd
              className={cn(
                "font-medium tabular-nums",
                netCents < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400",
              )}
            >
              {formatCurrency(netCents, { signed: true })}
            </dd>
          </div>
        </dl>
      </div>

      <Card>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={Receipt}
                title={`Nothing recorded in ${monthLabel(monthKey)}`}
                description="Add an income or expense entry and it will appear here with your running totals."
              >
                <TransactionDialog categories={categories} today={todayISO()}>
                  <Button size="sm">
                    <Plus aria-hidden />
                    Add a transaction
                  </Button>
                </TransactionDialog>
              </EmptyState>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-24">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                      {formatDayLabel(transaction.occurredOn)}
                    </TableCell>
                    <TableCell className="min-w-48">
                      <p className="font-medium">{transaction.title}</p>
                      {transaction.note ? (
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {transaction.note}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {formatDayLabel(transaction.occurredOn)} ·{" "}
                        {transaction.categoryName}
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: transaction.categoryColor }}
                          aria-hidden
                        />
                        {transaction.categoryName}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "font-medium tabular-nums",
                          transaction.kind === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400",
                        )}
                      >
                        {transaction.kind === "income"
                          ? formatCurrency(transaction.amountCents, { signed: true })
                          : formatCurrency(-transaction.amountCents)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <TransactionDialog
                          categories={categories}
                          today={todayISO()}
                          transaction={transaction}
                        >
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit ${transaction.title}`}
                          >
                            <Pencil aria-hidden />
                          </Button>
                        </TransactionDialog>
                        <DeleteTransactionButton
                          id={transaction.id}
                          title={transaction.title}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
