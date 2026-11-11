import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRightLeft,
  Ban,
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
  OPERATION_TYPE_LABELS,
  PICKING_STATUS_BADGE,
  PICKING_STATUS_LABELS,
  type OperationType,
  type PickingResponse,
  type PickingStatus,
} from "../types/inventory/stockOps";

type StatusFilter = PickingStatus | "OPEN" | "ALL";

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

function canCancel(status: PickingStatus): boolean {
  return status === "DRAFT" || status === "CONFIRMED";
}

export default function StockPickings() {
  const [searchParams] = useSearchParams();
  const typeFilter = searchParams.get("type") as OperationType | null;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("OPEN");
  const [selected, setSelected] = useState<PickingResponse | null>(null);
  const [pendingCancel, setPendingCancel] = useState<PickingResponse | null>(
    null,
  );

  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: [
      "stock-pickings",
      statusFilter === "ALL" ? undefined : statusFilter,
      search,
    ],
    queryFn: () =>
      StockOpsService.listPickings({
        search: search || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      }),
    staleTime: 15_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => StockOpsService.cancelPicking(id),
    onSuccess: (updated) => {
      toast.success(`Picking ${updated.name} anulado`);
      setPendingCancel(null);
      if (selected?.id === updated.id) setSelected(updated);
      queryClient.invalidateQueries({ queryKey: ["stock-pickings"] });
      queryClient.invalidateQueries({ queryKey: ["stock-dashboard"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "No se pudo anular el picking");
    },
  });

  const rows = useMemo(() => {
    const data = listQuery.data ?? [];
    if (!typeFilter) return data;
    return data.filter((p) => p.operationType === typeFilter);
  }, [listQuery.data, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <ArrowRightLeft className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Pickings / transferencias</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Estados draft → confirmado → hecho / anulado. Cantidades de demanda,
            reserva y hecho vienen del API.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/stock">
            <ArrowLeft className="h-4 w-4" />
            Tablero de stock
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar picking, SKU…"
            className="pl-9"
            aria-label="Buscar pickings"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["OPEN", "Abiertos"],
              ["ALL", "Todos"],
              ["DRAFT", "Borrador"],
              ["CONFIRMED", "Confirmado"],
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
      </div>

      {typeFilter ? (
        <p className="text-sm text-muted-foreground">
          Filtro de tipo:{" "}
          <Badge variant="info">{OPERATION_TYPE_LABELS[typeFilter]}</Badge>
        </p>
      ) : null}

      <section className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
        {listQuery.isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-3">Cargando pickings…</span>
          </div>
        ) : listQuery.isError ? (
          <p className="p-6 font-semibold text-destructive">
            Error:{" "}
            {listQuery.error instanceof Error
              ? listQuery.error.message
              : "desconocido"}
          </p>
        ) : rows.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">
            No hay pickings para mostrar.
          </p>
        ) : (
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Origen → Destino</TableHead>
                <TableHead>Programado</TableHead>
                <TableHead className="text-right">Demanda</TableHead>
                <TableHead className="text-right">Hecho</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow
                  key={p.id}
                  className="transition-colors duration-150"
                >
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    {OPERATION_TYPE_LABELS[p.operationType]}
                  </TableCell>
                  <TableCell>
                    <Badge variant={PICKING_STATUS_BADGE[p.status]}>
                      {PICKING_STATUS_LABELS[p.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.sourceLocationCode} → {p.destLocationCode}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatInstant(p.scheduledAt)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {p.totalDemandQty}
                  </TableCell>
                  <TableCell className="text-right">{p.totalDoneQty}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelected(p)}
                      >
                        Ver
                      </Button>
                      {canCancel(p.status) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setPendingCancel(p)}
                          title="Anular picking"
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
        <PickingDetailPanel
          picking={selected}
          onClose={() => setSelected(null)}
          onCancel={() => setPendingCancel(selected)}
        />
      ) : null}

      {pendingCancel ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="max-w-sm w-full rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="border-b border-border pb-3 space-y-1">
              <h3 className="text-lg font-bold">Anular picking</h3>
              <p className="text-sm text-muted-foreground">
                ¿Anular {pendingCancel.name}? Se libera la reserva; el documento
                queda en el libro como anulado (no se borra).
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

function PickingDetailPanel({
  picking,
  onClose,
  onCancel,
}: {
  picking: PickingResponse;
  onClose: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-card shadow-xl overflow-hidden space-y-0">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">{picking.name}</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant={PICKING_STATUS_BADGE[picking.status]}>
              {PICKING_STATUS_LABELS[picking.status]}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {OPERATION_TYPE_LABELS[picking.operationType]} ·{" "}
              {picking.warehouseCode}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {canCancel(picking.status) ? (
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
            <TableHead className="text-right">Demanda</TableHead>
            <TableHead className="text-right">Reservado</TableHead>
            <TableHead className="text-right">Hecho</TableHead>
            <TableHead>UdM</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {picking.lines.map((line) => (
            <TableRow key={line.id} className="transition-colors duration-150">
              <TableCell className="font-medium">{line.productSku}</TableCell>
              <TableCell>{line.productName}</TableCell>
              <TableCell>{line.lotNumber ?? "—"}</TableCell>
              <TableCell className="text-right font-bold">
                {line.demandQty}
              </TableCell>
              <TableCell className="text-right">{line.reservedQty}</TableCell>
              <TableCell className="text-right">{line.doneQty}</TableCell>
              <TableCell>{line.uom}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="border-t border-border p-4 text-sm text-muted-foreground grid gap-1 sm:grid-cols-2">
        <p>
          Origen → destino: {picking.sourceLocationCode} →{" "}
          {picking.destLocationCode}
        </p>
        <p>Confirmado: {formatInstant(picking.confirmedAt)}</p>
        <p>Hecho: {formatInstant(picking.doneAt)}</p>
        <p>Anulado: {formatInstant(picking.cancelledAt)}</p>
      </div>
    </section>
  );
}
