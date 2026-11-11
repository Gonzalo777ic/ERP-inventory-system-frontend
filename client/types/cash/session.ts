/**
 * Caja / sesión de caja — proyecciones de UI.
 * Los totales llegan del mock/API; el cliente solo los muestra.
 */

export type CashSessionStatus = "OPEN" | "CLOSED";

export type CashMovementKind = "INCOME" | "EXPENSE" | "OPENING" | "CLOSING";

export type CashMovementLedgerStatus = "PROCESSED" | "ANNULLED";

export type CashCurrencyCode = "PEN";

export type CashRegisterResponse = {
  id: number;
  code: string;
  name: string;
};

export type CashSessionTotals = {
  currency: CashCurrencyCode;
  openingFloat: string;
  totalIncome: string;
  totalExpense: string;
  expectedCash: string;
  countedCash: string | null;
  difference: string | null;
};

export type CashSessionResponse = {
  id: number;
  registerId: number;
  registerCode: string;
  registerName: string;
  status: CashSessionStatus;
  openedAt: string;
  openedBy: string;
  closedAt: string | null;
  closedBy: string | null;
  totals: CashSessionTotals;
};

export type CashLedgerMovementResponse = {
  id: number;
  sessionId: number;
  occurredAt: string;
  kind: CashMovementKind;
  concept: string;
  paymentMethodName: string;
  /** Monto absoluto en moneda de la sesión (string decimal del servicio). */
  amount: string;
  status: CashMovementLedgerStatus;
  externalReference: string | null;
};

export type OpenCashSessionPayload = {
  registerId: number;
  openingFloat: string;
  openedBy: string;
};

export type RegisterCashMovementPayload = {
  sessionId: number;
  kind: "INCOME" | "EXPENSE";
  concept: string;
  paymentMethodName: string;
  amount: string;
  externalReference?: string;
};

export type CloseCashSessionPayload = {
  sessionId: number;
  countedCash: string;
  closedBy: string;
};

export const CASH_SESSION_STATUS_LABELS: Record<CashSessionStatus, string> = {
  OPEN: "Abierta",
  CLOSED: "Cerrada",
};

export const CASH_MOVEMENT_KIND_LABELS: Record<CashMovementKind, string> = {
  INCOME: "Ingreso",
  EXPENSE: "Egreso",
  OPENING: "Apertura",
  CLOSING: "Cierre",
};
