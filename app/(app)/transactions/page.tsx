import { ArrowDownRight, ArrowUpRight, Plus, Receipt } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/money";
import type { TransactionKind } from "@/types/database";

// ---------------------------------------------------------------------------
// SAMPLE DATA — replaced by real Supabase queries in step 5.
// ---------------------------------------------------------------------------
const ksh = (major: number) => major * 100;

const sampleTransactions: {
  id: string;
  title: string;
  category: string;
  occurredOn: string;
  amountCents: number;
  kind: TransactionKind;
}[] = [
  {
    id: "1",
    title: "October salary",
    category: "Salary",
    occurredOn: "2026-10-01",
    amountCents: ksh(120_000),
    kind: "income",
  },
  {
    id: "2",
    title: "Rent — Kilimani",
    category: "Housing & Rent",
    occurredOn: "2026-10-01",
    amountCents: ksh(45_000),
    kind: "expense",
  },
  {
    id: "3",
    title: "Weekly shop",
    category: "Food & Groceries",
    occurredOn: "2026-10-04",
    amountCents: ksh(8_450.75),
    kind: "expense",
  },
  {
    id: "4",
    title: "Matatu top-up",
    category: "Transport & Fuel",
    occurredOn: "2026-10-05",
    amountCents: ksh(300),
    kind: "expense",
  },
  {
    id: "5",
    title: "Client retainer",
    category: "Freelance",
    occurredOn: "2026-10-07",
    amountCents: ksh(18_000),
    kind: "income",
  },
];

function formatDate(iso: string) {
  // Explicit locale + UTC so a date never shifts across timezones.
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

export default function TransactionsPage() {
  return (
    <>
      <PageHeader
        title="Transactions"
        description="Every entry, newest first"
        action={
          <>
            <Badge variant="outline">Sample data</Badge>
            <Button size="sm" disabled title="Available in step 5">
              <Plus className="size-4" aria-hidden />
              Add transaction
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="size-4 text-muted-foreground" aria-hidden />
            Recent activity
          </CardTitle>
          <CardDescription>
            Type is conveyed by an icon and a sign, not only by colour.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="pr-4 text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleTransactions.map((transaction) => {
                const income = transaction.kind === "income";
                return (
                  <TableRow key={transaction.id}>
                    <TableCell className="pl-4 font-medium">
                      <span className="flex items-center gap-2">
                        <span
                          className={
                            income
                              ? "flex size-6 items-center justify-center rounded-md bg-positive/15 text-positive"
                              : "flex size-6 items-center justify-center rounded-md bg-negative/15 text-negative"
                          }
                        >
                          {income ? (
                            <ArrowUpRight className="size-3.5" aria-hidden />
                          ) : (
                            <ArrowDownRight className="size-3.5" aria-hidden />
                          )}
                        </span>
                        <span className="sr-only">{income ? "Income:" : "Expense:"}</span>
                        {transaction.title}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {transaction.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(transaction.occurredOn)}
                    </TableCell>
                    <TableCell
                      className={
                        income
                          ? "tabular pr-4 text-right font-medium text-positive"
                          : "tabular pr-4 text-right font-medium text-negative"
                      }
                    >
                      {formatCurrency(transaction.amountCents, { signed: income ? true : false })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
