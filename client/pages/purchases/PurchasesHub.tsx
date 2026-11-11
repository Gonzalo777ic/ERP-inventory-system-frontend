import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  Loader2,
  PackageCheck,
  Tag,
} from "lucide-react";
import { ProcurementService } from "@/api/services/procurement";
import { ComprasSubNav } from "@/components/compras/ComprasSubNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PIPELINE_STALE_MS = 30_000;

const STEPS = [
  {
    key: "rfq",
    title: "RFQ / Cotizaciones",
    description:
      "Solicita y responde cotizaciones. Compara ofertas y convierte a OC.",
    to: "/quotations",
    countKey: "rfqOpen" as const,
    icon: Tag,
  },
  {
    key: "orders",
    title: "Órdenes de compra",
    description:
      "Borrador → enviado → confirmado. Cancela el documento; no se borra.",
    to: "/purchases/orders",
    countKey: "ordersOpen" as const,
    icon: ClipboardList,
  },
  {
    key: "receipt",
    title: "Recepción",
    description:
      "Recibe mercadería de OC confirmadas. Genera el hecho de entrada.",
    to: "/purchases/receipts",
    countKey: "toReceive" as const,
    icon: PackageCheck,
  },
] as const;

export default function PurchasesHub() {
  const { data: counts, isLoading } = useQuery({
    queryKey: ["procurement-pipeline"],
    queryFn: () => ProcurementService.pipelineCounts(),
    staleTime: PIPELINE_STALE_MS,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Cargando Compras…</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Compras</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Flujo RFQ → orden de compra → recepción. Soft-delete solo en
            maestros (proveedores); los documentos se cancelan o reciben.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link to="/suppliers">
              <FileText className="mr-2 h-4 w-4" />
              Proveedores
            </Link>
          </Button>
          <Button asChild className="shadow-md">
            <Link to="/purchases/orders">
              Ver órdenes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <ComprasSubNav />

      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const count = counts?.[step.countKey] ?? 0;
          return (
            <Link
              key={step.key}
              to={step.to}
              className="rounded-lg border border-border bg-card p-5 shadow-xl transition-colors duration-150 hover:bg-muted/60 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Paso {index + 1}
                    </p>
                    <h2 className="text-lg font-bold">{step.title}</h2>
                  </div>
                </div>
                <Badge variant={count > 0 ? "info" : "neutral"}>{count}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {step.description}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
        <div className="border-b border-border bg-muted/50 px-4 py-3">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <PackageCheck className="h-6 w-6 text-primary" />
            Resumen del pipeline
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          <SummaryCell label="RFQ abiertas" value={counts?.rfqOpen ?? 0} />
          <SummaryCell label="OC activas" value={counts?.ordersOpen ?? 0} />
          <SummaryCell
            label="Por recibir"
            value={counts?.toReceive ?? 0}
            emphasize
          />
          <SummaryCell label="OC cerradas" value={counts?.closed ?? 0} />
        </div>
      </div>
    </div>
  );
}

function SummaryCell({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: number;
  emphasize?: boolean;
}) {
  return (
    <div className="p-4 text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${emphasize ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}
