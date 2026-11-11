import { useQuery } from "@tanstack/react-query";
import { CreditCard, Loader2 } from "lucide-react";
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
import {
  AR_DOC_STATUS_BADGE,
  AR_DOC_STATUS_LABELS,
  formatReportInstant,
  formatReportMoney,
} from "./reportLabels";
import { formatDate } from "@/utils/format";

export default function ArReportPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["reports-ar"],
    queryFn: () => ReportsService.getArKpi(),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Informe de CxC</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Cuentas por cobrar: saldos, antigüedad y vencidos (API/mock local).
          {ReportsService.isMockMode() ? " (demo local)" : null}
        </p>
        {data ? (
          <p className="text-xs text-muted-foreground">
            Corte: {formatReportInstant(data.asOf)}
          </p>
        ) : null}
      </div>

      <ReportsSubNav />

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Cargando CxC…</span>
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
              label="Saldo abierto"
              value={formatReportMoney(data.openBalance)}
            />
            <Metric
              label="Saldo vencido"
              value={formatReportMoney(data.overdueBalance)}
            />
            <Metric
              label="Documentos abiertos"
              value={String(data.openDocumentCount)}
            />
            <Metric
              label="Documentos vencidos"
              value={String(data.overdueDocumentCount)}
            />
          </div>

          <section className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
            <div className="border-b border-border bg-muted/40 px-4 py-3">
              <h2 className="text-2xl font-bold">Antigüedad</h2>
            </div>
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Cubo</TableHead>
                  <TableHead className="text-right">Documentos</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.aging.map((b) => (
                  <TableRow key={b.key} className="transition-colors duration-150">
                    <TableCell className="font-medium">{b.label}</TableCell>
                    <TableCell className="text-right">{b.documentCount}</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatReportMoney(b.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <section className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
            <div className="border-b border-border bg-muted/40 px-4 py-3">
              <h2 className="text-2xl font-bold">Documentos</h2>
            </div>
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Vence</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Días</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.documents.map((d) => (
                  <TableRow key={d.id} className="transition-colors duration-150">
                    <TableCell className="font-medium">{d.documentNumber}</TableCell>
                    <TableCell>{d.partnerName}</TableCell>
                    <TableCell>{formatDate(d.dueDate)}</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatReportMoney(d.balance)}
                    </TableCell>
                    <TableCell className="text-right">{d.daysOverdue}</TableCell>
                    <TableCell>
                      <Badge variant={AR_DOC_STATUS_BADGE[d.status]}>
                        {AR_DOC_STATUS_LABELS[d.status]}
                      </Badge>
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
