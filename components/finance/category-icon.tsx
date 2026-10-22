import {
  Briefcase,
  Car,
  Circle,
  Film,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  PiggyBank,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Store,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Categories store an icon *name* so the database never depends on a component
 * library. This registry is the only place a name becomes a component; an
 * unknown name falls back to a circle rather than crashing a page.
 */
const ICONS: Record<string, LucideIcon> = {
  Briefcase,
  Car,
  Circle,
  Film,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  PiggyBank,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Store,
  Zap,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Circle;
  return <Icon className={className} aria-hidden />;
}
