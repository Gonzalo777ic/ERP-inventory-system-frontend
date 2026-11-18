import type { BadgeProps } from "@/components/ui/badge";
import type { DispatchGuide } from "@/types/dispatch";

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

export const GUIDE_STATUS_BADGE: Record<string, BadgeVariant> = {
  DRAFT: "neutral",
  ISSUED: "success",
  VOIDED: "danger",
};

export const ASSIGNMENT_BADGE: Record<string, BadgeVariant> = {
  UNASSIGNED: "warning",
  ASSIGNED: "info",
};

export function badgeVariant(map: Record<string, BadgeVariant>, key: string): BadgeVariant {
  return map[key] ?? "neutral";
}

export function documentLabel(guide: Pick<DispatchGuide, "documentNumber">): string {
  return guide.documentNumber ?? "Sin número";
}

export function referenceLabel(guide: Pick<DispatchGuide, "saleId" | "saleOrderId">): string {
  const parts: string[] = [];
  if (guide.saleOrderId != null) {
    parts.push(`Pedido ${guide.saleOrderId}`);
  }
  if (guide.saleId != null) {
    parts.push(`Venta ${guide.saleId}`);
  }
  return parts.length === 0 ? "Sin referencia" : parts.join(" · ");
}

export function assigneeLabel(guide: Pick<DispatchGuide, "assignmentStatus" | "assignmentStatusLabel" | "carrierName" | "carrierCode">): string {
  if (guide.assignmentStatus !== "ASSIGNED") {
    return guide.assignmentStatusLabel;
  }
  const who = [guide.carrierName, guide.carrierCode].filter((part) => part && part.trim()).join(" · ");
  return who || guide.assignmentStatusLabel;
}
