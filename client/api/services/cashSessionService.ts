import {
  CASH_ACTOR_DEFAULT,
  CASH_CURRENCY,
  cloneCashMovements,
  cloneCashRegisters,
  cloneCashSessions,
} from "../../data/cashFixtures";
import type {
  CashLedgerMovementResponse,
  CashRegisterResponse,
  CashSessionResponse,
  CloseCashSessionPayload,
  OpenCashSessionPayload,
  RegisterCashMovementPayload,
} from "../../types/cash/session";

const MOCK_LATENCY_MS = 160;

let sessions: CashSessionResponse[] = cloneCashSessions();
let movements: CashLedgerMovementResponse[] = cloneCashMovements();
let nextSessionId = 200;
let nextMovementId = 100;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseMoney(value: string): number {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Monto inválido: ${value}`);
  }
  return n;
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}

function recomputeTotals(sessionId: number): void {
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return;

  const ledger = movements.filter(
    (m) => m.sessionId === sessionId && m.status === "PROCESSED",
  );

  let openingFloat = 0;
  let totalIncome = 0;
  let totalExpense = 0;

  for (const row of ledger) {
    const amount = parseMoney(row.amount);
    if (row.kind === "OPENING") openingFloat += amount;
    if (row.kind === "INCOME") totalIncome += amount;
    if (row.kind === "EXPENSE") totalExpense += amount;
  }

  const expectedCash = openingFloat + totalIncome - totalExpense;
  const counted = session.totals.countedCash;
  const difference =
    counted === null ? null : formatMoney(parseMoney(counted) - expectedCash);

  session.totals = {
    currency: CASH_CURRENCY,
    openingFloat: formatMoney(openingFloat),
    totalIncome: formatMoney(totalIncome),
    totalExpense: formatMoney(totalExpense),
    expectedCash: formatMoney(expectedCash),
    countedCash: counted,
    difference,
  };
}

function cloneSession(session: CashSessionResponse): CashSessionResponse {
  return { ...session, totals: { ...session.totals } };
}

/**
 * Demo local de Caja. Totales solo aquí — la UI no recalcula.
 */
export const CashSessionService = {
  isMockMode(): boolean {
    return true;
  },

  listRegisters: async (): Promise<CashRegisterResponse[]> => {
    await delay(MOCK_LATENCY_MS);
    return cloneCashRegisters();
  },

  listSessions: async (): Promise<CashSessionResponse[]> => {
    await delay(MOCK_LATENCY_MS);
    for (const s of sessions) recomputeTotals(s.id);
    return sessions.map(cloneSession);
  },

  getSession: async (sessionId: number): Promise<CashSessionResponse> => {
    await delay(MOCK_LATENCY_MS);
    const found = sessions.find((s) => s.id === sessionId);
    if (!found) throw new Error(`Sesión de caja ${sessionId} no encontrada.`);
    recomputeTotals(sessionId);
    return cloneSession(found);
  },

  listMovements: async (
    sessionId: number,
  ): Promise<CashLedgerMovementResponse[]> => {
    await delay(MOCK_LATENCY_MS);
    return movements
      .filter((m) => m.sessionId === sessionId)
      .map((m) => ({ ...m }))
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  },

  openSession: async (
    payload: OpenCashSessionPayload,
  ): Promise<CashSessionResponse> => {
    await delay(MOCK_LATENCY_MS);
    const registers = cloneCashRegisters();
    const register = registers.find((r) => r.id === payload.registerId);
    if (!register) throw new Error("Caja no encontrada.");

    const openExists = sessions.some(
      (s) => s.registerId === payload.registerId && s.status === "OPEN",
    );
    if (openExists) {
      throw new Error(`Ya hay una sesión abierta en ${register.code}.`);
    }

    const openingFloat = formatMoney(parseMoney(payload.openingFloat));
    const now = new Date().toISOString();
    const session: CashSessionResponse = {
      id: nextSessionId++,
      registerId: register.id,
      registerCode: register.code,
      registerName: register.name,
      status: "OPEN",
      openedAt: now,
      openedBy: payload.openedBy || CASH_ACTOR_DEFAULT,
      closedAt: null,
      closedBy: null,
      totals: {
        currency: CASH_CURRENCY,
        openingFloat,
        totalIncome: "0.00",
        totalExpense: "0.00",
        expectedCash: openingFloat,
        countedCash: null,
        difference: null,
      },
    };

    sessions = [session, ...sessions];
    movements = [
      {
        id: nextMovementId++,
        sessionId: session.id,
        occurredAt: now,
        kind: "OPENING",
        concept: "Fondo de apertura",
        paymentMethodName: "Efectivo",
        amount: openingFloat,
        status: "PROCESSED",
        externalReference: null,
      },
      ...movements,
    ];

    return cloneSession(session);
  },

  registerMovement: async (
    payload: RegisterCashMovementPayload,
  ): Promise<CashLedgerMovementResponse> => {
    await delay(MOCK_LATENCY_MS);
    const session = sessions.find((s) => s.id === payload.sessionId);
    if (!session) throw new Error("Sesión no encontrada.");
    if (session.status !== "OPEN") {
      throw new Error("Solo se registran movimientos en sesión abierta.");
    }

    const amount = formatMoney(parseMoney(payload.amount));
    if (parseMoney(amount) <= 0) {
      throw new Error("El monto debe ser mayor a cero.");
    }

    const row: CashLedgerMovementResponse = {
      id: nextMovementId++,
      sessionId: payload.sessionId,
      occurredAt: new Date().toISOString(),
      kind: payload.kind,
      concept: payload.concept.trim(),
      paymentMethodName: payload.paymentMethodName,
      amount,
      status: "PROCESSED",
      externalReference: payload.externalReference?.trim() || null,
    };

    movements = [row, ...movements];
    recomputeTotals(payload.sessionId);
    return { ...row };
  },

  closeSession: async (
    payload: CloseCashSessionPayload,
  ): Promise<CashSessionResponse> => {
    await delay(MOCK_LATENCY_MS);
    const session = sessions.find((s) => s.id === payload.sessionId);
    if (!session) throw new Error("Sesión no encontrada.");
    if (session.status !== "OPEN") {
      throw new Error("La sesión ya está cerrada.");
    }

    recomputeTotals(payload.sessionId);
    const countedCash = formatMoney(parseMoney(payload.countedCash));
    const expected = parseMoney(session.totals.expectedCash);
    const difference = formatMoney(parseMoney(countedCash) - expected);
    const now = new Date().toISOString();

    session.status = "CLOSED";
    session.closedAt = now;
    session.closedBy = payload.closedBy || CASH_ACTOR_DEFAULT;
    session.totals.countedCash = countedCash;
    session.totals.difference = difference;

    movements = [
      {
        id: nextMovementId++,
        sessionId: session.id,
        occurredAt: now,
        kind: "CLOSING",
        concept: "Arqueo de cierre",
        paymentMethodName: "Efectivo",
        amount: countedCash,
        status: "PROCESSED",
        externalReference: `ARQ-${session.id}`,
      },
      ...movements,
    ];

    return cloneSession(session);
  },
};
