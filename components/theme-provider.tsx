"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Provides the theme *context* that shadcn's Toaster reads via useTheme.
 *
 * Note there is no `attribute="class"`: the dark class is applied statically on
 * <html> in the root layout, and letting next-themes manage it too would make
 * two sources of truth fight over the same attribute. `forcedTheme` keeps the
 * context honest until a real toggle exists.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="data-theme" defaultTheme="dark" forcedTheme="dark" enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}
