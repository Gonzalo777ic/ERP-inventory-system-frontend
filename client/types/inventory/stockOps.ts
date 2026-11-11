/**
 * Stock operations DTOs for Inventario UI (dashboard, pickings, cycle counts).
 * Shapes mirror inventory-service stock/picking/adjustment projections when available.
 * Quantities are always server/mock-provided — the client must not recompute them.
 */

export const OPERATION_TYPES = [
  "INCOMING",
  "OUTGOING",
  "INTERNAL",
  "ADJUSTMENT",
  "SCRAP",
] as const;

export type OperationType = (typeof OPERATION_TYPES)[number];

export const OPERATION_TYPE_LABELS: Record<OperationType, string> = {
  INCOMING: "Recepción",
  OUTGOING: "Entrega",
  INTERNAL: "Transferencia interna",
  ADJUSTMENT: "Ajuste",
  SCRAP: "Scrap",
};

export const PICKING_STATUSES = [
  "DRAFT",
  "CONFIRMED",
  "DONE",
  "CANCELLED",
] as const;

export type PickingStatus = (typeof PICKING_STATUSES)[number];

export const PICKING_STATUS_LABELS: Record<PickingStatus, string> = {
  DRAFT: "Borrador",
  CONFIRMED: "Confirmado",
  DONE: "Hecho",
  CANCELLED: "Anulado",
};

export const PICKING_STATUS_BADGE: Record<
  PickingStatus,
  "neutral" | "info" | "success" | "danger"
> = {
  DRAFT: "neutral",
  CONFIRMED: "info",
  DONE: "success",
  CANCELLED: "danger",
};

export const LOCATION_KINDS = ["STOCK", "INPUT", "OUTPUT", "SCRAP"] as const;
export type LocationKind = (typeof LOCATION_KINDS)[number];

export const LOCATION_KIND_LABELS: Record<LocationKind, string> = {
  STOCK: "Stock",
  INPUT: "Entrada",
  OUTPUT: "Salida",
  SCRAP: "Scrap",
};

export const CYCLE_COUNT_STATUSES = [
  "DRAFT",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
] as const;

export type CycleCountStatus = (typeof CYCLE_COUNT_STATUSES)[number];

export const CYCLE_COUNT_STATUS_LABELS: Record<CycleCountStatus, string> = {
  DRAFT: "Borrador",
  IN_PROGRESS: "En curso",
  DONE: "Hecho",
  CANCELLED: "Anulado",
};

export const CYCLE_COUNT_STATUS_BADGE: Record<
  CycleCountStatus,
  "neutral" | "warning" | "success" | "danger"
> = {
  DRAFT: "neutral",
  IN_PROGRESS: "warning",
  DONE: "success",
  CANCELLED: "danger",
};

/** On-hand quant row as returned by stock read API. */
export interface StockQuantResponse {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  warehouseId: number;
  warehouseCode: string;
  locationId: number;
  locationCode: string;
  locationKind: LocationKind;
  lotNumber: string | null;
  /** Book quantity — do not derive in UI */
  onHandQty: number;
  /** Reserved by confirmed pickings — do not derive in UI */
  reservedQty: number;
  /** Available for new reservations — do not derive in UI */
  availableQty: number;
  uom: string;
}

/** Aggregates + quant snapshot for the stock dashboard. */
export interface StockDashboardSummary {
  asOf: string;
  skuCount: number;
  warehouseCount: number;
  onHandUnits: number;
  reservedUnits: number;
  availableUnits: number;
  lowStockAlertCount: number;
  openPickingCount: number;
  pendingCycleCountCount: number;
  quants: StockQuantResponse[];
}

export interface PickingLineResponse {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  lotNumber: string | null;
  demandQty: number;
  reservedQty: number;
  doneQty: number;
  uom: string;
}

export interface PickingResponse {
  id: number;
  name: string;
  operationType: OperationType;
  status: PickingStatus;
  sourceLocationCode: string;
  destLocationCode: string;
  warehouseCode: string;
  scheduledAt: string;
  confirmedAt: string | null;
  doneAt: string | null;
  cancelledAt: string | null;
  lines: PickingLineResponse[];
  totalDemandQty: number;
  totalDoneQty: number;
}

export interface CycleCountLineResponse {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  lotNumber: string | null;
  theoreticalQty: number;
  countedQty: number | null;
  /** Server-computed variance after count; null while open */
  differenceQty: number | null;
  uom: string;
}

export interface CycleCountResponse {
  id: number;
  name: string;
  warehouseCode: string;
  locationCode: string;
  status: CycleCountStatus;
  createdAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  lines: CycleCountLineResponse[];
  lineCount: number;
  varianceLineCount: number;
}

export type StockAdjustmentKind =
  | "CYCLE_COUNT"
  | "MANUAL_ADJUSTMENT"
  | "SCRAP";

/** Navigation cards for adjustment / cycle-count entry points. */
export interface StockAdjustmentEntryPoint {
  id: string;
  kind: StockAdjustmentKind;
  title: string;
  description: string;
  path: string;
}

export interface PickingListQuery {
  search?: string;
  status?: PickingStatus | "OPEN";
}

export interface CycleCountListQuery {
  search?: string;
  status?: CycleCountStatus | "OPEN";
}
