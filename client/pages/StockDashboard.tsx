import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRightLeft,
  Boxes,
  ClipboardList,
  Loader2,
  Package,
  Search,
  Warehouse,
} from "lucide-react";
import { StockOpsService } from "../api/services/stockOpsService";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  LOCATION_KIND_LABELS,
  type StockQuantResponse,
} from "../types/inventory/stockOps";

function formatInstant(iso: string): string {
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function matchesQuant(q: StockQuantResponse, search: string): boolean {
  if (!search.trim()) return true;
  const hay = [
    q.productSku,
    q.productName,
    q.warehouseCode,
    q.locationCode,
    q.lotNumber ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(search.trim().toLowerCase());
}

export default function StockDashboard() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["stock-dashboard"],
    queryFn: () => StockOpsService.getDashboard(),
    staleTime: 30_000,
  });

  const quants =
    data?.quants.filter((q) => matchesQuant(q, search)) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Boxes className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Inventario — Tablero de stock</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Existencias, reservas y disponibles según el servicio. Sin recálculo en el cliente.
            {StockOpsService.isMockMode() ? " (demo local)" : null}
          </p>
          {data ? (
            <p className="text-xs text-muted-foreground">
              Corte: {formatInstant(data.asOf)}
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
            <Package className="h-4 w-4" />
          )}
          Actualizar
        </Button>
      </div>

      <nav className="flex flex-wrap gap-3">
        <Button asChild variant="default" className="gap-2 shadow-md">
          <Link to="/inventory/pickings">
            <ArrowRightLeft className="h-5 w-5" />
            Pickings
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/inventory/adjustments">
            <ClipboardList className="h-5 w-5" />
            Ajustes / conteos
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/inventory">
            <Package className="h-5 w-5" />
            Lotes
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/warehouses">
            <Warehouse className="h-5 w-5" />
            Almacenes
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/alerts">
            <AlertTriangle className="h-5 w-5" />
            Alertas
          </Link>
        </Button>
      </nav>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-3">Cargando tablero de stock…</span>
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-border bg-card p-6 shadow-xl">
          <p className="font-semibold text-destructive">
            No se pudo cargar el tablero:{" "}
            {error instanceof Error ? error.message : "Error desconocido"}
          </p>
        </div>
      ) : data ? (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              label="SKUs con stock"
              value={String(data.skuCount)}
              hint={`${data.warehouseCount} almacenes`}
            />
            <Kpi
              label="En mano"
              value={String(data.onHandUnits)}
              hint="Unidades (API)"
            />
            <Kpi
              label="Reservado / disponible"
              value={`${data.reservedUnits} / ${data.availableUnits}`}
              hint="Totales del servicio"
            />
            <Kpi
              label="Abiertos"
              value={`${data.openPickingCount} pickings`}
              hint={`${data.pendingCycleCountCount} conteos · ${data.lowStockAlertCount} alertas`}
            />
          </ul>

          <section className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Quants</h2>
              </div>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar SKU, lote, almacén…"
                  className="pl-9"
                  aria-label="Filtrar quants"
                />
              </div>
            </div>

            {quants.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">
                No hay quants que coincidan con el filtro.
              </p>
            ) : (
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Almacén</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead className="text-right">En mano</TableHead>
                    <TableHead className="text-right">Reservado</TableHead>
                    <TableHead className="text-right">Disponible</TableHead>
                    <TableHead>UdM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quants.map((q) => (
                    <TableRow
                      key={q.id}
                      className="transition-colors duration-150"
                    >
                      <TableCell className="font-medium">{q.productSku}</TableCell>
                      <TableCell>{q.productName}</TableCell>
                      <TableCell>{q.warehouseCode}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>{q.locationCode}</span>
                          <Badge variant="neutral" className="w-fit">
                            {LOCATION_KIND_LABELS[q.locationKind]}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{q.lotNumber ?? "—"}</TableCell>
                      <TableCell className="text-right font-bold">
                        {q.onHandQty}
                      </TableCell>
                      <TableCell className="text-right">{q.reservedQty}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            q.availableQty <= 0
                              ? "danger"
                              : q.availableQty <= 5
                                ? "warning"
                                : "success"
                          }
                        >
                          {q.availableQty}
                        </Badge>
                      </TableCell>
                      <TableCell>{q.uom}</TableCell>
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

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <li className="rounded-lg border border-border bg-card p-4 shadow-xl space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </li>
  );
}
