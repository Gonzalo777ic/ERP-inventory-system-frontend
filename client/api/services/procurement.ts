import { http, tryRequest } from "../http";
import {
  cancelMockPurchaseOrder,
  changeMockQuotationStatus,
  convertMockQuotationToOrder,
  createMockPurchaseOrder,
  createMockQuotation,
  getMockPurchaseOrder,
  getMockQuotation,
  getMockReceiptByOrder,
  linkMockQuotationProduct,
  listMockPurchaseOrders,
  listMockQuotations,
  listMockReceipts,
  mockPipelineCounts,
  purchaseMockDelay,
  receiveMockPurchaseOrder,
  transitionMockPurchaseOrder,
  updateMockPurchaseOrder,
  updateMockQuotation,
} from "../../data/purchaseStore";
import type {
  OrderStatus,
  PurchaseOrder,
  PurchaseOrderPayload,
} from "../../types/inventory/orders";
import type {
  ProcurementPipelineCounts,
  PurchaseReceipt,
} from "../../types/inventory/procurement";
import type {
  Quotation,
  QuotationPayload,
} from "../../types/inventory/quotations";

const ORDERS_URL = "/v1/purchase-orders";
const QUOTATIONS_URL = "/v1/quotations";

function forceMock(): boolean {
  if (import.meta.env.VITE_PURCHASES_USE_MOCK === "true") return true;
  if (import.meta.env.VITE_PURCHASING_USE_MOCK === "true") return true;
  return false;
}

/**
 * Purchasing client for RFQ → OC → recepción.
 * Tries inventory purchasing endpoints; falls back to local mock store.
 */
