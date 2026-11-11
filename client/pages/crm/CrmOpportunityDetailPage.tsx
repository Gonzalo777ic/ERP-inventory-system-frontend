import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgePercent, Loader2 } from "lucide-react";
import { CrmService } from "../../api/services/crmService";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  CRM_OPPORTUNITY_STATUS_BADGE,
  CRM_OPPORTUNITY_STATUS_LABELS,
} from "../../types/crm";
import { formatCurrency, formatDate } from "../../utils/format";

export default function CrmOpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const opportunityId = Number(id);

  const stagesQuery = useQuery({
    queryKey: ["crm-stages"],
    queryFn: () => CrmService.listStages(),
  });

  const opportunityQuery = useQuery({
    queryKey: ["crm-opportunity", opportunityId],
    queryFn: () => CrmService.getOpportunity(opportunityId),
    enabled: Number.isFinite(opportunityId) && opportunityId > 0,
  });

  const stage = stagesQuery.data?.find(
    (s) => s.id === opportunityQuery.data?.stageId,
  );

  const isLoading = stagesQuery.isLoading || opportunityQuery.isLoading;
  const isError = stagesQuery.isError || opportunityQuery.isError;
  const data = opportunityQuery.data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <BadgePercent className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">
              {data?.name ?? "Oportunidad"}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Detalle de oportunidad del pipeline.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/crm">
            <ArrowLeft className="h-4 w-4" />
            Volver al kanban
          </Link>
        </Button>
      </div>

      <div className="rounded-lg bg-card shadow-xl overflow-hidden border border-border p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-3">Cargando oportunidad…</span>
          </div>
        ) : isError || !data ? (
          <p className="text-center py-10 text-destructive">
            {opportunityQuery.error instanceof Error
              ? opportunityQuery.error.message
              : "Oportunidad no encontrada."}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Partner</p>
              <p className="font-medium">{data.partnerName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Estado</p>
              <Badge variant={CRM_OPPORTUNITY_STATUS_BADGE[data.status]}>
                {CRM_OPPORTUNITY_STATUS_LABELS[data.status]}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Etapa</p>
              <p className="font-medium">
                {stage?.name ?? `Etapa #${data.stageId}`}
              </p>
              {stage ? (
                <p className="text-xs text-muted-foreground">{stage.code}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Ingreso esperado</p>
              <p className="font-bold">
                {formatCurrency(
                  data.expectedRevenue.amount,
                  data.expectedRevenue.currency,
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Creada</p>
              <p className="font-medium">{formatDate(data.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Cerrada</p>
              <p className="font-medium">
                {data.closedAt ? formatDate(data.closedAt) : "—"}
              </p>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs text-muted-foreground">Notas</p>
              <p className="text-sm">
                {data.notes ?? (
                  <span className="text-muted-foreground">Sin notas</span>
                )}
              </p>
            </div>
            {data.lostReason ? (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Motivo de pérdida</p>
                <p className="text-sm">{data.lostReason}</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
