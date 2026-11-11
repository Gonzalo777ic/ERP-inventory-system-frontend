import type {
  PosCatalogProduct,
  PosCurrencyCode,
  PosPaymentMethodOption,
} from "../types/pos/ticket";

/** Política fiscal local del POS demo (no literal suelto en pantallas). */
export const POS_CURRENCY: PosCurrencyCode = "PEN";
export const POS_TAX_RATE = "0.18";
export const POS_TAX_LABEL = "IGV 18%";

export const POS_CATALOG_FIXTURES: readonly PosCatalogProduct[] = [
  {
    id: 1,
    sku: "ACE-001",
    name: "Aceite motor 5W-30 1L",
    categoryLabel: "Lubricantes",
    unitPrice: "42.50",
    currency: POS_CURRENCY,
  },
  {
    id: 2,
    sku: "FLT-210",
    name: "Filtro de aceite universal",
    categoryLabel: "Filtros",
    unitPrice: "18.90",
    currency: POS_CURRENCY,
  },
  {
    id: 3,
    sku: "BAT-75",
    name: "Batería 12V 75Ah",
    categoryLabel: "Eléctrico",
    unitPrice: "289.00",
    currency: POS_CURRENCY,
  },
  {
    id: 4,
    sku: "LLA-16",
    name: 'Llanta 16" radial',
    categoryLabel: "Llantas",
    unitPrice: "210.00",
    currency: POS_CURRENCY,
  },
  {
    id: 5,
    sku: "LIM-40",
    name: "Limpia parabrisas 500ml",
    categoryLabel: "Cuidado",
    unitPrice: "12.50",
    currency: POS_CURRENCY,
  },
  {
    id: 6,
    sku: "BUJ-04",
    name: "Bujía iridium (unidad)",
    categoryLabel: "Encendido",
    unitPrice: "35.00",
    currency: POS_CURRENCY,
  },
  {
    id: 7,
    sku: "PAD-FR",
    name: "Pastillas de freno delanteras",
    categoryLabel: "Frenos",
    unitPrice: "95.00",
    currency: POS_CURRENCY,
  },
  {
    id: 8,
    sku: "SRV-AL",
    name: "Servicio alineación",
    categoryLabel: "Servicios",
    unitPrice: "60.00",
    currency: POS_CURRENCY,
  },
];

export const POS_PAYMENT_METHOD_FIXTURES: readonly PosPaymentMethodOption[] = [
  { id: 1, code: "CASH", name: "Efectivo" },
  { id: 2, code: "CARD", name: "Tarjeta" },
  { id: 3, code: "TRANSFER", name: "Transferencia" },
  { id: 4, code: "WALLET", name: "Billetera" },
];

export function clonePosCatalog(): PosCatalogProduct[] {
  return POS_CATALOG_FIXTURES.map((p) => ({ ...p }));
}

export function clonePosPaymentMethods(): PosPaymentMethodOption[] {
  return POS_PAYMENT_METHOD_FIXTURES.map((m) => ({ ...m }));
}
