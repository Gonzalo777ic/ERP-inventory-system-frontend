import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CreditCard,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { ReportsService } from "@/api/services/reportsService";
import { ReportsSubNav } from "@/components/reports/ReportsSubNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatReportInstant, formatReportMoney } from "./reportLabels";

export default function ReportsHub() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["reports-hub"],
    queryFn: () => ReportsService.getHubSummary(),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Reportes</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Centro de KPIs del ERP (ventas, stock, CxC). Lectura local / mock —
            sin Feign cruzado desde la UI.
            {ReportsService.isMockMode() ? " (demo local)" : null}
          </p>
          {data ? (
            <p className="text-xs text-muted-foreground">
              Corte: {formatReportInstant(data.asOf)}
            </p>
          ) : null}
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
            <BarChart3 className="h-4 w-4" />
          )}
          Actualizar
        </Button>
      </div>

      <ReportsSubNav />

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Cargando KPIs…</span>
        </div>
      ) : null}

      {isError ? (
        <p className="text-center py-10 text-destructive">
          No se pudo cargar el centro:{" "}
          {error instanceof Error ? error.message : "error desconocido"}
        </p>
      ) : null}

      {data ? (
        <div className="grid gap-4 md:grid-cols-3">
          <KpiCard
            title="Ventas"
            icon={ShoppingBag}
            primary={formatReportMoney(data.salesMonthTotal)}
            primaryHint="neto del mes"
            badge={`${data.salesOrderCount} pedidos`}
            description="Serie mensual, ticket promedio y top productos."
            to="/reports/sales"
          />
          <KpiCard
            title="Stock"
            icon={Boxes}
            primary={String(data.stockOnHandUnits)}
            primaryHint="unidades en mano"
            badge={`${data.stockSkuBelowMin} bajo mínimo`}
            description="Existencias, reservas y SKUs bajo umbral."
            to="/reports/stock"
          />
          <KpiCard
            title="Cuentas por cobrar"
            icon={CreditCard}
            primary={formatReportMoney(data.arOpenBalance)}
            primaryHint="saldo abierto"
            badge={`${data.arOverdueCount} vencidos`}
            description="Antigüedad, vencidos y documentos abiertos."
            to="/reports/ar"
          />
        </div>
      ) : null}
    </div>
  );
}

function KpiCard({
  title,
  icon: Icon,
  primary,
  primaryHint,
  badge,
  description,
  to,
}: {
  title: string;
  icon: typeof ShoppingBag;
  primary: string;
  primaryHint: string;
  badge: string;
  description: string;
  to: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-xl space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 text-primary" aria-hidden />
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <Badge variant="info" className="border-0">
          {badge}
        </Badge>
      </div>
      <div>
        <p className="text-2xl font-bold">{primary}</p>
        <p className="text-xs text-muted-foreground">{primaryHint}</p>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Button asChild className="gap-2 shadow-md w-full sm:w-auto">
        <Link to={to}>
          Abrir informe
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </section>
  );
}
