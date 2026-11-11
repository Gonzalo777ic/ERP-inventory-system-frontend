import { NavLink } from "react-router-dom";
import { ClipboardList, Factory, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/mrp", label: "Resumen", icon: Factory, end: true },
  { to: "/mrp/boms", label: "Listas de materiales", icon: Layers, end: false },
  {
    to: "/mrp/orders",
    label: "Órdenes de fabricación",
    icon: ClipboardList,
    end: false,
  },
] as const;

export function MrpSubNav() {
  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-border pb-3"
      aria-label="MRP"
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
