import { NavLink } from "react-router-dom";
import {
  BookOpen,
  Calculator,
  FileText,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/contabilidad", label: "Resumen", icon: Calculator, end: true },
  {
    to: "/contabilidad/asientos",
    label: "Asientos",
    icon: BookOpen,
    end: false,
  },
  {
    to: "/contabilidad/facturas",
    label: "Facturas",
    icon: FileText,
    end: false,
  },
  {
    to: "/contabilidad/cxc-cxp",
    label: "CxC / CxP",
    icon: Scale,
    end: false,
  },
] as const;

export function ContabilidadSubNav() {
  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-border pb-3"
      aria-label="Contabilidad"
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
