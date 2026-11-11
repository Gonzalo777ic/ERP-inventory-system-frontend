import { REPORTS_CURRENCY } from "../types/reports";
import type {
  ArKpiReport,
  ReportsHubSummary,
  SalesKpiReport,
  StockKpiReport,
} from "../types/reports";

function money(amount: number) {
  return { amount, currency: REPORTS_CURRENCY };
}

export const REPORTS_HUB_FIXTURE: ReportsHubSummary = {
  asOf: "2026-11-10T12:00:00.000Z",
  salesMonthTotal: money(128450.75),
  salesOrderCount: 214,
  stockSkuBelowMin: 7,
  stockOnHandUnits: 1842,
  arOpenBalance: money(45230.5),
  arOverdueCount: 12,
};

export const SALES_KPI_FIXTURE: SalesKpiReport = {
  asOf: "2026-11-10T12:00:00.000Z",
  periodLabel: "Últimos 6 meses",
  totalNetSales: money(712880.4),
  totalOrders: 1186,
  avgTicket: money(601.08),
  returnRatePct: 3.4,
  series: [
    {
      period: "2026-06",
      label: "Jun",
      orderCount: 168,
      netSales: money(98540.2),
      returns: money(3120),
    },
    {
      period: "2026-07",
      label: "Jul",
      orderCount: 181,
      netSales: money(104220.5),
      returns: money(2890.4),
    },
    {
      period: "2026-08",
      label: "Ago",
      orderCount: 195,
      netSales: money(112010),
      returns: money(4015.1),
    },
    {
      period: "2026-09",
      label: "Sep",
      orderCount: 204,
      netSales: money(118340.8),
      returns: money(3560),
    },
    {
      period: "2026-10",
      label: "Oct",
      orderCount: 224,
      netSales: money(151318.15),
      returns: money(5220.75),
    },
    {
      period: "2026-11",
      label: "Nov",
      orderCount: 214,
      netSales: money(128450.75),
      returns: money(4180.2),
    },
  ],
  topProducts: [
    {
      productSku: "ACE-001",
      productName: "Aceite motor 5W-30 1L",
      units: 420,
      netSales: money(37800),
    },
    {
      productSku: "BAT-75",
      productName: "Batería 12V 75Ah",
      units: 96,
      netSales: money(52800),
    },
    {
      productSku: "FLT-210",
      productName: "Filtro de aceite universal",
      units: 310,
      netSales: money(18600),
    },
    {
      productSku: "LLA-16",
      productName: 'Llanta 16" radial',
      units: 88,
      netSales: money(44000),
    },
  ],
};

export const STOCK_KPI_FIXTURE: StockKpiReport = {
  asOf: "2026-11-10T12:00:00.000Z",
  totalSkus: 48,
  belowMinCount: 7,
  totalOnHandUnits: 1842,
  totalReservedUnits: 126,
  rows: [
    {
      productSku: "FLT-210",
      productName: "Filtro de aceite universal",
      warehouseCode: "WH-LIM",
      onHandQty: 12,
      reservedQty: 4,
      availableQty: 8,
      minQty: 20,
      belowMin: true,
      uom: "UND",
    },
    {
      productSku: "JUN-08",
      productName: "Junta de cárter",
      warehouseCode: "WH-LIM",
      onHandQty: 5,
      reservedQty: 1,
      availableQty: 4,
      minQty: 15,
      belowMin: true,
      uom: "UND",
    },
    {
      productSku: "BAT-75",
      productName: "Batería 12V 75Ah",
      warehouseCode: "WH-ARE",
      onHandQty: 3,
      reservedQty: 0,
      availableQty: 3,
      minQty: 6,
      belowMin: true,
      uom: "UND",
    },
    {
      productSku: "ACE-001",
      productName: "Aceite motor 5W-30 1L",
      warehouseCode: "WH-LIM",
      onHandQty: 48,
      reservedQty: 6,
      availableQty: 42,
      minQty: 24,
      belowMin: false,
      uom: "UND",
    },
    {
      productSku: "LLA-16",
      productName: 'Llanta 16" radial',
      warehouseCode: "WH-ARE",
      onHandQty: 20,
      reservedQty: 2,
      availableQty: 18,
      minQty: 10,
      belowMin: false,
      uom: "UND",
    },
    {
      productSku: "BRN-12",
      productName: "Juego de bornes",
      warehouseCode: "WH-LIM",
      onHandQty: 9,
      reservedQty: 0,
      availableQty: 9,
      minQty: 12,
      belowMin: true,
      uom: "UND",
    },
  ],
};

