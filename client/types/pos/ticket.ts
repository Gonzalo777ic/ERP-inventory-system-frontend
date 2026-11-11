/**
 * POS — proyecciones de UI.
 * Catálogo y totales vienen del fixture/mock local (sin inventory cross-service).
 */

export type PosCurrencyCode = "PEN";

export type PosTicketStatus = "DRAFT" | "PAID" | "CANCELLED";

export type PosCatalogProduct = {
  id: number;
  sku: string;
  name: string;
  categoryLabel: string;
  unitPrice: string;
  currency: PosCurrencyCode;
};

export type PosPaymentMethodOption = {
  id: number;
  code: string;
  name: string;
};

export type PosCartLineInput = {
  productId: number;
  quantity: number;
};

export type PosPaymentInput = {
  paymentMethodId: number;
  amount: string;
};

export type PosTicketLine = {
  productId: number;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};

export type PosTicketTotals = {
  currency: PosCurrencyCode;
  subtotal: string;
  taxAmount: string;
  total: string;
  taxRateLabel: string;
};

export type PosPaymentLine = {
  methodId: number;
  methodName: string;
  amount: string;
};

export type PosTicketResponse = {
  id: number;
  status: PosTicketStatus;
  lines: PosTicketLine[];
  totals: PosTicketTotals;
  payments: PosPaymentLine[];
  createdAt: string;
};

export type PreviewPosTicketPayload = {
  lines: PosCartLineInput[];
};

export type ConfirmPosTicketPayload = {
  lines: PosCartLineInput[];
  payments: PosPaymentInput[];
};
