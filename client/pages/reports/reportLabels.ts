import type { BadgeProps } from "../../components/ui/badge";
import type { ReportMoney } from "../../types/reports";
import { formatCurrency } from "../../utils/format";

export function formatReportMoney(m: ReportMoney): string {
  return formatCurrency(m.amount, m.currency);
}

export function formatReportInstant(iso: string): string {
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const AR_DOC_STATUS_LABELS = {
  OPEN: "Abierta",
  PARTIAL: "Parcial",
  OVERDUE: "Vencida",
} as const;

export const AR_DOC_STATUS_BADGE: Record<
  keyof typeof AR_DOC_STATUS_LABELS,
  NonNullable<BadgeProps["variant"]>
> = {
  OPEN: "info",
  PARTIAL: "warning",
  OVERDUE: "danger",
};
