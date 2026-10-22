import { ArrowLeftRight, LayoutDashboard, Target } from "lucide-react";

/**
 * Primary navigation. Hrefs are typed as the literal union Next's typed routes
 * understands, so renaming a route breaks the build instead of producing a 404.
 */
export type NavItem = {
  href: "/dashboard" | "/transactions" | "/budgets";
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
};

export const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    description: "Balance, income, spending",
  },
  {
    href: "/transactions",
    label: "Transactions",
    icon: ArrowLeftRight,
    description: "Add, edit, and review entries",
  },
  {
    href: "/budgets",
    label: "Budgets",
    icon: Target,
    description: "Monthly limits per category",
  },
];
