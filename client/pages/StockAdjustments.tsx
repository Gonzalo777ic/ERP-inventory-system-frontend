import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Ban,
  ClipboardList,
  Loader2,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
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
  CYCLE_COUNT_STATUS_BADGE,
  CYCLE_COUNT_STATUS_LABELS,
  type CycleCountResponse,
  type CycleCountStatus,
  type StockAdjustmentEntryPoint,
} from "../types/inventory/stockOps";

type StatusFilter = CycleCountStatus | "OPEN" | "ALL";

function formatInstant(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function canCancel(status: CycleCountStatus): boolean {
  return status === "DRAFT" || status === "IN_PROGRESS";
}

function formatSignedQty(value: number | null): string {
  if (value === null) return "—";
  if (value > 0) return `+${value}`;
  return String(value);
}

export default function StockAdjustments() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("OPEN");
  const [selected, setSelected] = useState<CycleCountResponse | null>(null);
  const [pendingCancel, setPendingCancel] =
    useState<CycleCountResponse | null>(null);

  const queryClient = useQueryClient();

  const entryPointsQuery = useQuery({
    queryKey: ["stock-adjustment-entry-points"],
    queryFn: () => StockOpsService.listAdjustmentEntryPoints(),
    staleTime: 60_000,
  });

  const countsQuery = useQuery({
    queryKey: [
      "stock-cycle-counts",
      statusFilter === "ALL" ? undefined : statusFilter,
      search,
    ],
    queryFn: () =>
      StockOpsService.listCycleCounts({
        search: search || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      }),
    staleTime: 15_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => StockOpsService.cancelCycleCount(id),
    onSuccess: (updated) => {
      toast.success(`Conteo ${updated.name} anulado`);
      setPendingCancel(null);
      if (selected?.id === updated.id) setSelected(updated);
      queryClient.invalidateQueries({ queryKey: ["stock-cycle-counts"] });
      queryClient.invalidateQueries({ queryKey: ["stock-dashboard"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "No se pudo anular el conteo");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Ajustes y conteos cíclicos</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Puntos de entrada a ajustes documentados. Las diferencias las aplica
            el dominio con movimientos compensatorios — el cliente solo muestra
            cantidades del API.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/stock">
            <ArrowLeft className="h-4 w-4" />
            Tablero de stock
          </Link>
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-primary" />
          Puntos de entrada
        </h2>
        {entryPointsQuery.isLoading ? (
          <div className="flex items-center py-8 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-3">Cargando entradas…</span>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(entryPointsQuery.data ?? []).map((entry) => (
              <EntryPointCard key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </section>

      <section
        id="cycle-counts"
        className="rounded-lg border border-border bg-card shadow-xl overflow-hidden"
      >
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold">Conteos cíclicos</h2>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conteo, SKU…"
              className="pl-9"
              aria-label="Buscar conteos"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-border p-4">
          {(
            [
              ["OPEN", "Abiertos"],
              ["ALL", "Todos"],
              ["IN_PROGRESS", "En curso"],
              ["DONE", "Hecho"],
              ["CANCELLED", "Anulado"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              size="sm"
              variant={statusFilter === value ? "default" : "outline"}
              onClick={() => setStatusFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>

        {countsQuery.isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-3">Cargando conteos…</span>
          </div>
        ) : countsQuery.isError ? (
          <p className="p-6 font-semibold text-destructive">
            Error:{" "}
            {countsQuery.error instanceof Error
              ? countsQuery.error.message
              : "desconocido"}
          </p>
        ) : (countsQuery.data ?? []).length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">
            No hay conteos para mostrar.
          </p>
        ) : (
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Almacén / ubicación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Líneas</TableHead>
                <TableHead className="text-right">Con diferencia</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(countsQuery.data ?? []).map((count) => (
                <TableRow
                  key={count.id}
                  className="transition-colors duration-150"
                >
                  <TableCell className="font-medium">{count.name}</TableCell>
                  <TableCell className="text-sm">
                    {count.warehouseCode} · {count.locationCode}
                  </TableCell>
                  <TableCell>
                    <Badge variant={CYCLE_COUNT_STATUS_BADGE[count.status]}>
                      {CYCLE_COUNT_STATUS_LABELS[count.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {count.lineCount}
                  </TableCell>
                  <TableCell className="text-right">
                    {count.varianceLineCount}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatInstant(count.createdAt)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelected(count)}
                      >
                        Ver
                      </Button>
                      {canCancel(count.status) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setPendingCancel(count)}
                          title="Anular conteo"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {selected ? (
        <CycleCountDetailPanel
          count={selected}
          onClose={() => setSelected(null)}
          onCancel={() => setPendingCancel(selected)}
        />
      ) : null}

      {pendingCancel ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="max-w-sm w-full rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="border-b border-border pb-3 space-y-1">
              <h3 className="text-lg font-bold">Anular conteo cíclico</h3>
              <p className="text-sm text-muted-foreground">
                ¿Anular {pendingCancel.name}? El documento queda en el libro como
                anulado; no se elimina el histórico.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setPendingCancel(null)}
                disabled={cancelMutation.isPending}
              >
                Volver
              </Button>
              <Button
                variant="destructive"
                onClick={() => cancelMutation.mutate(pendingCancel.id)}
                disabled={cancelMutation.isPending}
                className="gap-2"
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Ban className="h-4 w-4" />
                )}
                Anular
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EntryPointCard({ entry }: { entry: StockAdjustmentEntryPoint }) {
  return (
    <li>
      <Link
        to={entry.path}
        className="flex h-full flex-col gap-2 rounded-lg border border-border bg-card p-4 shadow-xl transition-colors duration-150 hover:bg-muted hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="text-sm font-semibold text-foreground">
          {entry.title}
        </span>
        <span className="text-xs text-muted-foreground">{entry.description}</span>
        <Badge variant="neutral" className="mt-auto w-fit">
          {entry.kind === "CYCLE_COUNT"
            ? "Conteo"
            : entry.kind === "SCRAP"
              ? "Scrap"
              : "Ajuste"}
        </Badge>
      </Link>
    </li>
  );
}

function CycleCountDetailPanel({
  count,
  onClose,
  onCancel,
}: {
  count: CycleCountResponse;
  onClose: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">{count.name}</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant={CYCLE_COUNT_STATUS_BADGE[count.status]}>
              {CYCLE_COUNT_STATUS_LABELS[count.status]}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {count.warehouseCode} · {count.locationCode}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {canCancel(count.status) ? (
            <Button variant="destructive" size="sm" onClick={onCancel}>
              Anular
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Lote</TableHead>
            <TableHead className="text-right">Teórico</TableHead>
            <TableHead className="text-right">Contado</TableHead>
            <TableHead className="text-right">Diferencia</TableHead>
            <TableHead>UdM</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {count.lines.map((line) => (
            <TableRow key={line.id} className="transition-colors duration-150">
              <TableCell className="font-medium">{line.productSku}</TableCell>
              <TableCell>{line.productName}</TableCell>
              <TableCell>{line.lotNumber ?? "—"}</TableCell>
              <TableCell className="text-right font-bold">
                {line.theoreticalQty}
              </TableCell>
              <TableCell className="text-right">
                {line.countedQty ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                <Badge
                  variant={
                    line.differenceQty === null
                      ? "neutral"
                      : line.differenceQty === 0
                        ? "success"
                        : "warning"
                  }
                >
                  {formatSignedQty(line.differenceQty)}
                </Badge>
              </TableCell>
              <TableCell>{line.uom}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="border-t border-border p-4 text-sm text-muted-foreground grid gap-1 sm:grid-cols-2">
        <p>Completado: {formatInstant(count.completedAt)}</p>
        <p>Anulado: {formatInstant(count.cancelledAt)}</p>
      </div>
    </section>
  );
}
