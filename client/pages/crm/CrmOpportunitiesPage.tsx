import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgePercent, Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { CrmService } from "../../api/services/crmService";
import { Button } from "../../components/ui/button";
import { CrmOpportunityCard } from "./CrmOpportunityCard";

export default function CrmOpportunitiesPage() {
  const queryClient = useQueryClient();

  const stagesQuery = useQuery({
    queryKey: ["crm-stages"],
    queryFn: () => CrmService.listStages(),
  });

  const opportunitiesQuery = useQuery({
    queryKey: ["crm-opportunities"],
    queryFn: () => CrmService.listOpportunities(),
  });

  const moveMutation = useMutation({
    mutationFn: ({
      opportunityId,
      stageId,
    }: {
      opportunityId: number;
      stageId: number;
    }) => CrmService.moveOpportunity(opportunityId, stageId),
    onSuccess: () => {
      toast.success("Oportunidad movida de etapa.");
      queryClient.invalidateQueries({ queryKey: ["crm-opportunities"] });
    },
    onError: (err: unknown) => {
      toast.error(
        err instanceof Error ? err.message : "No se pudo mover la oportunidad.",
      );
    },
  });

  const stages = stagesQuery.data ?? [];
  const opportunities = opportunitiesQuery.data ?? [];
  const isLoading = stagesQuery.isLoading || opportunitiesQuery.isLoading;
  const isError = stagesQuery.isError || opportunitiesQuery.isError;
  const errorMessage =
    (stagesQuery.error instanceof Error && stagesQuery.error.message) ||
    (opportunitiesQuery.error instanceof Error &&
      opportunitiesQuery.error.message) ||
    "Error al cargar el CRM.";

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <BadgePercent className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">CRM</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Kanban de oportunidades. Las etapas salen del pipeline configurado.
            {CrmService.isMockMode() ? " (fixtures locales — sin API)." : ""}
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/sales">
            <ShoppingBag className="h-5 w-5" />
            Ir a Ventas
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-3">Cargando pipeline…</span>
        </div>
      ) : isError ? (
        <p className="text-center py-10 text-destructive">{errorMessage}</p>
      ) : stages.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground">
          No hay etapas activas en el pipeline.
        </p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {stages.map((stage) => {
            const columnOpps = opportunities.filter(
              (o) => o.stageId === stage.id,
            );
            return (
              <section
                key={stage.id}
                className="min-w-[260px] max-w-[280px] flex-1 space-y-3"
                aria-label={`Etapa ${stage.name}`}
              >
                <header className="rounded-lg border border-border bg-muted/60 px-3 py-2 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold">{stage.name}</h2>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {columnOpps.length}
                    </span>
                  </div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {stage.code}
                  </p>
                </header>

                <div className="space-y-3 min-h-[120px]">
                  {columnOpps.length === 0 ? (
                    <p className="text-center py-6 text-xs text-muted-foreground">
                      Sin oportunidades
                    </p>
                  ) : (
                    columnOpps.map((opportunity) => (
                      <CrmOpportunityCard
                        key={opportunity.id}
                        opportunity={opportunity}
                        stages={stages}
                        moving={moveMutation.isPending}
                        onMove={(opportunityId, stageId) =>
                          moveMutation.mutate({ opportunityId, stageId })
                        }
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
