import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ClipboardList,
  Factory,
  Layers,
  Loader2,
  Recycle,
} from "lucide-react";
import { MrpService } from "@/api/services/mrpService";
import { MrpSubNav } from "@/components/mrp/MrpSubNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CARDS = [
  {
    key: "bom",
    title: "Listas de materiales",
    description:
      "BOM multi-nivel ligera. Dar de baja conserva histórico (soft-delete).",
    to: "/mrp/boms",
    icon: Layers,
    countKey: "bomActive" as const,
    hintKey: "bomRetired" as const,
    hintLabel: "dadas de baja",
  },
  {
    key: "mo",
    title: "Órdenes de fabricación",
    description:
      "Borrador → confirmada → en progreso → hecha. Anulación deja el documento en el libro.",
    to: "/mrp/orders",
    icon: ClipboardList,
    countKey: "moOpen" as const,
    hintKey: "moDone" as const,
    hintLabel: "hechas",
  },
  {
    key: "scrap",
    title: "Scrap documentado",
    description:
      "Merma de componentes con motivo; no borra filas de consumo.",
    to: "/mrp/orders",
    icon: Recycle,
    countKey: "scrapEntries" as const,
    hintKey: "moCancelled" as const,
    hintLabel: "órdenes anuladas",
  },
] as const;

export default function MrpHub() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["mrp-hub-summary"],
    queryFn: () => MrpService.getHubSummary(),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Factory className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">MRP</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manufactura ligera: BOM, órdenes y scrap de componentes.
            {MrpService.isMockMode() ? " (demo local)" : null}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Factory className="h-4 w-4" />
          )}
          Actualizar
        </Button>
      </div>

      <MrpSubNav />

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Cargando MRP…</span>
        </div>
      ) : null}

      {isError ? (
        <p className="text-center py-10 text-destructive">
          No se pudo cargar el resumen:{" "}
          {error instanceof Error ? error.message : "error desconocido"}
        </p>
      ) : null}

      {data ? (
        <div className="grid gap-4 md:grid-cols-3">
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <section
                key={card.key}
                className="rounded-lg border border-border bg-card p-5 shadow-xl space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6 text-primary" aria-hidden />
                    <h2 className="text-xl font-bold">{card.title}</h2>
                  </div>
                  <Badge variant="info" className="border-0">
                    {data[card.countKey]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{card.description}</p>
                <p className="text-xs text-muted-foreground">
                  {data[card.hintKey]} {card.hintLabel}
                </p>
                <Button asChild className="gap-2 shadow-md w-full sm:w-auto">
                  <Link to={card.to}>
                    Abrir
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </section>
            );
          })}
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Las BOM usan «Dar de baja». Las órdenes y el scrap se anulan o documentan;
        no se eliminan del libro.
      </p>
    </div>
  );
}
