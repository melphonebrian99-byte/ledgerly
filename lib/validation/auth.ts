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

/**
 * Shared with every other form in the app — re-exported here so auth imports
 * stay put.
 */
export { fieldErrorsFrom, formValues } from "./form";
