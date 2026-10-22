import { z } from "zod";

import { parseAmountToCents } from "@/lib/money";

/**
 * Validation shared by the transaction and budget forms.
 *
 * The browser run gives instant feedback; the server run is what decides.
 * Both use these schemas, so there is exactly one definition of "valid".
 */

/** Fields the transaction form posts. Keep in sync with the component. */
export const TRANSACTION_FIELDS = [
  "title",
  "amountCents",
  "kind",
  "categoryId",
  "occurredOn",
  "note",
] as const;

export const BUDGET_FIELDS = ["categoryId", "amountCents", "month"] as const;

const titleField = z
  .string()
  .trim()
  .min(1, "Give this transaction a title.")
  .max(120, "Keep the title to 120 characters or fewer.");

/**
 * Amounts arrive as free text ("1,250.50", "Ksh 3000"). `parseAmountToCents`
 * owns that parsing so the browser and the database agree on the value.
 */
const amountField = z
  .string()
  .trim()
  .min(1, "Enter an amount.")
  .superRefine((value, ctx) => {
    const parsed = parseAmountToCents(value);
    if (!parsed.ok) {
      ctx.addIssue({ code: "custom", message: parsed.error });
    }
  })
  .transform((value) => {
    // The refine above guarantees success; the fallback only satisfies types.
    const parsed = parseAmountToCents(value);
    return parsed.ok ? parsed.cents : 0;
  });

const kindField = z.enum(["income", "expense"], {
  error: "Choose income or expense.",
});

const dateField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.")
  .refine((value) => {
    // Reject 2026-02-31: the Date object normalises it, so compare the parts.
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Choose a real calendar date.");

const noteField = z
  .string()
  .trim()
  .max(500, "Keep the note to 500 characters or fewer.")
  .transform((value) => (value === "" ? null : value));

const monthField = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Choose a month.");

export const transactionSchema = z.object({
  title: titleField,
  amountCents: amountField,
  kind: kindField,
  categoryId: z.uuid("Choose a category."),
  occurredOn: dateField,
  note: noteField,
});

export const budgetSchema = z.object({
  categoryId: z.uuid("Choose a category."),
  amountCents: amountField,
  month: monthField,
});

export type TransactionValues = z.infer<typeof transactionSchema>;
export type BudgetValues = z.infer<typeof budgetSchema>;
