import { z } from "zod";

/**
 * Auth validation shared by the browser form and the server action.
 *
 * The browser run is a courtesy: it gives instant field-level feedback. The
 * server run is the one that decides, because anything reaching the action can
 * be forged.
 */

const emailField = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .max(254, "That email address is too long.")
  .pipe(z.email("Enter a valid email address, e.g. you@example.com."))
  .transform((value) => value.toLowerCase());

// 72 characters is not arbitrary: GoTrue hashes passwords with bcrypt, which
// silently ignores everything past 72 bytes. Rejecting here is kinder than
// accepting a password that only half works.
const newPasswordField = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use 72 characters or fewer.");

export const signInSchema = z.object({
  email: emailField,
  // No length rules on sign-in: an existing account may predate our policy, and
  // telling the user their password is "too short" would leak nothing useful.
  password: z.string().min(1, "Enter your password."),
});

export const signUpSchema = z
  .object({
    email: emailField,
    password: newPasswordField,
    confirmPassword: z.string().min(1, "Re-enter your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;

/** Shape returned by every auth server action to `useActionState`. */
export type AuthFormState = {
  status: "idle" | "error" | "success";
  /** Form-level message, rendered in an aria-live region. */
  message?: string;
  /** Per-input messages, keyed by field name. */
  fieldErrors?: Record<string, string>;
  /** Echoed back after sign-up so the confirmation screen can show it. */
  email?: string;
};

export const IDLE_AUTH_STATE: AuthFormState = { status: "idle" };

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
