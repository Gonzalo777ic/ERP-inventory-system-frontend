import type { OrderStatus } from "./orders";
import type { QuotationStatus } from "./quotations";

/** Document currency for purchase displays (policy of context). */
export const PROCUREMENT_CURRENCY = "PEN" as const;

export type BadgeSemantic =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "secondary"
  | "default";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  BORRADOR: "Borrador",
  PENDIENTE: "Enviado",
  CONFIRMADO: "Confirmado",
  RECHAZADO: "Rechazado",
  COMPLETO: "Recibido",
  CANCELADO: "Cancelado",
};

export const ORDER_STATUS_BADGE: Record<OrderStatus, BadgeSemantic> = {
  BORRADOR: "neutral",
  PENDIENTE: "info",
  CONFIRMADO: "warning",
  RECHAZADO: "danger",
  COMPLETO: "success",
  CANCELADO: "secondary",
};

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  BORRADOR: "Borrador",
  ENVIADO: "Enviado",
  RESPONDIDO: "Respondido",
  APROBADO: "Aprobado",
  CONVERTIDO: "Convertido a OC",
  RECHAZADO: "Rechazado",
  CANCELADO: "Cancelado",
};

export const QUOTATION_STATUS_BADGE: Record<QuotationStatus, BadgeSemantic> = {
  BORRADOR: "neutral",
  ENVIADO: "info",
  RESPONDIDO: "warning",
  APROBADO: "success",
  CONVERTIDO: "success",
  RECHAZADO: "danger",
  CANCELADO: "secondary",
};

/** Book document: reception of a confirmed purchase order (not soft-deleted). */
export type PurchaseReceipt = {
  id: number;
  purchaseOrderId: number;
  receivedAt: string;
  warehouseName: string;
  lineCount: number;
  status: "POSTED";
};

export type ProcurementPipelineCounts = {
  rfqOpen: number;
  ordersOpen: number;
  toReceive: number;
  closed: number;
};

export function formatProcurementMoney(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: PROCUREMENT_CURRENCY,
    minimumFractionDigits: 2,
  }).format(amount);
}
