"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowDownRight, ArrowUpRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";

import { CategoryIcon } from "@/components/finance/category-icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createTransaction, updateTransaction } from "@/lib/actions/transactions";
import type { CategoryOption, TransactionRow } from "@/lib/data/finance";
import { centsToInputValue } from "@/lib/money";
import { transactionSchema } from "@/lib/validation/finance";
import { fieldErrorsFrom, IDLE_FORM_STATE, type FormState } from "@/lib/validation/form";

const KIND_OPTIONS = [
  {
    value: "expense",
    label: "Expense",
    hint: "Money out",
    icon: ArrowDownRight,
  },
  {
    value: "income",
    label: "Income",
    hint: "Money in",
    icon: ArrowUpRight,
  },
] as const;

type Kind = (typeof KIND_OPTIONS)[number]["value"];

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs text-destructive" role="alert">
      {message}
    </p>
  );
}

function TransactionForm({
  categories,
  today,
  transaction,
  onSuccess,
  onCancel,
}: {
  categories: CategoryOption[];
  today: string;
  transaction?: TransactionRow;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEdit = Boolean(transaction);
  const action = isEdit ? updateTransaction : createTransaction;

  const [state, setState] = useState<FormState>(IDLE_FORM_STATE);
  const [pending, startTransition] = useTransition();
  const [kind, setKind] = useState<Kind>(transaction?.kind ?? "expense");
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  const options = useMemo(
    () => categories.filter((category) => category.kind === kind),
    [categories, kind],
  );

  const errors = { ...state.fieldErrors, ...clientErrors };

  function chooseKind(next: Kind) {
    setKind(next);
    // A category belongs to exactly one kind; switching must not leave a stale
    // income category attached to an expense (the database rejects that too).
    if (!categories.some((category) => category.id === categoryId && category.kind === next)) {
      setCategoryId("");
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const parsed = transactionSchema.safeParse({
      title: String(data.get("title") ?? ""),
      amountCents: String(data.get("amountCents") ?? ""),
      kind: String(data.get("kind") ?? kind),
      categoryId: String(data.get("categoryId") ?? ""),
      occurredOn: String(data.get("occurredOn") ?? ""),
      note: String(data.get("note") ?? ""),
    });

    if (!parsed.success) {
      setClientErrors(fieldErrorsFrom(parsed.error));
      return;
    }

    setClientErrors({});
    setState(IDLE_FORM_STATE);

    // Awaiting the action here (rather than reacting to action state in an
    // effect) makes "saved, so close" a straight line: no render between the
    // result arriving and the dialog deciding what to do with it.
    startTransition(async () => {
      try {
        const result = await action(IDLE_FORM_STATE, data);
        if (result.status === "success") {
          toast.success(result.message ?? "Saved.");
          onSuccess();
        } else {
          setState(result);
        }
      } catch {
        setState({
          status: "error",
          message: "That didn't save. Check your connection and try again.",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {transaction ? <input type="hidden" name="id" value={transaction.id} /> : null}

      {state.status === "error" && state.message ? (
        <p
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={transaction?.title ?? ""}
          placeholder="e.g. October salary"
          autoComplete="off"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "title-error" : undefined}
        />
        <FieldError id="title-error" message={errors.title} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="amountCents">Amount</Label>
          <div className="relative">
            <span
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs text-muted-foreground"
              aria-hidden
            >
              Ksh
            </span>
            <Input
              id="amountCents"
              name="amountCents"
              inputMode="decimal"
              placeholder="0.00"
              defaultValue={
                transaction ? centsToInputValue(transaction.amountCents) : ""
              }
              className="pl-10 tabular-nums"
              aria-invalid={Boolean(errors.amountCents)}
              aria-describedby={errors.amountCents ? "amount-error" : undefined}
            />
          </div>
          <FieldError id="amount-error" message={errors.amountCents} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="occurredOn">Date</Label>
          <Input
            id="occurredOn"
            name="occurredOn"
            type="date"
            defaultValue={transaction?.occurredOn ?? today}
            aria-invalid={Boolean(errors.occurredOn)}
            aria-describedby={errors.occurredOn ? "date-error" : undefined}
          />
          <FieldError id="date-error" message={errors.occurredOn} />
        </div>
      </div>

      <fieldset className="space-y-1.5">
        <legend className="mb-1.5 text-sm font-medium">Type</legend>
        <div className="grid grid-cols-2 gap-2">
          {KIND_OPTIONS.map((option) => {
            const active = kind === option.value;
            const Icon = option.icon;
            return (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors focus-within:ring-3 focus-within:ring-ring/50",
                  active
                    ? "border-ring bg-muted text-foreground"
                    : "border-input text-muted-foreground hover:bg-muted/50",
                )}
              >
                <input
                  type="radio"
                  name="kind"
                  value={option.value}
                  checked={active}
                  onChange={() => chooseKind(option.value)}
                  className="sr-only"
                />
                <Icon
                  className={cn(
                    "size-4",
                    option.value === "income" ? "text-emerald-400" : "text-rose-400",
                  )}
                  aria-hidden
                />
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.hint}</span>
                {active ? (
                  <Check className="ml-auto size-4 text-foreground" aria-hidden />
                ) : null}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="categoryId">Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger
            id="categoryId"
            className="w-full"
            aria-invalid={Boolean(errors.categoryId)}
            aria-describedby={errors.categoryId ? "category-error" : undefined}
          >
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent>
            {options.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <CategoryIcon name={category.icon} className="size-4" />
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="categoryId" value={categoryId} />
        <FieldError id="category-error" message={errors.categoryId} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea
          id="note"
          name="note"
          defaultValue={transaction?.note ?? ""}
          placeholder="Anything worth remembering about this entry"
          rows={2}
          aria-invalid={Boolean(errors.note)}
          aria-describedby={errors.note ? "note-error" : undefined}
        />
        <FieldError id="note-error" message={errors.note} />
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {pending ? "Saving…" : isEdit ? "Save changes" : "Add transaction"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function TransactionDialog({
  categories,
  today,
  transaction,
  children,
}: {
  categories: CategoryOption[];
  today: string;
  transaction?: TransactionRow;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Edit transaction" : "Add transaction"}
          </DialogTitle>
          <DialogDescription>
            {transaction
              ? "Update the details. Saving recalculates your totals immediately."
              : "Record money in or out. Amounts are stored exactly, in cents."}
          </DialogDescription>
        </DialogHeader>

        <TransactionForm
          categories={categories}
          today={today}
          transaction={transaction}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
