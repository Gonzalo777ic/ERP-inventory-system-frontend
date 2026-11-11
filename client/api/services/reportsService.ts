import axios from "axios";
import {
  cloneArKpi,
  cloneReportsHub,
  cloneSalesKpi,
  cloneStockKpi,
} from "../../data/reportFixtures";
import type {
  ArKpiReport,
  ReportsHubSummary,
  SalesKpiReport,
  StockKpiReport,
} from "../../types/reports";

const MOCK_LATENCY_MS = 160;
const REPORTS_PATH = "/reports";

function inventoryBaseUrl(): string | null {
  const base = import.meta.env.VITE_INVENTORY_API_URL;
  if (!base || typeof base !== "string" || base.trim() === "") {
    return null;
  }
  return base.replace(/\/$/, "");
}

function storeBaseUrl(): string | null {
  const base = import.meta.env.VITE_STORE_API_URL;
  if (!base || typeof base !== "string" || base.trim() === "") {
    return null;
  }
  return base.replace(/\/$/, "");
}

/**
 * Local mock by default. HTTP only when a reports API base is configured
 * and mock is explicitly disabled — never Feign across contexts from the UI.
 */
function useReportsMock(): boolean {
  if (import.meta.env.VITE_REPORTS_USE_MOCK === "true") return true;
  if (import.meta.env.VITE_REPORTS_USE_MOCK === "false") {
    return !(inventoryBaseUrl() || storeBaseUrl());
  }
  return true;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function reportsUrl(path: string): string {
  const base = inventoryBaseUrl() ?? storeBaseUrl();
  if (!base) {
    throw new Error("No hay API base configurada para Reportes.");
  }
  return `${base}${REPORTS_PATH}${path}`;
}

export const ReportsService = {
  isMockMode: (): boolean => useReportsMock(),

  async getHubSummary(): Promise<ReportsHubSummary> {
    if (!useReportsMock()) {
      const { data } = await axios.get<ReportsHubSummary>(reportsUrl("/hub"));
      return data;
    }
    await delay(MOCK_LATENCY_MS);
    return cloneReportsHub();
  },

  async getSalesKpi(): Promise<SalesKpiReport> {
    if (!useReportsMock()) {
      const { data } = await axios.get<SalesKpiReport>(reportsUrl("/sales"));
      return data;
    }
    await delay(MOCK_LATENCY_MS);
    return cloneSalesKpi();
  },

  async getStockKpi(): Promise<StockKpiReport> {
    if (!useReportsMock()) {
      const { data } = await axios.get<StockKpiReport>(reportsUrl("/stock"));
      return data;
    }
    await delay(MOCK_LATENCY_MS);
    return cloneStockKpi();
  },

  async getArKpi(): Promise<ArKpiReport> {
    if (!useReportsMock()) {
      const { data } = await axios.get<ArKpiReport>(reportsUrl("/ar"));
      return data;
    }
    await delay(MOCK_LATENCY_MS);
    return cloneArKpi();
  },
};
