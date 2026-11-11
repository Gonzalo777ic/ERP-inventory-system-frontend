import {
  clonePosCatalog,
  clonePosPaymentMethods,
  POS_CURRENCY,
  POS_TAX_LABEL,
  POS_TAX_RATE,
} from "../../data/posFixtures";
import type {
  ConfirmPosTicketPayload,
  PosCatalogProduct,
  PosPaymentMethodOption,
  PosTicketLine,
  PosTicketResponse,
  PosTicketTotals,
  PreviewPosTicketPayload,
} from "../../types/pos/ticket";

const MOCK_LATENCY_MS = 140;

let nextTicketId = 5001;
const paidTickets: PosTicketResponse[] = [];

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

function buildLines(payload: PreviewPosTicketPayload): PosTicketLine[] {
  const catalog = clonePosCatalog();
  const lines: PosTicketLine[] = [];

  for (const input of payload.lines) {
    if (input.quantity <= 0) continue;
    const product = catalog.find((p) => p.id === input.productId);
    if (!product) {
      throw new Error(`Producto POS ${input.productId} no encontrado.`);
    }
    const unit = parseMoney(product.unitPrice);
    const lineTotal = formatMoney(unit * input.quantity);
    lines.push({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      quantity: input.quantity,
      unitPrice: product.unitPrice,
      lineTotal,
    });
  }

  return lines;
}

function buildTotals(lines: PosTicketLine[]): PosTicketTotals {
  const subtotal = lines.reduce((acc, line) => acc + parseMoney(line.lineTotal), 0);
  const taxRate = parseMoney(POS_TAX_RATE);
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  return {
    currency: POS_CURRENCY,
    subtotal: formatMoney(subtotal),
    taxAmount: formatMoney(taxAmount),
    total: formatMoney(total),
    taxRateLabel: POS_TAX_LABEL,
  };
}

/**
 * POS local: catálogo fixture + totales en el mock (sin Feign / inventory).
 */
export const PosService = {
  isMockMode(): boolean {
    return true;
  },

  listCatalog: async (): Promise<PosCatalogProduct[]> => {
    await delay(MOCK_LATENCY_MS);
    return clonePosCatalog();
  },

  listPaymentMethods: async (): Promise<PosPaymentMethodOption[]> => {
    await delay(MOCK_LATENCY_MS);
    return clonePosPaymentMethods();
  },

  previewTicket: async (
    payload: PreviewPosTicketPayload,
  ): Promise<PosTicketResponse> => {
    await delay(MOCK_LATENCY_MS);
    const lines = buildLines(payload);
    return {
      id: 0,
      status: "DRAFT",
      lines,
      totals: buildTotals(lines),
      payments: [],
      createdAt: new Date().toISOString(),
    };
  },

  confirmTicket: async (
    payload: ConfirmPosTicketPayload,
  ): Promise<PosTicketResponse> => {
    await delay(MOCK_LATENCY_MS);
    const lines = buildLines(payload);
    if (lines.length === 0) {
      throw new Error("El ticket no tiene líneas.");
    }

    const totals = buildTotals(lines);
    const methods = clonePosPaymentMethods();
    const payments = payload.payments.map((p) => {
      const method = methods.find((m) => m.id === p.paymentMethodId);
      if (!method) throw new Error("Método de pago no válido.");
      return {
        methodId: method.id,
        methodName: method.name,
        amount: formatMoney(parseMoney(p.amount)),
      };
    });

    const paidSum = payments.reduce((acc, p) => acc + parseMoney(p.amount), 0);
    const due = parseMoney(totals.total);
    if (Math.abs(paidSum - due) > 0.009) {
      throw new Error(
        `El cobro (${formatMoney(paidSum)}) no cubre el total (${totals.total}).`,
      );
    }

    const ticket: PosTicketResponse = {
      id: nextTicketId++,
      status: "PAID",
      lines,
      totals,
      payments,
      createdAt: new Date().toISOString(),
    };
    paidTickets.unshift(ticket);
    return { ...ticket, lines: ticket.lines.map((l) => ({ ...l })), payments: [...ticket.payments], totals: { ...ticket.totals } };
  },

  listRecentTickets: async (): Promise<PosTicketResponse[]> => {
    await delay(MOCK_LATENCY_MS);
    return paidTickets.map((t) => ({
      ...t,
      lines: t.lines.map((l) => ({ ...l })),
      payments: [...t.payments],
      totals: { ...t.totals },
    }));
  },
};
