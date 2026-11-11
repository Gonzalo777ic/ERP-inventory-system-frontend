import type { PurchaseOrder } from "../types/inventory/orders";
import type { PurchaseReceipt } from "../types/inventory/procurement";
import type { Product } from "../types/inventory/products";
import type { Supplier } from "../types/inventory/masters";
import { QUOTATION_COMPARE_FIXTURES } from "./quotationCompareFixtures";

const andina: Supplier = {
  id: 11,
  name: "Andina Supplies SAC",
  taxId: "20111111111",
  email: "compras@andina.pe",
  phone: "01-4001001",
  address: "Av. Industrial 120, Lima",
  contactName: "María Andina",
};

const pacifico: Supplier = {
  id: 12,
  name: "Pacifico Abastece EIRL",
  taxId: "20222222222",
  email: "ventas@pacifico.pe",
  phone: "01-4002002",
  address: "Calle Comercio 45, Callao",
  contactName: "Luis Pacífico",
};

function product(id: number, name: string, sku: string): Product {
  return {
    id,
    name,
    sku,
    brandId: 0,
    categoryId: 0,
    unitOfMeasureId: 0,
    price: 0,
    minStockThreshold: 0,
  };
}

/**
 * Seed purchase orders for the RFQ → OC → recepción demo.
 * Reuses compare RFQs as the quotation side (do not duplicate those fixtures).
 */
export const PURCHASE_ORDER_FIXTURES: PurchaseOrder[] = [
  {
    id: 701,
    supplier: andina,
    orderDate: "2026-11-05",
    deliveryDate: "2026-11-15",
    totalAmount: 840,
    status: "BORRADOR",
    details: [
      {
        id: 7001,
        purchaseOrderId: 701,
        product: product(101, "Harina premium 1kg", "HAR-001"),
        quantity: 100,
        unitCost: 4.2,
      },
      {
        id: 7002,
        purchaseOrderId: 701,
        product: product(102, "Aceite vegetal 1L", "ACE-010"),
        quantity: 40,
        unitCost: 9.5,
      },
    ],
  },
  {
    id: 702,
    supplier: pacifico,
    orderDate: "2026-11-06",
    deliveryDate: "2026-11-18",
    totalAmount: 790,
    status: "PENDIENTE",
    details: [
      {
        id: 7011,
        purchaseOrderId: 702,
        product: product(101, "Harina premium 1kg", "HAR-001"),
        quantity: 100,
        unitCost: 3.95,
      },
      {
        id: 7012,
        purchaseOrderId: 702,
        product: product(104, "Sal yodada 1kg", "SAL-004"),
        quantity: 100,
        unitCost: 1.45,
      },
    ],
  },
  {
    id: 703,
    supplier: andina,
    orderDate: "2026-11-04",
    deliveryDate: "2026-11-12",
    totalAmount: 1116,
    status: "CONFIRMADO",
    details: [
      {
        id: 7021,
        purchaseOrderId: 703,
        product: product(103, "Azúcar blanca 1kg", "AZU-003"),
        quantity: 120,
        unitCost: 3.1,
      },
      {
        id: 7022,
        purchaseOrderId: 703,
        product: product(102, "Aceite vegetal 1L", "ACE-010"),
        quantity: 60,
        unitCost: 9.5,
      },
    ],
  },
  {
    id: 704,
    supplier: pacifico,
    orderDate: "2026-10-20",
    deliveryDate: "2026-10-28",
    totalAmount: 420,
    status: "COMPLETO",
    details: [
      {
        id: 7031,
        purchaseOrderId: 704,
        product: product(101, "Harina premium 1kg", "HAR-001"),
        quantity: 100,
        unitCost: 4.2,
      },
    ],
  },
  {
    id: 705,
    supplier: andina,
    orderDate: "2026-10-15",
    deliveryDate: "2026-10-22",
    totalAmount: 310,
    status: "CANCELADO",
    details: [
      {
        id: 7041,
        purchaseOrderId: 705,
        product: product(103, "Azúcar blanca 1kg", "AZU-003"),
        quantity: 100,
        unitCost: 3.1,
      },
    ],
  },
];

export const PURCHASE_RECEIPT_FIXTURES: PurchaseReceipt[] = [
  {
    id: 801,
    purchaseOrderId: 704,
    receivedAt: "2026-10-28T15:20:00.000Z",
    warehouseName: "Almacén Principal",
    lineCount: 1,
    status: "POSTED",
  },
];

/** RFQ seed shared with quotation compare fixtures (prompt #46). */
export const PURCHASE_RFQ_FIXTURES = QUOTATION_COMPARE_FIXTURES;