export const AR_KPI_FIXTURE: ArKpiReport = {
  asOf: "2026-11-10T12:00:00.000Z",
  openBalance: money(45230.5),
  overdueBalance: money(18740.25),
  openDocumentCount: 28,
  overdueDocumentCount: 12,
  aging: [
    {
      key: "CURRENT",
      label: "Al día",
      documentCount: 10,
      balance: money(15490.25),
    },
    {
      key: "D1_30",
      label: "1–30 días",
      documentCount: 8,
      balance: money(10999.99),
    },
    {
      key: "D31_60",
      label: "31–60 días",
      documentCount: 6,
      balance: money(9820.01),
    },
    {
      key: "D61_PLUS",
      label: "61+ días",
      documentCount: 4,
      balance: money(8920.25),
    },
  ],
  documents: [
    {
      id: 501,
      documentNumber: "CXC-2026-0142",
      partnerName: "Transportes Andinos SAC",
      dueDate: "2026-10-15",
      balance: money(5200),
      daysOverdue: 26,
      status: "OVERDUE",
    },
    {
      id: 502,
      documentNumber: "CXC-2026-0158",
      partnerName: "Taller El Rápido EIRL",
      dueDate: "2026-09-28",
      balance: money(3120.5),
      daysOverdue: 43,
      status: "OVERDUE",
    },
    {
      id: 503,
      documentNumber: "CXC-2026-0171",
      partnerName: "Repuestos Norte SRL",
      dueDate: "2026-11-20",
      balance: money(8450),
      daysOverdue: 0,
      status: "OPEN",
    },
    {
      id: 504,
      documentNumber: "CXC-2026-0175",
      partnerName: "Flota Lima SAC",
      dueDate: "2026-11-05",
      balance: money(2100.75),
      daysOverdue: 5,
      status: "PARTIAL",
    },
    {
      id: 505,
      documentNumber: "CXC-2026-0120",
      partnerName: "Autos del Sur SAC",
      dueDate: "2026-08-01",
      balance: money(8920.25),
      daysOverdue: 101,
      status: "OVERDUE",
    },
  ],
};

export function cloneReportsHub(): ReportsHubSummary {
  return {
    ...REPORTS_HUB_FIXTURE,
    salesMonthTotal: { ...REPORTS_HUB_FIXTURE.salesMonthTotal },
    arOpenBalance: { ...REPORTS_HUB_FIXTURE.arOpenBalance },
  };
}

export function cloneSalesKpi(): SalesKpiReport {
  return {
    ...SALES_KPI_FIXTURE,
    totalNetSales: { ...SALES_KPI_FIXTURE.totalNetSales },
    avgTicket: { ...SALES_KPI_FIXTURE.avgTicket },
    series: SALES_KPI_FIXTURE.series.map((p) => ({
      ...p,
      netSales: { ...p.netSales },
      returns: { ...p.returns },
    })),
    topProducts: SALES_KPI_FIXTURE.topProducts.map((p) => ({
      ...p,
      netSales: { ...p.netSales },
    })),
  };
}

export function cloneStockKpi(): StockKpiReport {
  return {
    ...STOCK_KPI_FIXTURE,
    rows: STOCK_KPI_FIXTURE.rows.map((r) => ({ ...r })),
  };
}

export function cloneArKpi(): ArKpiReport {
  return {
    ...AR_KPI_FIXTURE,
    openBalance: { ...AR_KPI_FIXTURE.openBalance },
    overdueBalance: { ...AR_KPI_FIXTURE.overdueBalance },
    aging: AR_KPI_FIXTURE.aging.map((b) => ({
      ...b,
      balance: { ...b.balance },
    })),
    documents: AR_KPI_FIXTURE.documents.map((d) => ({
      ...d,
      balance: { ...d.balance },
    })),
  };
}
