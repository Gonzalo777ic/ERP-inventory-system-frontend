/**
 * CRM DTOs for Admin ERP (pipeline stages + opportunities).
 * Stage names/codes come from pipeline config (API or mock), never as UI SoT.
 */

export const CRM_CURRENCY = "PEN" as const;

export type CrmStageOutcome = "OPEN" | "WON" | "LOST";

export type CrmOpportunityStatus = "OPEN" | "WON" | "LOST" | "CANCELLED";

export type CrmMoneyDto = {
  amount: number;
  currency: typeof CRM_CURRENCY;
};

/** Configurable pipeline stage — loaded from service/fixtures. */
export type CrmPipelineStageDto = {
  id: number;
  pipelineId: number;
  code: string;
  name: string;
  sequenceNo: number;
  outcome: CrmStageOutcome;
  deletedAt: string | null;
};

export type CrmPipelineDto = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  stages: CrmPipelineStageDto[];
  deletedAt: string | null;
};

export type CrmOpportunityDto = {
  id: number;
  name: string;
  partnerId: number;
  partnerName: string;
  leadId: number | null;
  pipelineId: number;
  stageId: number;
  status: CrmOpportunityStatus;
  expectedRevenue: CrmMoneyDto;
  notes: string | null;
  lostReason: string | null;
  createdAt: string;
  closedAt: string | null;
};

export const CRM_OPPORTUNITY_STATUS_LABELS: Record<CrmOpportunityStatus, string> = {
  OPEN: "Abierta",
  WON: "Ganada",
  LOST: "Perdida",
  CANCELLED: "Cancelada",
};

export const CRM_OPPORTUNITY_STATUS_BADGE: Record<
  CrmOpportunityStatus,
  "info" | "success" | "danger" | "neutral"
> = {
  OPEN: "info",
  WON: "success",
  LOST: "danger",
  CANCELLED: "neutral",
};
