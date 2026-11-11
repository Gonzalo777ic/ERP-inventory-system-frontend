import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  FileText,
  Loader2,
  Scale,
} from "lucide-react";
import { AccountingService } from "@/api/services/accountingService";
import { ContabilidadSubNav } from "@/components/accounting/ContabilidadSubNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format";
import { ACCOUNTING_DISPLAY_CURRENCY } from "@/types/accounting";

const SECTIONS = [
  {
    key: "entries",
    title: "Asientos",
    description:
      "Libro diario: borradores, publicados y contra-asientos. Cuentas desde el plan cargado.",
    to: "/contabilidad/asientos",
    icon: BookOpen,
    metricKey: "postedEntries" as const,
    metricLabel: "publicados",
    secondaryKey: "draftEntries" as const,
    secondaryLabel: "borradores",
  },
  {
    key: "invoices",
    title: "Facturas",
    description:
      "Facturas cliente y proveedor con asiento propuesto. Totales desde el documento.",
    to: "/contabilidad/facturas",
    icon: FileText,
    metricKey: "openInvoices" as const,
    metricLabel: "abiertas",
    secondaryKey: null,
    secondaryLabel: null,
  },
  {
    key: "ledger",
    title: "CxC / CxP",
    description:
      "Cuentas por cobrar y por pagar con cuotas y vencimientos. Sin delete de libro.",
    to: "/contabilidad/cxc-cxp",
    icon: Scale,
    metricKey: "arOpenBalance" as const,
    metricLabel: "saldo CxC",
    secondaryKey: "apOpenBalance" as const,
    secondaryLabel: "saldo CxP",
    money: true,
  },
] as const;

export default function ContabilidadHub() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["accounting-hub-summary"],
    queryFn: () => AccountingService.getHubSummary(),
    staleTime: 30_000,
  });

  const money = (n: number) =>
    formatCurrency(n, ACCOUNTING_DISPLAY_CURRENCY);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Calculator className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Contabilidad</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Asientos, facturas y cartera CxC/CxP.
            {AccountingService.isMockMode() ? " (demo local)" : null}
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
            <Calculator className="h-4 w-4" />
          )}
          Actualizar
        </Button>
      </div>

      <ContabilidadSubNav />

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Cargando resumen…</span>
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
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const primary = data[section.metricKey];
            const secondary =
              section.secondaryKey != null
                ? data[section.secondaryKey]
                : null;
            const isMoney = "money" in section && section.money;

            return (
              <section
                key={section.key}
                className="rounded-lg border border-border bg-card p-5 shadow-xl space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6 text-primary" aria-hidden />
                    <h2 className="text-xl font-bold">{section.title}</h2>
                  </div>
                  <Badge variant="info" className="border-0">
                    {isMoney ? money(primary as number) : primary}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isMoney
                    ? `${money(primary as number)} ${section.metricLabel}`
                    : `${primary} ${section.metricLabel}`}
                  {secondary != null && section.secondaryLabel
                    ? ` · ${
                        isMoney
                          ? money(secondary as number)
                          : secondary
                      } ${section.secondaryLabel}`
                    : null}
                </p>
                {(data.overdueArCount > 0 || data.overdueApCount > 0) &&
                section.key === "ledger" ? (
                  <p className="text-xs text-danger">
                    {data.overdueArCount} CxC vencidas · {data.overdueApCount}{" "}
                    CxP vencidas
                  </p>
                ) : null}
                <Button asChild className="gap-2 shadow-md w-full sm:w-auto">
                  <Link to={section.to}>
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
        El plan de cuentas y los diarios se cargan por API o fixtures. La
        anulación de asientos crea contra-asiento; no hay delete físico de
        libros.
      </p>
    </div>
  );
}
