"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  TRANSACTION_FIELDS,
  transactionSchema,
} from "@/lib/validation/finance";
import { fieldErrorsFrom, formValues, type FormState } from "@/lib/validation/form";

/**
 * Transaction mutations.
 *
 * Every action re-reads the session and lets RLS decide what is writable. The
 * `user_id` on insert comes from the verified session, never from the form.
 */

const SESSION_EXPIRED = "Your session expired. Sign in again to continue.";

/** Revalidate every screen whose numbers this write affects. */
function revalidateMoney(): void {
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
}

function friendlyError(code: string | undefined, message: string): string {
  switch (code) {
    case "42501":
      return "You don't have access to that record.";
    case "23503":
      return "That category is no longer available. Pick another one.";
    case "23514":
      return "That category doesn't match the transaction type.";
    case "23505":
      return "That entry already exists.";
    default:
      return message;
  }
}

/**
 * A transaction may only use a category of the same kind: the database enforces
 * this too, but checking first turns a constraint violation into a sentence
 * next to the field that caused it.
 */
async function categoryKindError(
  categoryId: string,
  kind: "income" | "expense",
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("kind")
    .eq("id", categoryId)
    .maybeSingle();

  if (error) return "That category is no longer available. Pick another one.";
  if (!data) return "That category is no longer available. Pick another one.";
  if (data.kind !== kind) {
    return kind === "income"
      ? "Income needs an income category."
      : "Expenses need an expense category.";
  }
  return null;
}

export async function createTransaction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: SESSION_EXPIRED };

  const values = formValues(formData, TRANSACTION_FIELDS);
  const parsed = transactionSchema.safeParse(values);

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  const mismatch = await categoryKindError(parsed.data.categoryId, parsed.data.kind);
  if (mismatch) {
    return { status: "error", fieldErrors: { categoryId: mismatch }, values };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    title: parsed.data.title,
    amount_cents: parsed.data.amountCents,
    kind: parsed.data.kind,
    category_id: parsed.data.categoryId,
    occurred_on: parsed.data.occurredOn,
    note: parsed.data.note,
  });

  if (error) {
    return { status: "error", message: friendlyError(error.code, error.message), values };
  }

  revalidateMoney();
  return { status: "success", message: "Transaction added." };
}

export async function updateTransaction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: SESSION_EXPIRED };

  const id = formData.get("id");
  if (typeof id !== "string" || id === "") {
    return { status: "error", message: "That transaction is missing its id." };
  }

  const values = formValues(formData, TRANSACTION_FIELDS);
  const parsed = transactionSchema.safeParse(values);

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  const mismatch = await categoryKindError(parsed.data.categoryId, parsed.data.kind);
  if (mismatch) {
    return { status: "error", fieldErrors: { categoryId: mismatch }, values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .update({
      title: parsed.data.title,
      amount_cents: parsed.data.amountCents,
      kind: parsed.data.kind,
      category_id: parsed.data.categoryId,
      occurred_on: parsed.data.occurredOn,
      note: parsed.data.note,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { status: "error", message: friendlyError(error.code, error.message), values };
  }
  if (!data) {
    return { status: "error", message: "That transaction no longer exists." };
  }

  revalidateMoney();
  return { status: "success", message: "Transaction updated." };
}

export async function deleteTransaction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: SESSION_EXPIRED };

  const id = formData.get("id");
  if (typeof id !== "string" || id === "") {
    return { status: "error", message: "That transaction is missing its id." };
  }

  const supabase = await createClient();
  // `select()` after `delete()` makes RLS's "0 rows affected" visible instead
  // of indistinguishable from a successful delete.
  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { status: "error", message: friendlyError(error.code, error.message) };
  }
  if (!data) {
    return { status: "error", message: "That transaction no longer exists." };
  }

  revalidateMoney();
  return { status: "success", message: "Transaction deleted." };
}
