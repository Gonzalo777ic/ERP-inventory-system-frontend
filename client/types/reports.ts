/**
 * Local report/KPI shapes for the ERP Reports center.
 * UI displays service/fixture values — no cross-context Feign from the client.
 */

export const REPORTS_CURRENCY = "PEN" as const;

export type ReportMoney = {
  amount: number;
  currency: typeof REPORTS_CURRENCY;
};

export type ReportsHubSummary = {
  asOf: string;
  salesMonthTotal: ReportMoney;
  salesOrderCount: number;
  stockSkuBelowMin: number;
  stockOnHandUnits: number;
  arOpenBalance: ReportMoney;
  arOverdueCount: number;
};

export type SalesKpiPoint = {
  period: string;
  label: string;
  orderCount: number;
  netSales: ReportMoney;
  returns: ReportMoney;
};

export type SalesKpiReport = {
  asOf: string;
  periodLabel: string;
  totalNetSales: ReportMoney;
  totalOrders: number;
  avgTicket: ReportMoney;
  returnRatePct: number;
  series: SalesKpiPoint[];
  topProducts: {
    productSku: string;
    productName: string;
    units: number;
    netSales: ReportMoney;
  }[];
};

export type StockKpiRow = {
  productSku: string;
  productName: string;
  warehouseCode: string;
  onHandQty: number;
  reservedQty: number;
  availableQty: number;
  minQty: number;
  belowMin: boolean;
  uom: string;
};

export type StockKpiReport = {
  asOf: string;
  totalSkus: number;
  belowMinCount: number;
  totalOnHandUnits: number;
  totalReservedUnits: number;
  rows: StockKpiRow[];
};

export type ArAgingBucket = {
  key: "CURRENT" | "D1_30" | "D31_60" | "D61_PLUS";
  label: string;
  documentCount: number;
  balance: ReportMoney;
};

export type ArKpiDocument = {
  id: number;
  documentNumber: string;
  partnerName: string;
  dueDate: string;
  balance: ReportMoney;
  daysOverdue: number;
  status: "OPEN" | "PARTIAL" | "OVERDUE";
};

export type ArKpiReport = {
  asOf: string;
  openBalance: ReportMoney;
  overdueBalance: ReportMoney;
  openDocumentCount: number;
  overdueDocumentCount: number;
  aging: ArAgingBucket[];
  documents: ArKpiDocument[];
};
