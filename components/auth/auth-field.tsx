import { cn } from "cn";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Input + label + error/hint, wired for assistive tech.
 *
 * `aria-describedby` points at whichever of the error or hint is actually
 * rendered, so a screen reader announces the reason instead of just "invalid".
 * The error text is never the only signal: the input also gets `aria-invalid`,
 * which styles the border and ring.
 */
export function AuthField({
  id,
  label,
  error,
  hint,
  trailing,
  className,
  ...props
}: React.ComponentProps<typeof Input> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  /** Rendered inside the input's right edge, e.g. a show-password toggle. */
  trailing?: React.ReactNode;
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>

      <div className="relative">
        <Input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn("h-10", trailing && "pr-11", className)}
          {...props}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>
        ) : null}
      </div>

      {error ? (
        <p id={`${id}-error`} className="text-xs text-negative">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