export const ProcurementService = {
  isMockMode(): boolean {
    return forceMock();
  },

  /** Alias used by older hub code. */
  async getFlowSummary(): Promise<ProcurementPipelineCounts> {
    return this.pipelineCounts();
  },

  async pipelineCounts(): Promise<ProcurementPipelineCounts> {
    if (forceMock()) {
      await purchaseMockDelay();
      return mockPipelineCounts();
    }
    return tryRequest(
      async () => {
        const [ordersRes, quotationsRes] = await Promise.all([
          http.get<PurchaseOrder[]>(ORDERS_URL),
          http.get<Quotation[]>(QUOTATIONS_URL),
        ]);
        const orders = ordersRes.data;
        const quotations = quotationsRes.data;
        const counts: ProcurementPipelineCounts = {
          rfqOpen: quotations.filter((q) =>
            ["BORRADOR", "ENVIADO", "RESPONDIDO", "APROBADO"].includes(q.status),
          ).length,
          ordersOpen: orders.filter((o) =>
            ["BORRADOR", "PENDIENTE", "CONFIRMADO"].includes(o.status),
          ).length,
          toReceive: orders.filter((o) => o.status === "CONFIRMADO").length,
          closed: orders.filter((o) =>
            ["COMPLETO", "CANCELADO", "RECHAZADO"].includes(o.status),
          ).length,
        };
        return { data: counts };
      },
      async () => mockPipelineCounts(),
    );
  },

  async listOrders(filterSupplierId?: number): Promise<PurchaseOrder[]> {
    if (forceMock()) {
      await purchaseMockDelay();
      return listMockPurchaseOrders(filterSupplierId);
    }
    return tryRequest(
      async () => {
        const query = filterSupplierId
          ? `?filterSupplierId=${filterSupplierId}`
          : "";
        return http.get<PurchaseOrder[]>(`${ORDERS_URL}${query}`);
      },
      async () => listMockPurchaseOrders(filterSupplierId),
    );
  },

  async getOrder(id: number): Promise<PurchaseOrder> {
    if (forceMock()) {
      await purchaseMockDelay();
      return getMockPurchaseOrder(id);
    }
    return tryRequest(
      async () => http.get<PurchaseOrder>(`${ORDERS_URL}/${id}`),
      async () => getMockPurchaseOrder(id),
    );
  },

  async createOrder(payload: PurchaseOrderPayload): Promise<PurchaseOrder> {
    if (forceMock()) {
      await purchaseMockDelay();
      return createMockPurchaseOrder(payload);
    }
    return tryRequest(
      async () => http.post<PurchaseOrder>(ORDERS_URL, payload),
      async () => createMockPurchaseOrder(payload),
    );
  },

  async updateOrder(
    id: number,
    payload: PurchaseOrderPayload,
  ): Promise<PurchaseOrder> {
    if (forceMock()) {
      await purchaseMockDelay();
      return updateMockPurchaseOrder(id, payload);
    }
    return tryRequest(
      async () => http.put<PurchaseOrder>(`${ORDERS_URL}/${id}`, payload),
      async () => updateMockPurchaseOrder(id, payload),
    );
  },

  async updateOrderStatus(
    id: number,
    status: OrderStatus,
  ): Promise<PurchaseOrder> {
    if (forceMock()) {
      await purchaseMockDelay();
      return transitionMockPurchaseOrder(id, status);
    }
    return tryRequest(
      async () =>
        http.patch<PurchaseOrder>(`${ORDERS_URL}/${id}/status`, { status }),
      async () => transitionMockPurchaseOrder(id, status),
    );
  },

  /** Completes a confirmed OC via reception (book action, not soft-delete). */
  async receiveOrder(id: number): Promise<PurchaseOrder> {
    if (forceMock()) {
      await purchaseMockDelay();
      return receiveMockPurchaseOrder(id);
    }
    return tryRequest(
      async () =>
        http.patch<PurchaseOrder>(`${ORDERS_URL}/${id}/status`, {
          status: "COMPLETO",
        }),
      async () => receiveMockPurchaseOrder(id),
    );
  },

  async cancelOrder(id: number): Promise<PurchaseOrder> {
    if (forceMock()) {
      await purchaseMockDelay();
      return cancelMockPurchaseOrder(id);
    }
    return tryRequest(
      async () =>
        http.patch<PurchaseOrder>(`${ORDERS_URL}/${id}/status`, {
          status: "CANCELADO",
        }),
      async () => cancelMockPurchaseOrder(id),
    );
  },

  async listReceipts(): Promise<PurchaseReceipt[]> {
    if (forceMock()) {
      await purchaseMockDelay();
      return listMockReceipts();
    }
    // No dedicated receipts list endpoint yet — derive from mock / local store.
    return tryRequest(
      async () => {
        const orders = (await http.get<PurchaseOrder[]>(ORDERS_URL)).data;
        const derived: PurchaseReceipt[] = orders
          .filter((o) => o.status === "COMPLETO")
          .map((o) => ({
            id: o.id,
            purchaseOrderId: o.id,
            receivedAt: `${o.deliveryDate}T12:00:00.000Z`,
            warehouseName: "Almacén Principal",
            lineCount: o.details?.length ?? 0,
            status: "POSTED" as const,
          }));
        return { data: derived };
      },
      async () => listMockReceipts(),
    );
  },

  async getReceiptForOrder(
    orderId: number,
  ): Promise<PurchaseReceipt | undefined> {
    if (forceMock()) {
      await purchaseMockDelay();
      return getMockReceiptByOrder(orderId);
    }
    const all = await this.listReceipts();
    return all.find((r) => r.purchaseOrderId === orderId);
  },

  async listQuotations(supplierId?: number): Promise<Quotation[]> {
    if (forceMock()) {
      await purchaseMockDelay();
      return listMockQuotations(supplierId);
    }
    return tryRequest(
      async () =>
        http.get<Quotation[]>(QUOTATIONS_URL, {
          params: supplierId != null ? { supplierId } : undefined,
        }),
      async () => listMockQuotations(supplierId),
    );
  },

  async getQuotation(id: number): Promise<Quotation> {
    if (forceMock()) {
      await purchaseMockDelay();
      return getMockQuotation(id);
    }
    return tryRequest(
      async () => http.get<Quotation>(`${QUOTATIONS_URL}/${id}`),
      async () => getMockQuotation(id),
    );
  },

  async createQuotation(payload: QuotationPayload): Promise<Quotation> {
    if (forceMock()) {
      await purchaseMockDelay();
      return createMockQuotation(payload);
    }
    return tryRequest(
      async () => {
        const body = mapQuotationBody(payload);
        return http.post<Quotation>(QUOTATIONS_URL, body);
      },
      async () => createMockQuotation(payload),
    );
  },

  async updateQuotation(
    id: number,
    payload: QuotationPayload,
  ): Promise<Quotation> {
    if (forceMock()) {
      await purchaseMockDelay();
      return updateMockQuotation(id, payload);
    }
    return tryRequest(
      async () => {
        const body = mapQuotationBody(payload);
        return http.put<Quotation>(`${QUOTATIONS_URL}/${id}`, body);
      },
      async () => updateMockQuotation(id, payload),
    );
  },

  async changeQuotationStatus(id: number, status: string): Promise<Quotation> {
    if (forceMock()) {
      await purchaseMockDelay();
      return changeMockQuotationStatus(id, status);
    }
    return tryRequest(
      async () =>
        http.put<Quotation>(`${QUOTATIONS_URL}/${id}/status`, null, {
          params: { status },
        }),
      async () => changeMockQuotationStatus(id, status),
    );
  },

  async convertQuotationToOrder(id: number): Promise<PurchaseOrder> {
    if (forceMock()) {
      await purchaseMockDelay();
      return convertMockQuotationToOrder(id);
    }
    return tryRequest(
      async () =>
        http.post<PurchaseOrder>(`${QUOTATIONS_URL}/${id}/convert-to-order`),
      async () => convertMockQuotationToOrder(id),
    );
  },

  async linkQuotationProduct(
    quotationId: number,
    detailId: number,
    productId: number,
  ): Promise<Quotation> {
    if (forceMock()) {
      await purchaseMockDelay();
      return linkMockQuotationProduct(quotationId, detailId, productId);
    }
    return tryRequest(
      async () =>
        http.put<Quotation>(
          `${QUOTATIONS_URL}/${quotationId}/details/${detailId}/link-product/${productId}`,
        ),
      async () =>
        linkMockQuotationProduct(quotationId, detailId, productId),
    );
  },
};

function mapQuotationBody(payload: QuotationPayload) {
  return {
    requestDate: payload.requestDate,
    status: payload.status,
    notes: payload.notes,
    supplier: { id: payload.supplierId },
    details: payload.details.map((d) => ({
      productName: d.productName,
      quantity: d.quantity,
      quotedPrice: d.quotedPrice,
      skuSuggestion: d.skuSuggestion,
      product: d.productId ? { id: d.productId } : null,
    })),
  };
}
