import { z } from "zod";

/**
 * Generic form plumbing shared by every server action.
 *
 * These live apart from any one feature so auth and finance can use the same
 * contract, and the browser and the server can share one definition of what a
 * field error looks like.
 */

/** Shape returned by form server actions to `useActionState`. */
export type FormState = {
  status: "idle" | "error" | "success";
  /** Form-level message, rendered in an aria-live region. */
  message?: string;
  /** Per-input messages, keyed by field name. */
  fieldErrors?: Record<string, string>;
  /** Echoed back on failure so the form does not lose what was typed. */
  values?: Record<string, string>;
};

export const IDLE_FORM_STATE: FormState = { status: "idle" };

export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    // First message per field wins; the rest would just stack up under the input.
    if (typeof key === "string" && fieldErrors[key] === undefined) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}

/**
 * Reads only the named fields out of FormData as strings.
 *
 * `Object.fromEntries(formData)` would also pull in hidden inputs, which zod
 * strips anyway — but it is easy to forget a field, and a missing key would then
 * validate as `undefined` rather than "". An explicit list keeps the browser and
 * server paths identical.
 */
export function formValues(
  formData: FormData,
  keys: readonly string[],
): Record<string, string> {
  const values: Record<string, string> = {};

  for (const key of keys) {
    const raw = formData.get(key);
    values[key] = typeof raw === "string" ? raw : "";
  }

  return values;
}
