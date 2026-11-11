import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  ClipboardList,
  Loader2,
  Recycle,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { MrpService } from "@/api/services/mrpService";
import { MrpSubNav } from "@/components/mrp/MrpSubNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type {
  ManufacturingOrderResponse,
  ManufacturingOrderStatus,
  MoListQuery,
} from "@/types/inventory/mrp";
import { formatMrpInstant, MO_STATUS_BADGE, MO_STATUS_LABELS } from "./mrpLabels";

type StatusFilter = MoListQuery["status"];

function canCancel(status: ManufacturingOrderStatus): boolean {
  return status === "DRAFT" || status === "CONFIRMED" || status === "IN_PROGRESS";
}

function canScrap(status: ManufacturingOrderStatus): boolean {
  return status === "IN_PROGRESS";
}

export default function ManufacturingOrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("OPEN");
  const [selected, setSelected] = useState<ManufacturingOrderResponse | null>(
    null,
  );
  const [pendingCancel, setPendingCancel] =
    useState<ManufacturingOrderResponse | null>(null);
  const [scrapTarget, setScrapTarget] =
    useState<ManufacturingOrderResponse | null>(null);

  const listQuery = useQuery({
    queryKey: ["mrp-orders", search, statusFilter],
    queryFn: () => MrpService.listOrders({ search, status: statusFilter }),
    staleTime: 30_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => MrpService.cancelOrder(id),
    onSuccess: (mo) => {
      toast.success(`${mo.name} anulada. El documento permanece en el libro.`);
      queryClient.invalidateQueries({ queryKey: ["mrp-orders"] });
      queryClient.invalidateQueries({ queryKey: ["mrp-hub-summary"] });
      setPendingCancel(null);
      setSelected((cur) => (cur?.id === mo.id ? mo : cur));
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "No se pudo anular.");
    },
  });

  const scrapMutation = useMutation({
    mutationFn: (input: {
      orderId: number;
      productId: number;
      qty: number;
      reason: string;
    }) =>
      MrpService.recordComponentScrap(input.orderId, {
        productId: input.productId,
        qty: input.qty,
        reason: input.reason,
      }),
    onSuccess: (mo) => {
      toast.success("Scrap documentado. El consumo teórico se conserva.");
      queryClient.invalidateQueries({ queryKey: ["mrp-orders"] });
      queryClient.invalidateQueries({ queryKey: ["mrp-hub-summary"] });
      setScrapTarget(null);
      setSelected(mo);
    },
    onError: (err: unknown) => {
      toast.error(
        err instanceof Error ? err.message : "No se pudo registrar el scrap.",
      );
    },
  });

  const rows = listQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Órdenes de fabricación</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Estados del documento y scrap de componentes documentado.
          {MrpService.isMockMode() ? " (demo local)" : null}
        </p>
      </div>

      <MrpSubNav />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar MO, BOM, SKU…"
            className="pl-9"
            aria-label="Buscar órdenes"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["OPEN", "Abiertas"],
              ["ALL", "Todas"],
              ["DRAFT", "Borrador"],
              ["CONFIRMED", "Confirmada"],
              ["IN_PROGRESS", "En progreso"],
              ["DONE", "Hecha"],
              ["CANCELLED", "Anulada"],
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

      <section className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
        {listQuery.isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-3">Cargando órdenes…</span>
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
            No hay órdenes de fabricación para mostrar.
          </p>
        ) : (
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Almacén</TableHead>
                <TableHead>Programada</TableHead>
                <TableHead className="text-right">A producir</TableHead>
                <TableHead className="text-right">Producido</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((mo) => (
                <TableRow key={mo.id} className="transition-colors duration-150">
                  <TableCell className="font-medium">{mo.name}</TableCell>
                  <TableCell className="text-sm">
                    {mo.productSku} — {mo.productName}
                  </TableCell>
                  <TableCell>
                    <Badge variant={MO_STATUS_BADGE[mo.status]}>
                      {MO_STATUS_LABELS[mo.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{mo.warehouseCode}</TableCell>
                  <TableCell className="text-sm">
                    {formatMrpInstant(mo.scheduledAt)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {mo.qtyToProduce}
                  </TableCell>
                  <TableCell className="text-right">{mo.qtyProduced}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelected(mo)}
                      >
                        Ver
                      </Button>
                      {canScrap(mo.status) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setScrapTarget(mo)}
                          title="Documentar scrap"
                        >
                          <Recycle className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {canCancel(mo.status) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setPendingCancel(mo)}
                          title="Anular orden"
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
        <MoDetailPanel
          order={selected}
          onClose={() => setSelected(null)}
          onCancel={() => setPendingCancel(selected)}
          onScrap={() => setScrapTarget(selected)}
        />
      ) : null}

      {pendingCancel ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="max-w-sm w-full rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="border-b border-border pb-3 space-y-1">
              <h3 className="text-lg font-bold">Anular orden</h3>
              <p className="text-sm text-muted-foreground">
                ¿Anular {pendingCancel.name}? Queda en el libro como anulada (no se
                borra).
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
                className="gap-2"
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate(pendingCancel.id)}
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

      {scrapTarget ? (
        <ScrapDialog
          order={scrapTarget}
          pending={scrapMutation.isPending}
          onClose={() => setScrapTarget(null)}
          onSubmit={(payload) =>
            scrapMutation.mutate({ orderId: scrapTarget.id, ...payload })
          }
        />
      ) : null}
    </div>
  );
}

function MoDetailPanel({
  order,
  onClose,
  onCancel,
  onScrap,
}: {
  order: ManufacturingOrderResponse;
  onClose: () => void;
  onCancel: () => void;
  onScrap: () => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-card shadow-xl overflow-hidden space-y-0">
      <div className="flex items-start justify-between gap-4 border-b border-border bg-muted/40 px-4 py-3">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">{order.name}</h2>
          <p className="text-sm text-muted-foreground">
            BOM {order.bomCode} · {order.productSku}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {canScrap(order.status) ? (
            <Button variant="outline" size="sm" className="gap-2" onClick={onScrap}>
              <Recycle className="h-4 w-4" />
              Documentar scrap
            </Button>
          ) : null}
          {canCancel(order.status) ? (
            <Button variant="outline" size="sm" className="gap-2" onClick={onCancel}>
              <Ban className="h-4 w-4" />
              Anular
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex flex-wrap gap-3 text-sm">
          <Badge variant={MO_STATUS_BADGE[order.status]}>
            {MO_STATUS_LABELS[order.status]}
          </Badge>
          <span>
            Almacén: <span className="font-medium">{order.warehouseCode}</span>
          </span>
          <span>
            Programada:{" "}
            <span className="font-medium">
              {formatMrpInstant(order.scheduledAt)}
            </span>
          </span>
          <span>
            Progreso:{" "}
            <span className="font-bold">
              {order.qtyProduced}/{order.qtyToProduce} {order.uom}
            </span>
          </span>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Componentes</h3>
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Teórico</TableHead>
                <TableHead className="text-right">Consumido</TableHead>
                <TableHead className="text-right">Scrap</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.components.map((c) => (
                <TableRow key={c.id} className="transition-colors duration-150">
                  <TableCell className="font-medium">
                    {c.productSku} — {c.productName}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {c.theoreticalQty}
                  </TableCell>
                  <TableCell className="text-right">{c.consumedQty}</TableCell>
                  <TableCell className="text-right">
                    {c.scrapQty > 0 ? (
                      <Badge variant="warning">{c.scrapQty}</Badge>
                    ) : (
                      0
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Scrap documentado</h3>
          {order.scraps.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Sin entradas de scrap en esta orden.
            </p>
          ) : (
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Componente</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.scraps.map((s) => (
                  <TableRow key={s.id} className="transition-colors duration-150">
                    <TableCell className="font-medium">
                      {s.productSku} — {s.productName}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {s.qty} {s.uom}
                    </TableCell>
                    <TableCell className="text-sm">{s.reason}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatMrpInstant(s.recordedAt)} · {s.recordedBy}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </section>
  );
}

function ScrapDialog({
  order,
  pending,
  onClose,
  onSubmit,
}: {
  order: ManufacturingOrderResponse;
  pending: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    productId: number;
    qty: number;
    reason: string;
  }) => void;
}) {
  const defaultProductId = order.components[0]?.productId;
  const [productId, setProductId] = useState<string>(
    defaultProductId != null ? String(defaultProductId) : "",
  );
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState("");

  const selectedLine = useMemo(
    () => order.components.find((c) => String(c.productId) === productId),
    [order.components, productId],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
        <div className="border-b border-border pb-3 space-y-1">
          <h3 className="text-lg font-bold">Documentar scrap</h3>
          <p className="text-sm text-muted-foreground">
            Merma de componente en {order.name}. Queda registrada; no se borra el
            consumo teórico.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scrap-component">Componente</Label>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger id="scrap-component">
              <SelectValue placeholder="Selecciona componente" />
            </SelectTrigger>
            <SelectContent>
              {order.components.map((c) => (
                <SelectItem key={c.productId} value={String(c.productId)}>
                  {c.productSku} — {c.productName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scrap-qty">
            Cantidad{selectedLine ? ` (${selectedLine.uom})` : ""}
          </Label>
          <Input
            id="scrap-qty"
            type="number"
            min={0}
            step="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scrap-reason">Motivo</Label>
          <Textarea
            id="scrap-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe la merma…"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Volver
          </Button>
          <Button
            className="gap-2 shadow-md"
            disabled={pending || !productId}
            onClick={() =>
              onSubmit({
                productId: Number(productId),
                qty: Number(qty),
                reason,
              })
            }
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Recycle className="h-4 w-4" />
            )}
            Registrar scrap
          </Button>
        </div>
      </div>
    </div>
  );
}
