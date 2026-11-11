import type {
  OrderStatus,
  PurchaseOrder,
  PurchaseOrderPayload,
} from "../types/inventory/orders";
import type { PurchaseReceipt } from "../types/inventory/procurement";
import type { Quotation, QuotationPayload } from "../types/inventory/quotations";
import {
  PURCHASE_ORDER_FIXTURES,
  PURCHASE_RECEIPT_FIXTURES,
  PURCHASE_RFQ_FIXTURES,
} from "./purchaseFixtures";

const MAIN_WAREHOUSE_NAME = "Almacén Principal";
const MOCK_LATENCY_MS = 160;

let quotations: Quotation[] = structuredClone(PURCHASE_RFQ_FIXTURES);
let orders: PurchaseOrder[] = structuredClone(PURCHASE_ORDER_FIXTURES);
let receipts: PurchaseReceipt[] = structuredClone(PURCHASE_RECEIPT_FIXTURES);

let nextQuotationId = Math.max(0, ...quotations.map((q) => q.id)) + 1;
let nextOrderId = Math.max(0, ...orders.map((o) => o.id)) + 1;
let nextReceiptId = Math.max(0, ...receipts.map((r) => r.id)) + 1;
let nextDetailId = 90_000;

export function purchaseMockDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}

function cloneOrders(): PurchaseOrder[] {
  return structuredClone(orders);
}

function cloneQuotations(): Quotation[] {
  return structuredClone(quotations);
}

function findOrder(id: number): PurchaseOrder {
  const found = orders.find((o) => o.id === id);
  if (!found) throw new Error(`Orden OC-${id} no encontrada`);
  return found;
}

function findQuotation(id: number): Quotation {
  const found = quotations.find((q) => q.id === id);
  if (!found) throw new Error(`Cotización #${id} no encontrada`);
  return found;
}

function recalculate(order: PurchaseOrder): void {
  order.totalAmount = order.details.reduce(
    (sum, line) => sum + line.quantity * line.unitCost,
    0,
  );
}

export function listMockPurchaseOrders(filterSupplierId?: number): PurchaseOrder[] {
  const all = cloneOrders();
  if (filterSupplierId == null) return all;
  return all.filter((o) => o.supplier.id === filterSupplierId);
}

export function getMockPurchaseOrder(id: number): PurchaseOrder {
  return structuredClone(findOrder(id));
}

export function createMockPurchaseOrder(
  payload: PurchaseOrderPayload,
): PurchaseOrder {
  const id = nextOrderId++;
  const created: PurchaseOrder = {
    id,
    supplier: {
      id: payload.supplier.id,
      name: `Proveedor #${payload.supplier.id}`,
      taxId: "",
      email: "",
      phone: "",
      address: "",
      contactName: "",
    },
    orderDate: payload.orderDate,
    deliveryDate: payload.deliveryDate,
    totalAmount: 0,
    status: payload.status || "BORRADOR",
    details: payload.details.map((d) => ({
      id: nextDetailId++,
      purchaseOrderId: id,
      product: {
        id: d.product.id,
        name: `Producto #${d.product.id}`,
        sku: `SKU-${d.product.id}`,
        brandId: 0,
        categoryId: 0,
        unitOfMeasureId: 0,
        price: 0,
        minStockThreshold: 0,
      },
      quantity: d.quantity,
      unitCost: d.unitCost,
    })),
  };
  recalculate(created);
  orders = [created, ...orders];
  return structuredClone(created);
}

export function updateMockPurchaseOrder(
  id: number,
  payload: PurchaseOrderPayload,
): PurchaseOrder {
  const order = findOrder(id);
  if (order.status === "COMPLETO" || order.status === "CANCELADO") {
    throw new Error("No se puede editar una orden finalizada");
  }
  order.orderDate = payload.orderDate;
  order.deliveryDate = payload.deliveryDate;
  order.supplier = { ...order.supplier, id: payload.supplier.id };
  order.details = payload.details.map((d) => ({
    id: nextDetailId++,
    purchaseOrderId: id,
    product: {
      id: d.product.id,
      name: `Producto #${d.product.id}`,
      sku: `SKU-${d.product.id}`,
      brandId: 0,
      categoryId: 0,
      unitOfMeasureId: 0,
      price: 0,
      minStockThreshold: 0,
    },
    quantity: d.quantity,
    unitCost: d.unitCost,
  }));
  recalculate(order);
  return structuredClone(order);
}

export function transitionMockPurchaseOrder(
  id: number,
  status: OrderStatus,
  supplierActor = false,
): PurchaseOrder {
  if (status === "COMPLETO") {
    return receiveMockPurchaseOrder(id);
  }
  const order = findOrder(id);
  if (supplierActor) {
    if (order.status !== "PENDIENTE") {
      throw new Error("El proveedor solo responde órdenes pendientes");
    }
    if (status !== "CONFIRMADO" && status !== "RECHAZADO") {
      throw new Error("El proveedor solo puede confirmar o rechazar");
    }
  } else if (status === "CANCELADO") {
    if (order.status === "COMPLETO") {
      throw new Error("No se puede cancelar una orden ya recibida");
    }
  }
  order.status = status;
  return structuredClone(order);
}

