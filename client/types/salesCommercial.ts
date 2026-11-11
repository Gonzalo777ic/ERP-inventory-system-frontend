/**
 * Commercial sales quotations & orders for the Ventas app UI.
 * Distinct from purchase RFQs (inventory) and from fiscal Sale registry.
 */

export const SALES_COMMERCIAL_CURRENCY = "PEN" as const;

export type SalesQuotationStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export type SalesOrderStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "FULFILLED"
  | "CANCELLED";

export type SalesMoneyDto = {
  amount: number;
  currency: typeof SALES_COMMERCIAL_CURRENCY;
};

export type SalesCommercialLineDto = {
  id: number;
  productSku: string;
  productName: string;
  quantity: number;
  unitPrice: SalesMoneyDto;
  lineTotal: SalesMoneyDto;
};

export type SalesQuotationDto = {
  id: number;
  number: string;
  partnerId: number;
  partnerName: string;
  status: SalesQuotationStatus;
  validUntil: string;
  issuedAt: string;
  notes: string | null;
  lines: SalesCommercialLineDto[];
  total: SalesMoneyDto;
  /** Linked sales order id when converted */
  orderId: number | null;
};

export type SalesOrderDto = {
  id: number;
  number: string;
  partnerId: number;
  partnerName: string;
  status: SalesOrderStatus;
  orderedAt: string;
  notes: string | null;
  quotationId: number | null;
  /** Optional link to fiscal Sale registry when available */
  saleId: number | null;
  lines: SalesCommercialLineDto[];
  total: SalesMoneyDto;
};

export const SALES_QUOTATION_STATUS_LABELS: Record<SalesQuotationStatus, string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  ACCEPTED: "Aceptada",
  REJECTED: "Rechazada",
  EXPIRED: "Vencida",
  CANCELLED: "Cancelada",
};

export const SALES_QUOTATION_STATUS_BADGE: Record<
  SalesQuotationStatus,
  "neutral" | "info" | "success" | "danger" | "warning"
> = {
  DRAFT: "neutral",
  SENT: "info",
  ACCEPTED: "success",
  REJECTED: "danger",
  EXPIRED: "warning",
  CANCELLED: "neutral",
};

export const SALES_ORDER_STATUS_LABELS: Record<SalesOrderStatus, string> = {
  DRAFT: "Borrador",
  CONFIRMED: "Confirmado",
  FULFILLED: "Atendido",
  CANCELLED: "Cancelado",
};

export const SALES_ORDER_STATUS_BADGE: Record<
  SalesOrderStatus,
  "neutral" | "info" | "success" | "danger"
> = {
  DRAFT: "neutral",
  CONFIRMED: "info",
  FULFILLED: "success",
  CANCELLED: "danger",
};
