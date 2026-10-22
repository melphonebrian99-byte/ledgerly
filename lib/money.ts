/**
 * Money helpers.
 *
 * Rules enforced here, so the rest of the app never has to think about them:
 *   1. Amounts travel as integer cents (bigint in Postgres, number in JS).
 *   2. Formatting is the only place cents become a decimal string.
 *   3. Parsing rejects anything that is not a positive amount.
 *
 * Locale note: `en-KE` renders KES as a prefix ("Ksh 1,234.50"), which is what
 * `formatExact` relies on to append cents without losing precision. If this app
 * ever supports a locale with a suffix currency symbol, switch that helper to
 * a single Intl call and accept float rounding at display time.
 */

export const DEFAULT_CURRENCY = "KES";

const LOCALE = "en-KE";

export type FormatOptions = {
  /** ISO 4217 code. Defaults to KES. */
  currency?: string;
  /** Drop ".00" on whole amounts. Useful in tight stat tiles. */
  hideZeroCents?: boolean;
  /** Prefix "+" for positive values. Required for accessible deltas. */
  signed?: boolean;
  /** 1.24M style, for axis labels. Not exact — display only. */
  compact?: boolean;
};

/**
 * Formats integer cents for display.
 * Negative amounts get a leading "-" (never a red-only signal).
 */
export function formatCurrency(cents: number, options: FormatOptions = {}): string {
  if (!Number.isFinite(cents) || !Number.isInteger(cents)) {
    throw new TypeError(`formatCurrency expects integer cents, received ${cents}`);
  }

  const { currency = DEFAULT_CURRENCY, hideZeroCents = false, signed = false } = options;
  const negative = cents < 0;
  const absolute = Math.abs(cents);

  const body = options.compact
    ? new Intl.NumberFormat(LOCALE, {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(absolute / 100)
    : formatExact(absolute, currency, hideZeroCents && absolute % 100 === 0 ? 0 : 2);

  if (negative) return `-${body}`;
  return signed && cents > 0 ? `+${body}` : body;
}

/**
 * Exact integer formatting: splits cents into major/minor units and formats the
 * major part with Intl, so no value is ever routed through a float.
 */
function formatExact(absoluteCents: number, currency: string, fractionDigits: 0 | 2): string {
  const major = Math.floor(absoluteCents / 100);
  const minor = absoluteCents % 100;

  const majorPart = new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(major);

  if (fractionDigits === 0) return majorPart;
  return `${majorPart}.${minor.toString().padStart(2, "0")}`;
}

/** 125050 -> "1250.50". Use for form prefill / editable inputs, never display. */
export function centsToInputValue(cents: number): string {
  const major = Math.floor(cents / 100);
  const minor = cents % 100;
  return `${major}.${minor.toString().padStart(2, "0")}`;
}

export type ParseAmountResult =
  | { ok: true; cents: number }
  | { ok: false; error: string };

/**
 * Parses user input ("1,250.50", "Ksh 3000", " 12 ") into positive integer
 * cents. Mirrors the zod schema used by the transaction form, so the browser
 * and the server reject the same things.
 */
export function parseAmountToCents(raw: unknown): ParseAmountResult {
  if (typeof raw !== "string") return { ok: false, error: "Enter an amount" };

  const cleaned = raw
    .trim()
    .replace(/[\s\u00a0]/g, "")
    .replace(/,/g, "")
    .replace(/^(ksh|kes)/i, "");

  if (cleaned === "") return { ok: false, error: "Enter an amount" };
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return { ok: false, error: "Use digits only, with up to 2 decimals (e.g. 1250.50)" };
  }

  const [majorPart, minorPart = ""] = cleaned.split(".");
  const cents = Number(majorPart) * 100 + Number(minorPart.padEnd(2, "0"));

  if (!Number.isSafeInteger(cents)) return { ok: false, error: "That amount is too large" };
  if (cents <= 0) return { ok: false, error: "Amount must be greater than zero" };

  return { ok: true, cents };
}
