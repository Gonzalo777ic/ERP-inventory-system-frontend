/**
 * Alias for callers that still import PurchasingService.
 * Canonical client: ProcurementService (mock + inventory purchasing API).
 */
export {
  ProcurementService as PurchasingService,
} from "./procurement";

export type { ProcurementPipelineCounts as PurchasingFlowSummary } from "../../types/inventory/procurement";
