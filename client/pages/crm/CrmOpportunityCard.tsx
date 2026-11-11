import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/badge";
import {
  CRM_OPPORTUNITY_STATUS_BADGE,
  CRM_OPPORTUNITY_STATUS_LABELS,
  type CrmOpportunityDto,
  type CrmPipelineStageDto,
} from "../../types/crm";
import { formatCurrency } from "../../utils/format";

type Props = {
  opportunity: CrmOpportunityDto;
  stages: CrmPipelineStageDto[];
  onMove: (opportunityId: number, stageId: number) => void;
  moving: boolean;
};

export function CrmOpportunityCard({
  opportunity,
  stages,
  onMove,
  moving,
}: Props) {
  return (
    <article className="rounded-lg border border-border bg-card p-3 shadow-md space-y-3">
      <div className="space-y-1">
        <Link
          to={`/crm/opportunities/${opportunity.id}`}
          className="font-medium text-foreground hover:text-primary transition-colors duration-150"
        >
          {opportunity.name}
        </Link>
        <p className="text-xs text-muted-foreground">{opportunity.partnerName}</p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Badge variant={CRM_OPPORTUNITY_STATUS_BADGE[opportunity.status]}>
          {CRM_OPPORTUNITY_STATUS_LABELS[opportunity.status]}
        </Badge>
        <p className="font-bold text-sm">
          {formatCurrency(
            opportunity.expectedRevenue.amount,
            opportunity.expectedRevenue.currency,
          )}
        </p>
      </div>

      {opportunity.status === "OPEN" ? (
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Mover a etapa</span>
          <select
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={opportunity.stageId}
            disabled={moving}
            aria-label={`Mover oportunidad ${opportunity.name}`}
            onChange={(e) => {
              const nextStageId = Number(e.target.value);
              if (nextStageId !== opportunity.stageId) {
                onMove(opportunity.id, nextStageId);
              }
            }}
          >
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </article>
  );
}
