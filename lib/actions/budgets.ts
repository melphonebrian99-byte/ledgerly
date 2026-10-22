"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { monthStart } from "@/lib/period";
import { createClient } from "@/lib/supabase/server";
import { BUDGET_FIELDS, budgetSchema } from "@/lib/validation/finance";
import { fieldErrorsFrom, formValues, type FormState } from "@/lib/validation/form";

const SESSION_EXPIRED = "Your session expired. Sign in again to continue.";

function revalidateMoney(): void {
  revalidatePath("/dashboard");
  revalidatePath("/budgets");
}

/**
 * Sets (or replaces) one category's limit for one month.
 *
 * Upsert rather than insert: a budget is a value per category per month, so
 * editing it is the same operation as creating it. The database's unique
 * constraint is the conflict target, which keeps the rule in the schema.
 */
export async function saveBudget(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: SESSION_EXPIRED };

  const values = formValues(formData, BUDGET_FIELDS);
  const parsed = budgetSchema.safeParse(values);

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  const supabase = await createClient();

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("kind")
    .eq("id", parsed.data.categoryId)
    .maybeSingle();

  if (categoryError || !category) {
    return {
      status: "error",
      fieldErrors: { categoryId: "That category is no longer available. Pick another one." },
      values,
    };
  }
  if (category.kind !== "expense") {
    return {
      status: "error",
      fieldErrors: { categoryId: "Budgets apply to expense categories." },
      values,
    };
  }

  const { error } = await supabase.from("budgets").upsert(
    {
      user_id: user.id,
      category_id: parsed.data.categoryId,
      month_start: monthStart(parsed.data.month),
      limit_cents: parsed.data.amountCents,
    },
    { onConflict: "user_id,category_id,month_start" },
  );

  if (error) {
    return { status: "error", message: error.message, values };
  }

  revalidateMoney();
  return { status: "success", message: "Budget saved." };
}

export async function deleteBudget(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: SESSION_EXPIRED };

  const id = formData.get("id");
  if (typeof id !== "string" || id === "") {
    return { status: "error", message: "That budget is missing its id." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { status: "error", message: error.message };
  }
  if (!data) {
    return { status: "error", message: "That budget no longer exists." };
  }

  revalidateMoney();
  return { status: "success", message: "Budget removed." };
}
