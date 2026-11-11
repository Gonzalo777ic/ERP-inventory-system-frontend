import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Layers, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { MrpService } from "@/api/services/mrpService";
import { MrpSubNav } from "@/components/mrp/MrpSubNav";
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
import type { BomResponse } from "@/types/inventory/mrp";
import {
  BOM_STATUS_BADGE,
  BOM_STATUS_LABELS,
  formatMrpInstant,
} from "./mrpLabels";

export default function BomListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [includeRetired, setIncludeRetired] = useState(false);
  const [selected, setSelected] = useState<BomResponse | null>(null);
  const [pendingRetire, setPendingRetire] = useState<BomResponse | null>(null);

  const listQuery = useQuery({
    queryKey: ["mrp-boms", search, includeRetired],
    queryFn: () =>
      MrpService.listBoms({ search, includeRetired }),
    staleTime: 30_000,
  });

  const retireMutation = useMutation({
    mutationFn: (id: number) => MrpService.retireBom(id),
    onSuccess: (bom) => {
      toast.success(`«${bom.code}» dada de baja. El histórico se conserva.`);
      queryClient.invalidateQueries({ queryKey: ["mrp-boms"] });
      queryClient.invalidateQueries({ queryKey: ["mrp-hub-summary"] });
      setPendingRetire(null);
      setSelected((cur) => (cur?.id === bom.id ? bom : cur));
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "No se pudo dar de baja.");
    },
  });

  const rows = listQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Layers className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Listas de materiales</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            BOM vigentes y componentes teóricos por unidad terminada.
            {MrpService.isMockMode() ? " (demo local)" : null}
          </p>
        </div>
      </div>

      <MrpSubNav />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar código, producto…"
            className="pl-9"
            aria-label="Buscar BOM"
          />
        </div>
        <Button
          size="sm"
          variant={includeRetired ? "default" : "outline"}
          onClick={() => setIncludeRetired((v) => !v)}
        >
          {includeRetired ? "Ocultar dadas de baja" : "Incluir dadas de baja"}
        </Button>
      </div>

      <section className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
        {listQuery.isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-3">Cargando BOM…</span>
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
            No hay listas de materiales para mostrar.
          </p>
        ) : (
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Producto terminado</TableHead>
                <TableHead className="text-right">Rendimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((bom) => (
                <TableRow key={bom.id} className="transition-colors duration-150">
                  <TableCell className="font-medium">{bom.code}</TableCell>
                  <TableCell>{bom.name}</TableCell>
                  <TableCell className="text-sm">
                    {bom.productSku} — {bom.productName}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {bom.productQty} {bom.uom}
                  </TableCell>
                  <TableCell>
                    <Badge variant={BOM_STATUS_BADGE[bom.status]}>
                      {BOM_STATUS_LABELS[bom.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelected(bom)}
                      >
                        Ver
                      </Button>
                      {bom.status === "ACTIVE" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setPendingRetire(bom)}
                          title="Dar de baja"
                        >
                          <Archive className="h-4 w-4" />
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
        <BomDetailPanel
          bom={selected}
          onClose={() => setSelected(null)}
          onRetire={() => setPendingRetire(selected)}
        />
      ) : null}

      {pendingRetire ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="max-w-sm w-full rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="border-b border-border pb-3 space-y-1">
              <h3 className="text-lg font-bold">Dar de baja BOM</h3>
              <p className="text-sm text-muted-foreground">
                ¿Dar de baja {pendingRetire.code}? El histórico se conserva; no se
                elimina físicamente.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setPendingRetire(null)}
                disabled={retireMutation.isPending}
              >
                Volver
              </Button>
              <Button
                variant="destructive"
                className="gap-2"
                disabled={retireMutation.isPending}
                onClick={() => retireMutation.mutate(pendingRetire.id)}
              >
                {retireMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
                Dar de baja
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BomDetailPanel({
  bom,
  onClose,
  onRetire,
}: {
  bom: BomResponse;
  onClose: () => void;
  onRetire: () => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-border bg-muted/40 px-4 py-3">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">{bom.code}</h2>
          <p className="text-sm text-muted-foreground">{bom.name}</p>
          <p className="text-xs text-muted-foreground">
            Actualizado: {formatMrpInstant(bom.updatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {bom.status === "ACTIVE" ? (
            <Button variant="outline" size="sm" className="gap-2" onClick={onRetire}>
              <Archive className="h-4 w-4" />
              Dar de baja
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex flex-wrap gap-3 text-sm">
          <Badge variant={BOM_STATUS_BADGE[bom.status]}>
            {BOM_STATUS_LABELS[bom.status]}
          </Badge>
          <span>
            Terminado:{" "}
            <span className="font-medium">
              {bom.productSku} — {bom.productName}
            </span>
          </span>
          <span>
            Rendimiento:{" "}
            <span className="font-bold">
              {bom.productQty} {bom.uom}
            </span>
          </span>
        </div>
        {bom.deletedAt ? (
          <p className="text-xs text-muted-foreground">
            Baja: {formatMrpInstant(bom.deletedAt)}
            {bom.deletedBy ? ` · ${bom.deletedBy}` : null}
          </p>
        ) : null}
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Componente</TableHead>
              <TableHead className="text-right">Qty / unidad</TableHead>
              <TableHead>UdM</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bom.components.map((c) => (
              <TableRow key={c.id} className="transition-colors duration-150">
                <TableCell className="font-medium">
                  {c.productSku} — {c.productName}
                </TableCell>
                <TableCell className="text-right font-bold">{c.qtyPerUnit}</TableCell>
                <TableCell>{c.uom}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
