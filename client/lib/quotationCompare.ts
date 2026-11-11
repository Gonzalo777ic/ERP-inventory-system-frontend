import type { Quotation, QuotationStatus } from "../types/inventory/quotations";
import { CATALOG_CURRENCY } from "../types/inventory/catalog";

/** Statuses that carry comparable supplier prices for RFQ lines. */
export const COMPARABLE_QUOTATION_STATUSES: readonly QuotationStatus[] = [
  "ENVIADO",
  "RESPONDIDO",
  "APROBADO",
] as const;

export type QuotedMoneyWire =
  | number
  | {
      amount: number | string;
      currency?: string;
      currencyCode?: string;
    };

export type CompareSupplierColumn = {
  quotationId: number;
  supplierId: number;
  supplierName: string;
  status: QuotationStatus;
  requestDate: string;
  expirationDate?: string;
  totalEstimated: number | null;
  currency: string;
};

export type CompareCell = {
  quotationId: number;
  supplierId: number;
  detailId: number;
  quantity: number;
  unitPrice: number;
  currency: string;
  lineTotal: number;
  productName: string;
  skuSuggestion?: string;
};

export type CompareProductRow = {
  key: string;
  productId: number | null;
  productName: string;
  sku: string | null;
  cellsByQuotationId: Record<number, CompareCell>;
  bestUnitPrice: number | null;
  bestQuotationIds: number[];
};

export type QuotationCompareMatrix = {
  columns: CompareSupplierColumn[];
  rows: CompareProductRow[];
  currency: string;
};

function readAmount(value: QuotedMoneyWire | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const raw = value.amount;
  const amount = typeof raw === "string" ? Number(raw) : raw;
  return Number.isFinite(amount) ? amount : null;
}

function readCurrency(value: QuotedMoneyWire | null | undefined): string {
  if (value != null && typeof value === "object") {
    const code = value.currency ?? value.currencyCode;
    if (code && code.trim() !== "") return code.trim().toUpperCase();
  }
  return CATALOG_CURRENCY;
}

function productKey(detail: Quotation["details"][number]): string {
  if (detail.product?.id != null) {
    return `product:${detail.product.id}`;
  }
  const sku = (detail.skuSuggestion ?? "").trim().toLowerCase();
  if (sku) return `sku:${sku}`;
  return `name:${detail.productName.trim().toLowerCase()}`;
}

export function isComparableStatus(status: QuotationStatus): boolean {
  return COMPARABLE_QUOTATION_STATUSES.includes(status);
}

export function filterComparableQuotations(
  quotations: Quotation[],
): Quotation[] {
  return quotations.filter((q) => isComparableStatus(q.status));
}

/**
 * Builds a product × supplier matrix from RFQ quotations.
 * Line totals use quoted unit price × quantity as returned by the RFQ;
 * the UI does not invent discounts or taxes.
 */
export function buildQuotationCompareMatrix(
  quotations: Quotation[],
): QuotationCompareMatrix {
  const columns: CompareSupplierColumn[] = quotations.map((q) => {
    const firstPrice = q.details[0]?.quotedPrice as QuotedMoneyWire | undefined;
    return {
      quotationId: q.id,
      supplierId: q.supplier.id,
      supplierName: q.supplier.name,
      status: q.status,
      requestDate: q.requestDate,
      expirationDate: q.expirationDate,
      totalEstimated:
        typeof q.totalEstimated === "number" && Number.isFinite(q.totalEstimated)
          ? q.totalEstimated
          : null,
      currency: readCurrency(firstPrice),
    };
  });

  const rowMap = new Map<string, CompareProductRow>();

  for (const quotation of quotations) {
    for (const detail of quotation.details) {
      const key = productKey(detail);
      const unitPrice = readAmount(detail.quotedPrice as QuotedMoneyWire);
      if (unitPrice == null) continue;

      const currency = readCurrency(detail.quotedPrice as QuotedMoneyWire);
      let row = rowMap.get(key);
      if (!row) {
        row = {
          key,
          productId: detail.product?.id ?? null,
          productName: detail.product?.name ?? detail.productName,
          sku: detail.product?.sku ?? detail.skuSuggestion ?? null,
          cellsByQuotationId: {},
          bestUnitPrice: null,
          bestQuotationIds: [],
        };
        rowMap.set(key, row);
      }

      row.cellsByQuotationId[quotation.id] = {
        quotationId: quotation.id,
        supplierId: quotation.supplier.id,
        detailId: detail.id,
        quantity: detail.quantity,
        unitPrice,
        currency,
        lineTotal: unitPrice * detail.quantity,
        productName: detail.productName,
        skuSuggestion: detail.skuSuggestion,
      };
    }
  }

  const rows = Array.from(rowMap.values()).map((row) => {
    const prices = Object.values(row.cellsByQuotationId).map((c) => c.unitPrice);
    const bestUnitPrice = prices.length > 0 ? Math.min(...prices) : null;
    const bestQuotationIds =
      bestUnitPrice == null
        ? []
        : Object.values(row.cellsByQuotationId)
            .filter((c) => c.unitPrice === bestUnitPrice)
            .map((c) => c.quotationId);
    return { ...row, bestUnitPrice, bestQuotationIds };
  });

  rows.sort((a, b) => a.productName.localeCompare(b.productName, "es"));

  return {
    columns,
    rows,
    currency: columns[0]?.currency ?? CATALOG_CURRENCY,
  };
}
