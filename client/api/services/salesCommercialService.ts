import { httpStore } from "../httpStore";
import {
  SALES_ORDER_FIXTURES,
  SALES_QUOTATION_FIXTURES,
} from "../../data/salesCommercialFixtures";
import type {
  SalesOrderDto,
  SalesQuotationDto,
} from "../../types/salesCommercial";

const MOCK_LATENCY_MS = 160;
const SALES_COMMERCIAL_STALE_MS = 60_000;

export const salesCommercialQueryKeys = {
  all: ["sales-commercial"] as const,
  quotations: () => [...salesCommercialQueryKeys.all, "quotations"] as const,
  quotation: (id: number) =>
    [...salesCommercialQueryKeys.quotations(), id] as const,
  orders: () => [...salesCommercialQueryKeys.all, "orders"] as const,
  order: (id: number) => [...salesCommercialQueryKeys.orders(), id] as const,
};

export { SALES_COMMERCIAL_STALE_MS };

function storeApiBase(): string | null {
  const base = import.meta.env.VITE_STORE_API_URL;
  if (!base || typeof base !== "string" || base.trim() === "") {
    return null;
  }
  return base.replace(/\/$/, "");
}

function commercialUrl(suffix: string): string {
  const base = storeApiBase();
  if (!base) {
    throw new Error("VITE_STORE_API_URL no configurada.");
  }
  return `${base}/sales/commercial${suffix}`;
}

/** Demo default: fixtures when no store URL, or when VITE_SALES_COMMERCIAL_USE_MOCK=true. */
export function salesCommercialUseMock(): boolean {
  if (import.meta.env.VITE_SALES_COMMERCIAL_USE_MOCK === "true") return true;
  if (
    import.meta.env.VITE_SALES_COMMERCIAL_USE_MOCK === "false" &&
    storeApiBase()
  ) {
    return false;
  }
  return !storeApiBase();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cloneQuotation(q: SalesQuotationDto): SalesQuotationDto {
  return {
    ...q,
    total: { ...q.total },
    lines: q.lines.map((l) => ({
      ...l,
      unitPrice: { ...l.unitPrice },
      lineTotal: { ...l.lineTotal },
    })),
  };
}

function cloneOrder(o: SalesOrderDto): SalesOrderDto {
  return {
    ...o,
    total: { ...o.total },
    lines: o.lines.map((l) => ({
      ...l,
      unitPrice: { ...l.unitPrice },
      lineTotal: { ...l.lineTotal },
    })),
  };
}

export const SalesCommercialService = {
  isMockMode: salesCommercialUseMock,

  listQuotations: async (): Promise<SalesQuotationDto[]> => {
    if (salesCommercialUseMock()) {
      await delay(MOCK_LATENCY_MS);
      return SALES_QUOTATION_FIXTURES.map(cloneQuotation);
    }
    try {
      const { data } = await httpStore.get<SalesQuotationDto[]>(
        commercialUrl("/quotations"),
      );
      return data;
    } catch {
      await delay(MOCK_LATENCY_MS);
      return SALES_QUOTATION_FIXTURES.map(cloneQuotation);
    }
  },

  getQuotation: async (id: number): Promise<SalesQuotationDto> => {
    if (salesCommercialUseMock()) {
      await delay(MOCK_LATENCY_MS);
      const found = SALES_QUOTATION_FIXTURES.find((q) => q.id === id);
      if (!found) {
        throw new Error("Cotización no encontrada.");
      }
      return cloneQuotation(found);
    }
    try {
      const { data } = await httpStore.get<SalesQuotationDto>(
        commercialUrl(`/quotations/${id}`),
      );
      return data;
    } catch {
      await delay(MOCK_LATENCY_MS);
      const found = SALES_QUOTATION_FIXTURES.find((q) => q.id === id);
      if (!found) {
        throw new Error("Cotización no encontrada.");
      }
      return cloneQuotation(found);
    }
  },

  listOrders: async (): Promise<SalesOrderDto[]> => {
    if (salesCommercialUseMock()) {
      await delay(MOCK_LATENCY_MS);
      return SALES_ORDER_FIXTURES.map(cloneOrder);
    }
    try {
      const { data } = await httpStore.get<SalesOrderDto[]>(
        commercialUrl("/orders"),
      );
      return data;
    } catch {
      await delay(MOCK_LATENCY_MS);
      return SALES_ORDER_FIXTURES.map(cloneOrder);
    }
  },

  getOrder: async (id: number): Promise<SalesOrderDto> => {
    if (salesCommercialUseMock()) {
      await delay(MOCK_LATENCY_MS);
      const found = SALES_ORDER_FIXTURES.find((o) => o.id === id);
      if (!found) {
        throw new Error("Pedido no encontrado.");
      }
      return cloneOrder(found);
    }
    try {
      const { data } = await httpStore.get<SalesOrderDto>(
        commercialUrl(`/orders/${id}`),
      );
      return data;
    } catch {
      await delay(MOCK_LATENCY_MS);
      const found = SALES_ORDER_FIXTURES.find((o) => o.id === id);
      if (!found) {
        throw new Error("Pedido no encontrado.");
      }
      return cloneOrder(found);
    }
  },
};
