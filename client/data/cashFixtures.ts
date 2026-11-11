import type {
  CashCurrencyCode,
  CashLedgerMovementResponse,
  CashRegisterResponse,
  CashSessionResponse,
} from "../types/cash/session";

export const CASH_CURRENCY: CashCurrencyCode = "PEN";

export const CASH_ACTOR_DEFAULT = "cajero.demo";

export const CASH_REGISTER_FIXTURES: readonly CashRegisterResponse[] = [
  { id: 1, code: "CAJ-01", name: "Caja principal tienda" },
  { id: 2, code: "CAJ-02", name: "Caja mostrador 2" },
];

const OPEN_SESSION: CashSessionResponse = {
  id: 101,
  registerId: 1,
  registerCode: "CAJ-01",
  registerName: "Caja principal tienda",
  status: "OPEN",
  openedAt: "2026-11-10T08:05:00.000Z",
  openedBy: CASH_ACTOR_DEFAULT,
  closedAt: null,
  closedBy: null,
  totals: {
    currency: CASH_CURRENCY,
    openingFloat: "200.00",
    totalIncome: "450.50",
    totalExpense: "35.00",
    expectedCash: "615.50",
    countedCash: null,
    difference: null,
  },
};

const CLOSED_SESSION: CashSessionResponse = {
  id: 100,
  registerId: 1,
  registerCode: "CAJ-01",
  registerName: "Caja principal tienda",
  status: "CLOSED",
  openedAt: "2026-11-09T08:00:00.000Z",
  openedBy: CASH_ACTOR_DEFAULT,
  closedAt: "2026-11-09T20:10:00.000Z",
  closedBy: CASH_ACTOR_DEFAULT,
  totals: {
    currency: CASH_CURRENCY,
    openingFloat: "150.00",
    totalIncome: "890.00",
    totalExpense: "40.00",
    expectedCash: "1000.00",
    countedCash: "998.50",
    difference: "-1.50",
  },
};

export const CASH_SESSION_SEED: readonly CashSessionResponse[] = [
  OPEN_SESSION,
  CLOSED_SESSION,
];

export const CASH_MOVEMENT_SEED: readonly CashLedgerMovementResponse[] = [
  {
    id: 1,
    sessionId: 101,
    occurredAt: "2026-11-10T08:05:00.000Z",
    kind: "OPENING",
    concept: "Fondo de apertura",
    paymentMethodName: "Efectivo",
    amount: "200.00",
    status: "PROCESSED",
    externalReference: null,
  },
  {
    id: 2,
    sessionId: 101,
    occurredAt: "2026-11-10T10:22:00.000Z",
    kind: "INCOME",
    concept: "Cobro venta mostrador #V-4412",
    paymentMethodName: "Efectivo",
    amount: "185.50",
    status: "PROCESSED",
    externalReference: "V-4412",
  },
  {
    id: 3,
    sessionId: 101,
    occurredAt: "2026-11-10T12:40:00.000Z",
    kind: "INCOME",
    concept: "Cobro venta mostrador #V-4420",
    paymentMethodName: "Tarjeta",
    amount: "265.00",
    status: "PROCESSED",
    externalReference: "V-4420",
  },
  {
    id: 4,
    sessionId: 101,
    occurredAt: "2026-11-10T15:05:00.000Z",
    kind: "EXPENSE",
    concept: "Compra insumos menor",
    paymentMethodName: "Efectivo",
    amount: "35.00",
    status: "PROCESSED",
    externalReference: null,
  },
  {
    id: 5,
    sessionId: 100,
    occurredAt: "2026-11-09T08:00:00.000Z",
    kind: "OPENING",
    concept: "Fondo de apertura",
    paymentMethodName: "Efectivo",
    amount: "150.00",
    status: "PROCESSED",
    externalReference: null,
  },
  {
    id: 6,
    sessionId: 100,
    occurredAt: "2026-11-09T20:10:00.000Z",
    kind: "CLOSING",
    concept: "Arqueo de cierre",
    paymentMethodName: "Efectivo",
    amount: "998.50",
    status: "PROCESSED",
    externalReference: "ARQ-100",
  },
];

export const CASH_PAYMENT_METHOD_OPTIONS = [
  "Efectivo",
  "Tarjeta",
  "Transferencia",
  "Billetera",
] as const;

export function cloneCashRegisters(): CashRegisterResponse[] {
  return CASH_REGISTER_FIXTURES.map((r) => ({ ...r }));
}

export function cloneCashSessions(): CashSessionResponse[] {
  return CASH_SESSION_SEED.map((s) => ({
    ...s,
    totals: { ...s.totals },
  }));
}

export function cloneCashMovements(): CashLedgerMovementResponse[] {
  return CASH_MOVEMENT_SEED.map((m) => ({ ...m }));
}
