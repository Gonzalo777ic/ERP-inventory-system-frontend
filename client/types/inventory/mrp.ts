/**
 * Local shapes for MRP UI (BOM + manufacturing orders).
 * Quantities and scrap come from the service/fixtures — UI does not recalculate.
 */

export const MRP_DEFAULT_UOM = "UND" as const;

export type BomStatus = "ACTIVE" | "RETIRED";

export type ManufacturingOrderStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "DONE"
  | "CANCELLED";

export type BomComponentResponse = {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  /** Theoretical qty per finished unit (domain output) */
  qtyPerUnit: number;
  uom: string;
};

export type BomResponse = {
  id: number;
  code: string;
  name: string;
  productId: number;
  productSku: string;
  productName: string;
  /** Finished product qty the BOM yields */
  productQty: number;
  uom: string;
  status: BomStatus;
  components: BomComponentResponse[];
  deletedAt: string | null;
  deletedBy: string | null;
  updatedAt: string;
};

export type MoComponentLineResponse = {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  theoreticalQty: number;
  consumedQty: number;
  scrapQty: number;
  uom: string;
};

/** Documented scrap entry — libro; never physical delete */
export type ComponentScrapEntryResponse = {
  id: number;
  manufacturingOrderId: number;
  productId: number;
  productSku: string;
  productName: string;
  qty: number;
  uom: string;
  reason: string;
  recordedAt: string;
  recordedBy: string;
};

export type ManufacturingOrderResponse = {
  id: number;
  name: string;
  bomId: number;
  bomCode: string;
  productId: number;
  productSku: string;
  productName: string;
  qtyToProduce: number;
  qtyProduced: number;
  uom: string;
  status: ManufacturingOrderStatus;
  warehouseCode: string;
  scheduledAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  components: MoComponentLineResponse[];
  scraps: ComponentScrapEntryResponse[];
};

export type MrpHubSummary = {
  bomActive: number;
  bomRetired: number;
  moDraft: number;
  moOpen: number;
  moDone: number;
  moCancelled: number;
  scrapEntries: number;
};

export type BomListQuery = {
  search?: string;
  includeRetired?: boolean;
};

export type MoListQuery = {
  search?: string;
  status?: ManufacturingOrderStatus | "OPEN" | "ALL";
};

export type RecordComponentScrapRequest = {
  productId: number;
  qty: number;
  reason: string;
};
