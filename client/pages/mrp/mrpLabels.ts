import type { BadgeProps } from "../../components/ui/badge";
import type {
  BomStatus,
  ManufacturingOrderStatus,
} from "../../types/inventory/mrp";

export const BOM_STATUS_LABELS: Record<BomStatus, string> = {
  ACTIVE: "Vigente",
  RETIRED: "Dada de baja",
};

export const BOM_STATUS_BADGE: Record<
  BomStatus,
  NonNullable<BadgeProps["variant"]>
> = {
  ACTIVE: "success",
  RETIRED: "neutral",
};

export const MO_STATUS_LABELS: Record<ManufacturingOrderStatus, string> = {
  DRAFT: "Borrador",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "En progreso",
  DONE: "Hecha",
  CANCELLED: "Anulada",
};

export const MO_STATUS_BADGE: Record<
  ManufacturingOrderStatus,
  NonNullable<BadgeProps["variant"]>
> = {
  DRAFT: "neutral",
  CONFIRMED: "info",
  IN_PROGRESS: "warning",
  DONE: "success",
  CANCELLED: "danger",
};

export function formatMrpInstant(iso: string): string {
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
