import axios from "axios";
import {
  cloneCycleCounts,
  clonePickings,
  cloneStockDashboard,
  STOCK_ADJUSTMENT_ENTRY_POINTS,
} from "../../data/stockFixtures";
import type {
  CycleCountListQuery,
  CycleCountResponse,
  PickingListQuery,
  PickingResponse,
  StockAdjustmentEntryPoint,
  StockDashboardSummary,
} from "../../types/inventory/stockOps";

const MOCK_LATENCY_MS = 180;
const STOCK_PATH = "/stock";

let mockPickings: PickingResponse[] = clonePickings();
let mockCycleCounts: CycleCountResponse[] = cloneCycleCounts();

function inventoryBaseUrl(): string | null {
  const base = import.meta.env.VITE_INVENTORY_API_URL;
  if (!base || typeof base !== "string" || base.trim() === "") {
    return null;
  }
  return base.replace(/\/$/, "");
}

/**
 * Mock unless an inventory API base is set and mock is explicitly disabled.
 */
function useStockMock(): boolean {
  if (import.meta.env.VITE_STOCK_USE_MOCK === "true") return true;
  if (import.meta.env.VITE_STOCK_USE_MOCK === "false" && inventoryBaseUrl()) {
    return false;
  }
  return !inventoryBaseUrl();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stockUrl(path = ""): string {
  const base = inventoryBaseUrl();
  if (!base) {
    throw new Error("VITE_INVENTORY_API_URL no configurada para Stock API.");
  }
  return `${base}${STOCK_PATH}${path}`;
}

function matchesText(haystack: string, search?: string): boolean {
  if (!search?.trim()) return true;
  return haystack.toLowerCase().includes(search.trim().toLowerCase());
}

function filterPickings(
  rows: PickingResponse[],
  query: PickingListQuery,
): PickingResponse[] {
  return rows
    .filter((p) => {
      if (query.status === "OPEN") {
        return p.status === "DRAFT" || p.status === "CONFIRMED";
      }
      if (query.status) return p.status === query.status;
      return true;
    })
    .filter((p) =>
      matchesText(
        [
          p.name,
          p.warehouseCode,
          p.operationType,
          p.sourceLocationCode,
          p.destLocationCode,
          ...p.lines.map((l) => `${l.productSku} ${l.productName}`),
        ].join(" "),
        query.search,
      ),
    )
    .map((p) => ({ ...p, lines: p.lines.map((l) => ({ ...l })) }))
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
}

function filterCycleCounts(
  rows: CycleCountResponse[],
  query: CycleCountListQuery,
): CycleCountResponse[] {
  return rows
    .filter((c) => {
      if (query.status === "OPEN") {
        return c.status === "DRAFT" || c.status === "IN_PROGRESS";
      }
      if (query.status) return c.status === query.status;
      return true;
    })
    .filter((c) =>
      matchesText(
        [
          c.name,
          c.warehouseCode,
          c.locationCode,
          ...c.lines.map((l) => `${l.productSku} ${l.productName}`),
        ].join(" "),
        query.search,
      ),
    )
    .map((c) => ({ ...c, lines: c.lines.map((l) => ({ ...l })) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

const httpStock = axios.create();

export const StockOpsService = {
  isMockMode: (): boolean => useStockMock(),

  getDashboard: async (): Promise<StockDashboardSummary> => {
    if (useStockMock()) {
      await delay(MOCK_LATENCY_MS);
      const openPickingCount = mockPickings.filter(
        (p) => p.status === "DRAFT" || p.status === "CONFIRMED",
      ).length;
      const pendingCycleCountCount = mockCycleCounts.filter(
        (c) => c.status === "DRAFT" || c.status === "IN_PROGRESS",
      ).length;
      const dashboard = cloneStockDashboard();
      return {
        ...dashboard,
        openPickingCount,
        pendingCycleCountCount,
      };
    }
    const response = await httpStock.get<StockDashboardSummary>(
      stockUrl("/dashboard"),
    );
    return response.data;
  },

  listPickings: async (
    query: PickingListQuery = {},
  ): Promise<PickingResponse[]> => {
    if (useStockMock()) {
      await delay(MOCK_LATENCY_MS);
      return filterPickings(mockPickings, query);
    }
    const response = await httpStock.get<PickingResponse[]>(
      stockUrl("/pickings"),
      {
        params: {
          search: query.search || undefined,
          status: query.status || undefined,
        },
      },
    );
    return response.data;
  },

  getPicking: async (id: number): Promise<PickingResponse> => {
    if (useStockMock()) {
      await delay(MOCK_LATENCY_MS);
      const found = mockPickings.find((p) => p.id === id);
      if (!found) throw new Error(`Picking ${id} no encontrado.`);
      return { ...found, lines: found.lines.map((l) => ({ ...l })) };
    }
    const response = await httpStock.get<PickingResponse>(
      stockUrl(`/pickings/${id}`),
    );
    return response.data;
  },

  /**
   * Cancel / reverse a picking document. Never physical delete.
   * API: POST /stock/pickings/{id}/cancel
   */
  cancelPicking: async (id: number): Promise<PickingResponse> => {
    if (useStockMock()) {
      await delay(MOCK_LATENCY_MS);
      const current = mockPickings.find((p) => p.id === id);
      if (!current) throw new Error(`Picking ${id} no encontrado.`);
      if (current.status === "DONE") {
        throw new Error("Un picking hecho no se anula aquí; use reverso.");
      }
      if (current.status === "CANCELLED") {
        return { ...current, lines: current.lines.map((l) => ({ ...l })) };
      }
      const cancelled: PickingResponse = {
        ...current,
        status: "CANCELLED",
        cancelledAt: new Date().toISOString(),
        lines: current.lines.map((l) => ({
          ...l,
          reservedQty: 0,
        })),
      };
      mockPickings = mockPickings.map((p) => (p.id === id ? cancelled : p));
      return { ...cancelled, lines: cancelled.lines.map((l) => ({ ...l })) };
    }
    const response = await httpStock.post<PickingResponse>(
      stockUrl(`/pickings/${id}/cancel`),
    );
    return response.data;
  },

  listCycleCounts: async (
    query: CycleCountListQuery = {},
  ): Promise<CycleCountResponse[]> => {
    if (useStockMock()) {
      await delay(MOCK_LATENCY_MS);
      return filterCycleCounts(mockCycleCounts, query);
    }
    const response = await httpStock.get<CycleCountResponse[]>(
      stockUrl("/cycle-counts"),
      {
        params: {
          search: query.search || undefined,
          status: query.status || undefined,
        },
      },
    );
    return response.data;
  },

  /**
   * Cancel an open cycle count. Never physical delete.
   * API: POST /stock/cycle-counts/{id}/cancel
   */
  cancelCycleCount: async (id: number): Promise<CycleCountResponse> => {
    if (useStockMock()) {
      await delay(MOCK_LATENCY_MS);
      const current = mockCycleCounts.find((c) => c.id === id);
      if (!current) throw new Error(`Conteo ${id} no encontrado.`);
      if (current.status === "DONE") {
        throw new Error(
          "Un conteo hecho no se anula; las diferencias ya son movimientos del libro.",
        );
      }
      if (current.status === "CANCELLED") {
        return { ...current, lines: current.lines.map((l) => ({ ...l })) };
      }
      const cancelled: CycleCountResponse = {
        ...current,
        status: "CANCELLED",
        cancelledAt: new Date().toISOString(),
      };
      mockCycleCounts = mockCycleCounts.map((c) =>
        c.id === id ? cancelled : c,
      );
      return { ...cancelled, lines: cancelled.lines.map((l) => ({ ...l })) };
    }
    const response = await httpStock.post<CycleCountResponse>(
      stockUrl(`/cycle-counts/${id}/cancel`),
    );
    return response.data;
  },

  listAdjustmentEntryPoints: async (): Promise<
    StockAdjustmentEntryPoint[]
  > => {
    if (useStockMock()) {
      await delay(MOCK_LATENCY_MS);
      return STOCK_ADJUSTMENT_ENTRY_POINTS.map((e) => ({ ...e }));
    }
    const response = await httpStock.get<StockAdjustmentEntryPoint[]>(
      stockUrl("/adjustment-entry-points"),
    );
    return response.data;
  },

  /** Test/demo helper — resets in-memory fixtures. */
  resetMockStore: (): void => {
    if (!useStockMock()) return;
    mockPickings = clonePickings();
    mockCycleCounts = cloneCycleCounts();
  },
};
