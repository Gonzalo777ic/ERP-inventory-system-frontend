import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Boxes, Loader2, Search } from "lucide-react";
import { ReportsService } from "@/api/services/reportsService";
import { ReportsSubNav } from "@/components/reports/ReportsSubNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatReportInstant } from "./reportLabels";

export default function StockReportPage() {
  const [search, setSearch] = useState("");
  const [onlyBelowMin, setOnlyBelowMin] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["reports-stock"],
    queryFn: () => ReportsService.getStockKpi(),
    staleTime: 30_000,
  });

  const rows =
    data?.rows.filter((r) => {
      if (onlyBelowMin && !r.belowMin) return false;
      if (!search.trim()) return true;
      const hay = [r.productSku, r.productName, r.warehouseCode]
        .join(" ")
        .toLowerCase();
      return hay.includes(search.trim().toLowerCase());
    }) ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Boxes className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Informe de stock</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Existencias y umbrales según el reporte local (sin recálculo en UI).
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
          <span className="ml-3 text-muted-foreground">Cargando stock…</span>
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
            <Metric label="SKUs" value={String(data.totalSkus)} />
            <Metric label="Bajo mínimo" value={String(data.belowMinCount)} />
            <Metric label="En mano" value={String(data.totalOnHandUnits)} />
            <Metric label="Reservado" value={String(data.totalReservedUnits)} />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar SKU, almacén…"
                className="pl-9"
                aria-label="Buscar en informe de stock"
              />
            </div>
            <Button
              size="sm"
              variant={onlyBelowMin ? "default" : "outline"}
              onClick={() => setOnlyBelowMin((v) => !v)}
            >
              {onlyBelowMin ? "Ver todos" : "Solo bajo mínimo"}
            </Button>
          </div>

          <section className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
            {rows.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">
                No hay filas para el filtro actual.
              </p>
            ) : (
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Almacén</TableHead>
                    <TableHead className="text-right">En mano</TableHead>
                    <TableHead className="text-right">Disponible</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow
                      key={`${r.productSku}-${r.warehouseCode}`}
                      className="transition-colors duration-150"
                    >
                      <TableCell className="font-medium">{r.productSku}</TableCell>
                      <TableCell>{r.productName}</TableCell>
                      <TableCell>{r.warehouseCode}</TableCell>
                      <TableCell className="text-right font-bold">
                        {r.onHandQty}
                      </TableCell>
                      <TableCell className="text-right">{r.availableQty}</TableCell>
                      <TableCell className="text-right">{r.minQty}</TableCell>
                      <TableCell>
                        {r.belowMin ? (
                          <Badge variant="warning">Bajo mínimo</Badge>
                        ) : (
                          <Badge variant="success">OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
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