export function receiveMockPurchaseOrder(id: number): PurchaseOrder {
  const order = findOrder(id);
  if (order.status !== "CONFIRMADO") {
    throw new Error("Solo se recepciona una orden confirmada");
  }
  order.status = "COMPLETO";
  const receipt: PurchaseReceipt = {
    id: nextReceiptId++,
    purchaseOrderId: id,
    receivedAt: new Date().toISOString(),
    warehouseName: MAIN_WAREHOUSE_NAME,
    lineCount: order.details.length,
    status: "POSTED",
  };
  receipts = [receipt, ...receipts];
  return structuredClone(order);
}

export function cancelMockPurchaseOrder(id: number): PurchaseOrder {
  return transitionMockPurchaseOrder(id, "CANCELADO");
}

export function listMockReceipts(): PurchaseReceipt[] {
  return structuredClone(receipts);
}

export function getMockReceiptByOrder(orderId: number): PurchaseReceipt | undefined {
  return structuredClone(receipts.find((r) => r.purchaseOrderId === orderId));
}

export function listMockQuotations(supplierId?: number): Quotation[] {
  const all = cloneQuotations();
  if (supplierId == null) return all;
  return all.filter((q) => q.supplier.id === supplierId);
}

export function getMockQuotation(id: number): Quotation {
  return structuredClone(findQuotation(id));
}

export function createMockQuotation(payload: QuotationPayload): Quotation {
  const id = nextQuotationId++;
  const created: Quotation = {
    id,
    supplier: {
      id: payload.supplierId,
      name: `Proveedor #${payload.supplierId}`,
      taxId: "",
      email: "",
      phone: "",
      address: "",
      contactName: "",
    },
    requestDate: payload.requestDate,
    expirationDate: payload.expirationDate,
    status: payload.status || "BORRADOR",
    notes: payload.notes,
    totalEstimated: payload.details.reduce(
      (sum, d) => sum + d.quantity * d.quotedPrice,
      0,
    ),
    details: payload.details.map((d) => ({
      id: nextDetailId++,
      product: d.productId
        ? {
            id: d.productId,
            name: d.productName,
            sku: d.skuSuggestion ?? `SKU-${d.productId}`,
            brandId: 0,
            categoryId: 0,
            unitOfMeasureId: 0,
            price: 0,
            minStockThreshold: 0,
          }
        : null,
      productName: d.productName,
      quantity: d.quantity,
      quotedPrice: d.quotedPrice,
      skuSuggestion: d.skuSuggestion,
    })),
  };
  quotations = [created, ...quotations];
  return structuredClone(created);
}

export function updateMockQuotation(
  id: number,
  payload: QuotationPayload,
): Quotation {
  const q = findQuotation(id);
  if (q.status !== "BORRADOR") {
    throw new Error("Solo se edita una cotización en borrador");
  }
  q.requestDate = payload.requestDate;
  q.expirationDate = payload.expirationDate;
  q.notes = payload.notes;
  q.details = payload.details.map((d) => ({
    id: nextDetailId++,
    product: d.productId
      ? {
          id: d.productId,
          name: d.productName,
          sku: d.skuSuggestion ?? `SKU-${d.productId}`,
          brandId: 0,
          categoryId: 0,
          unitOfMeasureId: 0,
          price: 0,
          minStockThreshold: 0,
        }
      : null,
    productName: d.productName,
    quantity: d.quantity,
    quotedPrice: d.quotedPrice,
    skuSuggestion: d.skuSuggestion,
  }));
  q.totalEstimated = q.details.reduce(
    (sum, d) => sum + d.quantity * d.quotedPrice,
    0,
  );
  return structuredClone(q);
}

export function changeMockQuotationStatus(
  id: number,
  status: string,
): Quotation {
  const q = findQuotation(id);
  q.status = status as Quotation["status"];
  return structuredClone(q);
}

export function convertMockQuotationToOrder(id: number): PurchaseOrder {
  const q = findQuotation(id);
  if (q.status === "CONVERTIDO") {
    throw new Error("La cotización ya fue convertida");
  }
  if (q.status === "CANCELADO" || q.status === "RECHAZADO") {
    throw new Error("No se puede convertir una cotización cerrada");
  }
  const unmapped = q.details.some((d) => !d.product);
  if (unmapped) {
    throw new Error("Hay líneas sin producto de catálogo vinculado");
  }
  const orderId = nextOrderId++;
  const today = new Date().toISOString().slice(0, 10);
  const order: PurchaseOrder = {
    id: orderId,
    supplier: structuredClone(q.supplier),
    orderDate: today,
    deliveryDate: q.expirationDate ?? today,
    totalAmount: 0,
    status: "BORRADOR",
    details: q.details.map((d) => ({
      id: nextDetailId++,
      purchaseOrderId: orderId,
      product: structuredClone(d.product!),
      quantity: d.quantity,
      unitCost: d.quotedPrice,
    })),
  };
  recalculate(order);
  orders = [order, ...orders];
  q.status = "CONVERTIDO";
  return structuredClone(order);
}

export function linkMockQuotationProduct(
  quotationId: number,
  detailId: number,
  productId: number,
): Quotation {
  const q = findQuotation(quotationId);
  const detail = q.details.find((d) => d.id === detailId);
  if (!detail) throw new Error("Línea de cotización no encontrada");
  detail.product = {
    id: productId,
    name: detail.productName,
    sku: detail.skuSuggestion ?? `SKU-${productId}`,
    brandId: 0,
    categoryId: 0,
    unitOfMeasureId: 0,
    price: 0,
    minStockThreshold: 0,
  };
  return structuredClone(q);
}

export function mockPipelineCounts() {
  return {
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
}
