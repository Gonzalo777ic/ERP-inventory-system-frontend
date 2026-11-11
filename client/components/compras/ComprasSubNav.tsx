import { NavLink } from "react-router-dom";
import {
  ClipboardList,
  FileText,
  GitCompareArrows,
  PackageCheck,
  ShoppingCart,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/compras", label: "Flujo", icon: ShoppingCart, end: true },
  { to: "/quotations", label: "RFQ / Cotizaciones", icon: FileText, end: false },
  {
    to: "/purchases/quotation-compare",
    label: "Comparativo",
    icon: GitCompareArrows,
    end: false,
  },
  {
    to: "/purchases/orders",
    label: "Órdenes",
    icon: ClipboardList,
    end: false,
  },
  {
    to: "/purchases/receipts",
    label: "Recepciones",
    icon: PackageCheck,
    end: false,
  },
  { to: "/suppliers", label: "Proveedores", icon: Users, end: false },
] as const;

export function ComprasSubNav() {
  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-border pb-3"
      aria-label="Compras"
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
