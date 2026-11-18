import { http } from "../http";
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

type PickingWire = {
  id: number;
  code?: string;
  operationType: PickingResponse["operationType"];
  status: PickingResponse["status"];
  sourceWarehouseId?: number | null;
  destinationWarehouseId?: number | null;
  createdAt?: string;
  confirmedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  lines?: Array<{
    id: number;
    productId: number;
    quantity?: number;
    lotNumber?: string | null;
    reserved?: boolean;
  }>;
};

type CycleCountWire = {
  id: number;
  code?: string;
  warehouseId?: number | null;
  status: CycleCountResponse["status"];
  createdAt?: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  lines?: Array<{
    id: number;
    productId: number;
    systemQuantity?: number;
    countedQuantity?: number | null;
    adjustmentDelta?: number | null;
  }>;
};

function placeCode(id: number | null | undefined): string {
  return id == null ? "—" : String(id);
}

function toPicking(raw: PickingWire): PickingResponse {
  const lines = (raw.lines ?? []).map((line) => ({
    id: line.id,
    productId: line.productId,
    productSku: "",
    productName: "",
    lotNumber: line.lotNumber ?? null,
    demandQty: line.quantity ?? 0,
    reservedQty: line.reserved ? line.quantity ?? 0 : 0,
    doneQty: raw.status === "DONE" ? line.quantity ?? 0 : 0,
    uom: "",
  }));
  const totalDemandQty = lines.reduce((sum, line) => sum + line.demandQty, 0);
  const totalDoneQty = lines.reduce((sum, line) => sum + line.doneQty, 0);
  return {
    id: raw.id,
    name: raw.code ?? String(raw.id),
    operationType: raw.operationType,
    status: raw.status,
    sourceLocationCode: placeCode(raw.sourceWarehouseId),
    destLocationCode: placeCode(raw.destinationWarehouseId),
    warehouseCode: placeCode(raw.sourceWarehouseId),
    scheduledAt: raw.createdAt ?? "",
    confirmedAt: raw.confirmedAt ?? null,
    doneAt: raw.completedAt ?? null,
    cancelledAt: raw.cancelledAt ?? null,
    lines,
    totalDemandQty,
    totalDoneQty,
  };
}

function toCycleCount(raw: CycleCountWire): CycleCountResponse {
  const lines = (raw.lines ?? []).map((line) => ({
    id: line.id,
    productId: line.productId,
    productSku: "",
    productName: "",
    lotNumber: null,
    theoreticalQty: line.systemQuantity ?? 0,
    countedQty: line.countedQuantity ?? null,
    differenceQty: line.adjustmentDelta ?? null,
    uom: "",
  }));
  return {
    id: raw.id,
    name: raw.code ?? String(raw.id),
    warehouseCode: placeCode(raw.warehouseId),
    locationCode: "—",
    status: raw.status,
    createdAt: raw.createdAt ?? "",
    completedAt: raw.completedAt ?? null,
    cancelledAt: raw.cancelledAt ?? null,
    lines,
    lineCount: lines.length,
    varianceLineCount: lines.filter((line) => (line.differenceQty ?? 0) !== 0).length,
  };
}

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
    const response = await http.get<StockDashboardSummary>(
      "/inventory/stock-dashboard",
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
    const response = await http.get<PickingWire[]>("/inventory/pickings");
    return filterPickings(response.data.map(toPicking), query);
  },

  getPicking: async (id: number): Promise<PickingResponse> => {
    if (useStockMock()) {
      await delay(MOCK_LATENCY_MS);
      const found = mockPickings.find((p) => p.id === id);
      if (!found) throw new Error(`Picking ${id} no encontrado.`);
      return { ...found, lines: found.lines.map((l) => ({ ...l })) };
    }
    const response = await http.get<PickingWire>(`/inventory/pickings/${id}`);
    return toPicking(response.data);
  },

  /**
   * Cancel / reverse a picking document. Never physical delete.
   * API: POST /inventory/pickings/{id}/cancel
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
    const response = await http.post<PickingWire>(
      `/inventory/pickings/${id}/cancel`,
    );
    return toPicking(response.data);
  },

  listCycleCounts: async (
    query: CycleCountListQuery = {},
  ): Promise<CycleCountResponse[]> => {
    if (useStockMock()) {
      await delay(MOCK_LATENCY_MS);
      return filterCycleCounts(mockCycleCounts, query);
    }
    const response = await http.get<CycleCountWire[]>("/inventory/cycle-counts");
    return filterCycleCounts(response.data.map(toCycleCount), query);
  },

  /**
   * Cancel an open cycle count. Never physical delete.
   * API: POST /inventory/cycle-counts/{id}/cancel
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
    const response = await http.post<CycleCountWire>(
      `/inventory/cycle-counts/${id}/cancel`,
    );
    return toCycleCount(response.data);
  },

  listAdjustmentEntryPoints: async (): Promise<
    StockAdjustmentEntryPoint[]
  > => {
    if (useStockMock()) {
      await delay(MOCK_LATENCY_MS);
      return STOCK_ADJUSTMENT_ENTRY_POINTS.map((e) => ({ ...e }));
    }
    return STOCK_ADJUSTMENT_ENTRY_POINTS.map((entry) => ({ ...entry }));
  },

  /** Test/demo helper — resets in-memory fixtures. */
  resetMockStore: (): void => {
    if (!useStockMock()) return;
    mockPickings = clonePickings();
    mockCycleCounts = cloneCycleCounts();
  },
};
