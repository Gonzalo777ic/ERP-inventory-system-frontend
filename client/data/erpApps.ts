import type { LucideIcon } from "lucide-react";
import {
  BadgePercent,
  BarChart3,
  Boxes,
  Briefcase,
  Calculator,
  ClipboardList,
  Factory,
  FolderKanban,
  LayoutGrid,
  Package,
  ShoppingBag,
  Store,
  Truck,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

export type ErpAppId =
  | "identidad"
  | "contactos"
  | "catalogo"
  | "inventario"
  | "compras"
  | "ventas"
  | "contabilidad"
  | "caja"
  | "crm"
  | "mrp"
  | "rrhh"
  | "proyectos"
  | "pos"
  | "ecommerce"
  | "reportes"
  | "despacho";

export type ErpAppDefinition = {
  id: ErpAppId;
  name: string;
  description: string;
  /** Destination path: existing module or `/apps/:id` stub */
  path: string;
  icon: LucideIcon;
  /** True when the route is a static placeholder only */
  stub: boolean;
};

/**
 * Odoo-style Apps catalog for the Admin ERP launcher.
 * Paths point at real screens when they exist; otherwise `/apps/:id` stubs.
 */
export const ERP_APPS: readonly ErpAppDefinition[] = [
  {
    id: "identidad",
    name: "Identidad",
    description: "Usuarios, roles y acceso",
    path: "/users",
    icon: UserCog,
    stub: false,
  },
  {
    id: "contactos",
    name: "Contactos",
    description: "Partners, clientes y proveedores",
    path: "/partners",
    icon: Users,
    stub: false,
  },
  {
    id: "catalogo",
    name: "Catálogo",
    description: "Productos, marcas y categorías",
    path: "/catalog",
    icon: Package,
    stub: false,
  },
  {
    id: "inventario",
    name: "Inventario",
    description: "Stock, pickings y ajustes",
    path: "/stock",
    icon: Boxes,
    stub: false,
  },
  {
    id: "compras",
    name: "Compras",
    description: "RFQ → OC → recepción",
    path: "/compras",
    icon: ClipboardList,
    stub: false,
  },
  {
    id: "ventas",
    name: "Ventas",
    description: "Cotizaciones, pedidos y registro",
    path: "/sales",
    icon: ShoppingBag,
    stub: false,
  },
  {
    id: "contabilidad",
    name: "Contabilidad",
    description: "Asientos, facturas y CxC/CxP",
    path: "/contabilidad",
    icon: Calculator,
    stub: false,
  },
  {
    id: "caja",
    name: "Caja",
    description: "Sesiones, movimientos y arqueo",
    path: "/cash",
    icon: Wallet,
    stub: false,
  },
  {
    id: "crm",
    name: "CRM",
    description: "Kanban de oportunidades",
    path: "/crm",
    icon: BadgePercent,
    stub: false,
  },
  {
    id: "mrp",
    name: "MRP",
    description: "Manufactura y listas de materiales",
    path: "/mrp",
    icon: Factory,
    stub: false,
  },
  {
    id: "rrhh",
    name: "RRHH",
    description: "Empleados y ausencias",
    path: "/apps/rrhh",
    icon: Briefcase,
    stub: true,
  },
  {
    id: "proyectos",
    name: "Proyectos",
    description: "Tareas y partes de horas",
    path: "/apps/proyectos",
    icon: FolderKanban,
    stub: true,
  },
  {
    id: "pos",
    name: "POS",
    description: "Punto de venta presencial",
    path: "/pos",
    icon: LayoutGrid,
    stub: false,
  },
  {
    id: "ecommerce",
    name: "eCommerce",
    description: "Pedido y tienda online",
    path: "/apps/ecommerce",
    icon: Store,
    stub: true,
  },
  {
    id: "reportes",
    name: "Reportes",
    description: "KPIs e informes del ERP",
    path: "/reports",
    icon: BarChart3,
    stub: false,
  },
  {
    id: "despacho",
    name: "Despacho",
    description: "Bandeja del transportista y cercanía",
    path: "/dispatch/inbox",
    icon: Truck,
    stub: false,
  },
] as const;

export function findErpApp(id: string): ErpAppDefinition | undefined {
  return ERP_APPS.find((app) => app.id === id);
}
