import { useQuery } from "@tanstack/react-query";
import { Loader2, ShoppingBag } from "lucide-react";
import { ReportsService } from "@/api/services/reportsService";
import { ReportsSubNav } from "@/components/reports/ReportsSubNav";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatReportInstant, formatReportMoney } from "./reportLabels";

export default function SalesReportPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["reports-sales"],
    queryFn: () => ReportsService.getSalesKpi(),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Informe de ventas</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          KPIs comerciales del contexto de ventas (mock / API local).
          {ReportsService.isMockMode() ? " (demo local)" : null}
        </p>
        {data ? (
          <p className="text-xs text-muted-foreground">
            {data.periodLabel} · Corte {formatReportInstant(data.asOf)}
          </p>
        ) : null}
      </div>

      <ReportsSubNav />

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Cargando ventas…</span>
        </div>
      ) : null}

      {isError ? (
        <p className="text-center py-10 text-destructive">
          {error instanceof Error ? error.message : "Error desconocido"}
        </p>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Ventas netas"
              value={formatReportMoney(data.totalNetSales)}
            />
            <Metric label="Pedidos" value={String(data.totalOrders)} />
            <Metric
              label="Ticket promedio"
              value={formatReportMoney(data.avgTicket)}
            />
            <Metric
              label="Tasa de devolución"
              value={`${data.returnRatePct.toFixed(1)} %`}
            />
          </div>

          <section className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
            <div className="border-b border-border bg-muted/40 px-4 py-3">
              <h2 className="text-2xl font-bold">Serie mensual</h2>
            </div>
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Periodo</TableHead>
                  <TableHead className="text-right">Pedidos</TableHead>
                  <TableHead className="text-right">Neto</TableHead>
                  <TableHead className="text-right">Devoluciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.series.map((p) => (
                  <TableRow key={p.period} className="transition-colors duration-150">
                    <TableCell className="font-medium">{p.label}</TableCell>
                    <TableCell className="text-right">{p.orderCount}</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatReportMoney(p.netSales)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatReportMoney(p.returns)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <section className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
            <div className="border-b border-border bg-muted/40 px-4 py-3 flex items-center gap-3">
              <h2 className="text-2xl font-bold">Top productos</h2>
              <Badge variant="neutral">{data.topProducts.length}</Badge>
            </div>
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Unidades</TableHead>
                  <TableHead className="text-right">Neto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topProducts.map((p) => (
                  <TableRow
                    key={p.productSku}
                    className="transition-colors duration-150"
                  >
                    <TableCell className="font-medium">{p.productSku}</TableCell>
                    <TableCell>{p.productName}</TableCell>
                    <TableCell className="text-right">{p.units}</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatReportMoney(p.netSales)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-xl space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
