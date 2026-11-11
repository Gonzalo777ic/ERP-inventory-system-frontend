import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "../../components/ui/badge";
import type {
  CatalogCostingMethod,
  CatalogProductType,
} from "../../types/inventory/catalog";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export const PRODUCT_TYPE_LABELS: Record<CatalogProductType, string> = {
  STORABLE: "Almacenable",
  CONSUMABLE: "Consumible",
  SERVICE: "Servicio",
};

export const PRODUCT_TYPE_BADGE: Record<CatalogProductType, BadgeVariant> = {
  STORABLE: "info",
  CONSUMABLE: "warning",
  SERVICE: "neutral",
};

export const COSTING_METHOD_LABELS: Record<CatalogCostingMethod, string> = {
  STANDARD: "Coste estándar",
  AVERAGE: "Coste promedio",
};

export function formatAttributeLine(
  attributes: { attributeName: string; value: string }[],
): string {
  if (attributes.length === 0) return "—";
  return attributes.map((a) => `${a.attributeName}: ${a.value}`).join(" · ");
}
