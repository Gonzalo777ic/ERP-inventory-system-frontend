import axios from "axios";
import { cloneBoms, cloneManufacturingOrders } from "../../data/mrpFixtures";
import type {
  BomListQuery,
  BomResponse,
  ManufacturingOrderResponse,
  MoListQuery,
  MrpHubSummary,
  RecordComponentScrapRequest,
} from "../../types/inventory/mrp";

const MOCK_LATENCY_MS = 180;
const MRP_PATH = "/mrp";
const DEMO_ACTOR = "demo.ops";

let mockBoms: BomResponse[] = cloneBoms();
let mockOrders: ManufacturingOrderResponse[] = cloneManufacturingOrders();
let nextScrapId = 1000;

function inventoryBaseUrl(): string | null {
  const base = import.meta.env.VITE_INVENTORY_API_URL;
  if (!base || typeof base !== "string" || base.trim() === "") {
    return null;
  }
  return base.replace(/\/$/, "");
}

/**
 * Mock unless inventory API base is set and mock is explicitly disabled.
 */
function useMrpMock(): boolean {
  if (import.meta.env.VITE_MRP_USE_MOCK === "true") return true;
  if (import.meta.env.VITE_MRP_USE_MOCK === "false" && inventoryBaseUrl()) {
    return false;
  }
  return !inventoryBaseUrl();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mrpUrl(path = ""): string {
  const base = inventoryBaseUrl();
  if (!base) {
    throw new Error("VITE_INVENTORY_API_URL no configurada para MRP API.");
  }
  return `${base}${MRP_PATH}${path}`;
}

function matchesText(haystack: string, search?: string): boolean {
  if (!search?.trim()) return true;
  return haystack.toLowerCase().includes(search.trim().toLowerCase());
}

function cloneBom(b: BomResponse): BomResponse {
  return { ...b, components: b.components.map((c) => ({ ...c })) };
}

function cloneMo(mo: ManufacturingOrderResponse): ManufacturingOrderResponse {
  return {
    ...mo,
    components: mo.components.map((c) => ({ ...c })),
    scraps: mo.scraps.map((s) => ({ ...s })),
  };
}

function filterBoms(rows: BomResponse[], query: BomListQuery): BomResponse[] {
  return rows
    .filter((b) => (query.includeRetired ? true : b.status === "ACTIVE"))
    .filter((b) =>
      matchesText(
        [b.code, b.name, b.productSku, b.productName].join(" "),
        query.search,
      ),
    )
    .map(cloneBom)
    .sort((a, b) => a.code.localeCompare(b.code));
}

function filterOrders(
  rows: ManufacturingOrderResponse[],
  query: MoListQuery,
): ManufacturingOrderResponse[] {
  return rows
    .filter((mo) => {
      if (!query.status || query.status === "ALL") return true;
      if (query.status === "OPEN") {
        return (
          mo.status === "DRAFT" ||
          mo.status === "CONFIRMED" ||
          mo.status === "IN_PROGRESS"
        );
      }
      return mo.status === query.status;
    })
    .filter((mo) =>
      matchesText(
        [mo.name, mo.bomCode, mo.productSku, mo.productName, mo.warehouseCode].join(
          " ",
        ),
        query.search,
      ),
    )
    .map(cloneMo)
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
}

function summarize(
  boms: BomResponse[],
  orders: ManufacturingOrderResponse[],
): MrpHubSummary {
  return {
    bomActive: boms.filter((b) => b.status === "ACTIVE").length,
    bomRetired: boms.filter((b) => b.status === "RETIRED").length,
    moDraft: orders.filter((o) => o.status === "DRAFT").length,
    moOpen: orders.filter(
      (o) =>
        o.status === "DRAFT" ||
        o.status === "CONFIRMED" ||
        o.status === "IN_PROGRESS",
    ).length,
    moDone: orders.filter((o) => o.status === "DONE").length,
    moCancelled: orders.filter((o) => o.status === "CANCELLED").length,
    scrapEntries: orders.reduce((n, o) => n + o.scraps.length, 0),
  };
}

export const MrpService = {
  isMockMode: (): boolean => useMrpMock(),

  async getHubSummary(): Promise<MrpHubSummary> {
    if (!useMrpMock()) {
      const { data } = await axios.get<MrpHubSummary>(mrpUrl("/summary"));
      return data;
    }
    await delay(MOCK_LATENCY_MS);
    return summarize(mockBoms, mockOrders);
  },

  async listBoms(query: BomListQuery = {}): Promise<BomResponse[]> {
    if (!useMrpMock()) {
      const { data } = await axios.get<BomResponse[]>(mrpUrl("/boms"), {
        params: query,
      });
      return data;
    }
    await delay(MOCK_LATENCY_MS);
    return filterBoms(mockBoms, query);
  },

  async getBom(id: number): Promise<BomResponse> {
    if (!useMrpMock()) {
      const { data } = await axios.get<BomResponse>(mrpUrl(`/boms/${id}`));
      return data;
    }
    await delay(MOCK_LATENCY_MS);
    const found = mockBoms.find((b) => b.id === id);
    if (!found) throw new Error(`BOM ${id} no encontrado.`);
    return cloneBom(found);
  },

  async retireBom(id: number): Promise<BomResponse> {
    if (!useMrpMock()) {
      const { data } = await axios.post<BomResponse>(
        mrpUrl(`/boms/${id}/retire`),
      );
      return data;
    }
    await delay(MOCK_LATENCY_MS);
    const idx = mockBoms.findIndex((b) => b.id === id);
    if (idx < 0) throw new Error(`BOM ${id} no encontrado.`);
    const current = mockBoms[idx];
    if (current.status === "RETIRED") {
      throw new Error("La BOM ya está dada de baja.");
    }
    const retired: BomResponse = {
      ...current,
      status: "RETIRED",
      deletedAt: new Date().toISOString(),
      deletedBy: DEMO_ACTOR,
      updatedAt: new Date().toISOString(),
      components: current.components.map((c) => ({ ...c })),
    };
    mockBoms = mockBoms.map((b, i) => (i === idx ? retired : b));
    return cloneBom(retired);
  },

  async listOrders(query: MoListQuery = {}): Promise<ManufacturingOrderResponse[]> {
    if (!useMrpMock()) {
      const { data } = await axios.get<ManufacturingOrderResponse[]>(
        mrpUrl("/orders"),
        { params: query },
      );
      return data;
    }
    await delay(MOCK_LATENCY_MS);
    return filterOrders(mockOrders, query);
  },

  async getOrder(id: number): Promise<ManufacturingOrderResponse> {
    if (!useMrpMock()) {
      const { data } = await axios.get<ManufacturingOrderResponse>(
        mrpUrl(`/orders/${id}`),
      );
      return data;
    }
    await delay(MOCK_LATENCY_MS);
    const found = mockOrders.find((o) => o.id === id);
    if (!found) throw new Error(`Orden de fabricación ${id} no encontrada.`);
    return cloneMo(found);
  },

  async cancelOrder(id: number): Promise<ManufacturingOrderResponse> {
    if (!useMrpMock()) {
      const { data } = await axios.post<ManufacturingOrderResponse>(
        mrpUrl(`/orders/${id}/cancel`),
      );
      return data;
    }
    await delay(MOCK_LATENCY_MS);
    const idx = mockOrders.findIndex((o) => o.id === id);
    if (idx < 0) throw new Error(`Orden de fabricación ${id} no encontrada.`);
    const current = mockOrders[idx];
    if (current.status === "DONE" || current.status === "CANCELLED") {
      throw new Error("Solo se anulan órdenes abiertas (no hechas).");
    }
    const cancelled: ManufacturingOrderResponse = {
      ...cloneMo(current),
      status: "CANCELLED",
    };
    mockOrders = mockOrders.map((o, i) => (i === idx ? cancelled : o));
    return cloneMo(cancelled);
  },

  /**
   * Documented component scrap on an in-progress MO.
   * Creates a scrap entry (libro); does not delete stock rows.
   */
  async recordComponentScrap(
    orderId: number,
    request: RecordComponentScrapRequest,
  ): Promise<ManufacturingOrderResponse> {
    if (!useMrpMock()) {
      const { data } = await axios.post<ManufacturingOrderResponse>(
        mrpUrl(`/orders/${orderId}/scraps`),
        request,
      );
      return data;
    }
    await delay(MOCK_LATENCY_MS);
    const idx = mockOrders.findIndex((o) => o.id === orderId);
    if (idx < 0) throw new Error(`Orden de fabricación ${orderId} no encontrada.`);
    const current = mockOrders[idx];
    if (current.status !== "IN_PROGRESS") {
      throw new Error("El scrap documentado solo aplica en órdenes en progreso.");
    }
    if (!(request.qty > 0)) {
      throw new Error("La cantidad de scrap debe ser positiva.");
    }
    const reason = request.reason.trim();
    if (!reason) {
      throw new Error("Indica el motivo del scrap.");
    }
    const line = current.components.find((c) => c.productId === request.productId);
    if (!line) {
      throw new Error("El componente no pertenece a esta orden.");
    }
    const entry = {
      id: nextScrapId++,
      manufacturingOrderId: orderId,
      productId: line.productId,
      productSku: line.productSku,
      productName: line.productName,
      qty: request.qty,
      uom: line.uom,
      reason,
      recordedAt: new Date().toISOString(),
      recordedBy: DEMO_ACTOR,
    };
    const updated: ManufacturingOrderResponse = {
      ...cloneMo(current),
      components: current.components.map((c) =>
        c.productId === request.productId
          ? { ...c, scrapQty: c.scrapQty + request.qty }
          : { ...c },
      ),
      scraps: [...current.scraps.map((s) => ({ ...s })), entry],
    };
    mockOrders = mockOrders.map((o, i) => (i === idx ? updated : o));
    return cloneMo(updated);
  },
};
