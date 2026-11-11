import { tryRequest } from "@/api/http";
import { getQuotations } from "@/api/services/quotation";
import { QUOTATION_COMPARE_FIXTURES } from "@/data/quotationCompareFixtures";
import type { Quotation } from "@/types/inventory/quotations";
import {
  filterComparableQuotations,
  type QuotedMoneyWire,
} from "@/lib/quotationCompare";

const COMPARE_QUERY_STALE_MS = 60_000;
const MOCK_LATENCY_MS = 160;

export const quotationCompareQueryKeys = {
  all: ["quotation-compare"] as const,
  list: () => [...quotationCompareQueryKeys.all, "list"] as const,
};

export { COMPARE_QUERY_STALE_MS };

export type QuotationCompareSource = "api" | "fixture";

export type QuotationCompareLoadResult = {
  quotations: Quotation[];
  source: QuotationCompareSource;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeQuotedPrice(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value && typeof value === "object") {
    const wire = value as QuotedMoneyWire;
    if (typeof wire === "object" && "amount" in wire) {
      const amount =
        typeof wire.amount === "string" ? Number(wire.amount) : wire.amount;
      if (Number.isFinite(amount)) return amount;
    }
  }
  return 0;
}

function normalizeQuotation(raw: Quotation): Quotation {
  return {
    ...raw,
    details: (raw.details ?? []).map((detail) => ({
      ...detail,
      quotedPrice: normalizeQuotedPrice(detail.quotedPrice as unknown),
    })),
  };
}

async function listFromFixtures(): Promise<Quotation[]> {
  await delay(MOCK_LATENCY_MS);
  return QUOTATION_COMPARE_FIXTURES.map(normalizeQuotation);
}

/**
 * Loads RFQs for the comparative view: inventory purchasing API when
 * reachable, otherwise local fixtures. Never touches sales/accounting.
 */
export async function listQuotationsForCompare(): Promise<QuotationCompareLoadResult> {
  let usedApi = true;
  const quotations = await tryRequest(
    () => getQuotations().then((data) => ({ data })),
    async () => {
      usedApi = false;
      return listFromFixtures();
    },
  );

  const normalized = quotations.map(normalizeQuotation);
  const comparable = filterComparableQuotations(normalized);

  if (comparable.length >= 2) {
    return {
      quotations: comparable,
      source: usedApi ? "api" : "fixture",
    };
  }

  if (comparable.length === 0) {
    return {
      quotations: filterComparableQuotations(await listFromFixtures()),
      source: "fixture",
    };
  }

  return {
    quotations: comparable,
    source: usedApi ? "api" : "fixture",
  };
}
