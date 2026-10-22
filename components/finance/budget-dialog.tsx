"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { saveBudget } from "@/lib/actions/budgets";
import type { BudgetRow, CategoryOption } from "@/lib/data/finance";
import { centsToInputValue } from "@/lib/money";
import { budgetSchema } from "@/lib/validation/finance";
import { fieldErrorsFrom, IDLE_FORM_STATE, type FormState } from "@/lib/validation/form";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs text-destructive" role="alert">
      {message}
    </p>
  );
}

function BudgetForm({
  categories,
  month,
  budget,
  onSuccess,
  onCancel,
}: {
  categories: CategoryOption[];
  month: string;
  budget?: BudgetRow;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEdit = Boolean(budget);
  const [state, setState] = useState<FormState>(IDLE_FORM_STATE);
  const [pending, startTransition] = useTransition();
  const [categoryId, setCategoryId] = useState(budget?.categoryId ?? "");
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.kind === "expense"),
    [categories],
  );

  const errors = { ...state.fieldErrors, ...clientErrors };

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const parsed = budgetSchema.safeParse({
      categoryId: String(data.get("categoryId") ?? ""),
      amountCents: String(data.get("amountCents") ?? ""),
      month: String(data.get("month") ?? ""),
    });

    if (!parsed.success) {
      setClientErrors(fieldErrorsFrom(parsed.error));
      return;
    }

    setClientErrors({});
    setState(IDLE_FORM_STATE);

    startTransition(async () => {
      try {
        const result = await saveBudget(IDLE_FORM_STATE, data);
        if (result.status === "success") {
          toast.success(result.message ?? "Budget saved.");
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
      <input type="hidden" name="month" value={month} />

      {state.status === "error" && state.message ? (
        <p
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="budget-category">Category</Label>
        {budget ? (
          <>
            <div className="flex h-8 items-center gap-2 rounded-lg border border-input bg-muted/50 px-2.5 text-sm">
              <CategoryIcon name={budget.categoryIcon} className="size-4" />
              {budget.categoryName}
            </div>
            <p className="text-xs text-muted-foreground">
              A budget belongs to one category. To move it, delete this one and set
              a new budget.
            </p>
          </>
        ) : (
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger
              id="budget-category"
              className="w-full"
              aria-invalid={Boolean(errors.categoryId)}
              aria-describedby={errors.categoryId ? "budget-category-error" : undefined}
            >
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <CategoryIcon name={category.icon} className="size-4" />
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <input type="hidden" name="categoryId" value={categoryId} />
        <FieldError id="budget-category-error" message={errors.categoryId} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="budget-amount">Monthly limit</Label>
        <div className="relative">
          <span
            className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs text-muted-foreground"
            aria-hidden
          >
            Ksh
          </span>
          <Input
            id="budget-amount"
            name="amountCents"
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={budget ? centsToInputValue(budget.limitCents) : ""}
            className="pl-10 tabular-nums"
            aria-invalid={Boolean(errors.amountCents)}
            aria-describedby={errors.amountCents ? "budget-amount-error" : undefined}
          />
        </div>
        <FieldError id="budget-amount-error" message={errors.amountCents} />
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {pending ? "Saving…" : isEdit ? "Update budget" : "Set budget"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function BudgetDialog({
  categories,
  month,
  budget,
  children,
}: {
  categories: CategoryOption[];
  month: string;
  budget?: BudgetRow;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{budget ? "Edit budget" : "Set a budget"}</DialogTitle>
          <DialogDescription>
            {budget
              ? "Change the limit for this category and month."
              : "Pick an expense category and a limit. Spending is matched by category and date."}
          </DialogDescription>
        </DialogHeader>

        <BudgetForm
          categories={categories}
          month={month}
          budget={budget}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
