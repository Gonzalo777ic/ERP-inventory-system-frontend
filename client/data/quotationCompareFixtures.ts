import type { Product } from "../types/inventory/products";
import type { Quotation } from "../types/inventory/quotations";
import { CATALOG_CURRENCY } from "../types/inventory/catalog";

function stubProduct(id: number, name: string, sku: string): Product {
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
 * Demo RFQs with overlapping products across suppliers for the local
 * quotation comparative UI (prompt #46). No sales/accounting fields.
 */
export const QUOTATION_COMPARE_FIXTURES: Quotation[] = [
  {
    id: 501,
    supplier: {
      id: 11,
      name: "Andina Supplies SAC",
      taxId: "20111111111",
      email: "compras@andina.pe",
      phone: "01-4001001",
      address: "Av. Industrial 120, Lima",
      contactName: "María Andina",
    },
    requestDate: "2026-11-01",
    expirationDate: "2026-11-30",
    status: "RESPONDIDO",
    totalEstimated: 1840,
    notes: "Entrega 5 días hábiles",
    details: [
      {
        id: 5001,
        product: stubProduct(101, "Harina premium 1kg", "HAR-001"),
        productName: "Harina premium 1kg",
        quantity: 100,
        quotedPrice: 4.2,
        skuSuggestion: "HAR-001",
      },
      {
        id: 5002,
        product: stubProduct(102, "Aceite vegetal 1L", "ACE-010"),
        productName: "Aceite vegetal 1L",
        quantity: 80,
        quotedPrice: 9.5,
        skuSuggestion: "ACE-010",
      },
      {
        id: 5003,
        product: stubProduct(103, "Azúcar blanca 1kg", "AZU-003"),
        productName: "Azúcar blanca 1kg",
        quantity: 120,
        quotedPrice: 3.1,
        skuSuggestion: "AZU-003",
      },
    ],
  },
  {
    id: 502,
    supplier: {
      id: 12,
      name: "Pacifico Abastece EIRL",
      taxId: "20222222222",
      email: "ventas@pacifico.pe",
      phone: "01-4002002",
      address: "Calle Comercio 45, Callao",
      contactName: "Luis Pacífico",
    },
    requestDate: "2026-11-02",
    expirationDate: "2026-11-28",
    status: "RESPONDIDO",
    totalEstimated: 1725,
    notes: "Descuento por volumen en harina",
    details: [
      {
        id: 5011,
        product: stubProduct(101, "Harina premium 1kg", "HAR-001"),
        productName: "Harina premium 1kg",
        quantity: 100,
        quotedPrice: 3.95,
        skuSuggestion: "HAR-001",
      },
      {
        id: 5012,
        product: stubProduct(102, "Aceite vegetal 1L", "ACE-010"),
        productName: "Aceite vegetal 1L",
        quantity: 80,
        quotedPrice: 9.8,
        skuSuggestion: "ACE-010",
      },
      {
        id: 5013,
        product: stubProduct(104, "Sal yodada 1kg", "SAL-004"),
        productName: "Sal yodada 1kg",
        quantity: 60,
        quotedPrice: 1.45,
        skuSuggestion: "SAL-004",
      },
    ],
  },
  {
    id: 503,
    supplier: {
      id: 13,
      name: "Norte Mayoristas SA",
      taxId: "20333333333",
      email: "rfq@norte.pe",
      phone: "044-4003003",
      address: "Mz A Lt 8, Trujillo",
      contactName: "Ana Norte",
    },
    requestDate: "2026-11-03",
    expirationDate: "2026-12-05",
    status: "ENVIADO",
    totalEstimated: 1910,
    notes: `Moneda ${CATALOG_CURRENCY}`,
    details: [
      {
        id: 5021,
        product: stubProduct(101, "Harina premium 1kg", "HAR-001"),
        productName: "Harina premium 1kg",
        quantity: 100,
        quotedPrice: 4.05,
        skuSuggestion: "HAR-001",
      },
      {
        id: 5022,
        product: stubProduct(103, "Azúcar blanca 1kg", "AZU-003"),
        productName: "Azúcar blanca 1kg",
        quantity: 120,
        quotedPrice: 2.95,
        skuSuggestion: "AZU-003",
      },
      {
        id: 5023,
        product: stubProduct(104, "Sal yodada 1kg", "SAL-004"),
        productName: "Sal yodada 1kg",
        quantity: 60,
        quotedPrice: 1.55,
        skuSuggestion: "SAL-004",
      },
      {
        id: 5024,
        productName: "Empaque kraft x100",
        quantity: 20,
        quotedPrice: 12.0,
        skuSuggestion: "EMP-NEW",
      },
    ],
  },
];
