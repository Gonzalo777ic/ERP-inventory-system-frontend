import { NavLink } from "react-router-dom";
import { BarChart3, Boxes, CreditCard, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/reports", label: "Centro", icon: BarChart3, end: true },
  { to: "/reports/sales", label: "Ventas", icon: ShoppingBag, end: false },
  { to: "/reports/stock", label: "Stock", icon: Boxes, end: false },
  { to: "/reports/ar", label: "CxC", icon: CreditCard, end: false },
] as const;

export function ReportsSubNav() {
  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-border pb-3"
      aria-label="Reportes"
    >
      {LINKS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )
          }
        >
          <Icon className="h-4 w-4" aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
