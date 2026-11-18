import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Eye, FileCheck, FileText, Loader2, Plus, Search, Truck } from "lucide-react";
import toast from "react-hot-toast";
import {
  DispatchGuideService,
  dispatchErrorMessage,
  dispatchQueryKeys,
} from "@/api/services/dispatchGuideService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { CreateDispatchGuidePayload, DispatchGuide, DispatchGuideQuery } from "@/types/dispatch";
import { DeliveryAssignDialog } from "./dispatch/DeliveryAssignDialog";
import { DispatchConfirmOverlay } from "./dispatch/DispatchConfirmOverlay";
import { ShippingGuideDetailDialog } from "./dispatch/ShippingGuideDetailDialog";
import { ShippingGuideFormDialog } from "./dispatch/ShippingGuideFormDialog";
import {
  ASSIGNMENT_BADGE,
  GUIDE_STATUS_BADGE,
  assigneeLabel,
  badgeVariant,
  documentLabel,
  referenceLabel,
} from "./dispatch/dispatchDisplay";

const ALL_STATUSES = "ALL";

class DraftKeptError extends Error {
  constructor(readonly source: unknown) {
    super("draft-kept");
  }
}

export default function ShippingGuides() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL_STATUSES);
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [pendingIssue, setPendingIssue] = useState<DispatchGuide | null>(null);
  const [pendingVoid, setPendingVoid] = useState<DispatchGuide | null>(null);
  const [pendingAssign, setPendingAssign] = useState<DispatchGuide | null>(null);

  const listQuery: DispatchGuideQuery = {
    status: status === ALL_STATUSES ? undefined : status,
    q: search.trim() || undefined,
    page,
  };

  const guidesQuery = useQuery({
    queryKey: dispatchQueryKeys.list(listQuery),
    queryFn: () => DispatchGuideService.list(listQuery),
  });

  const statusesQuery = useQuery({
    queryKey: dispatchQueryKeys.statuses(),
    queryFn: () => DispatchGuideService.statuses(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: dispatchQueryKeys.all });

  const saveDraft = useMutation({
    mutationFn: (payload: CreateDispatchGuidePayload) => DispatchGuideService.create(payload),
    onSuccess: () => {
      toast.success("Borrador guardado.");
      setFormOpen(false);
      refresh();
    },
    onError: (error) => toast.error(dispatchErrorMessage(error, "No se pudo guardar la guía.")),
  });

  const issueNew = useMutation({
    mutationFn: async (payload: CreateDispatchGuidePayload) => {
      const draft = await DispatchGuideService.create(payload);
      try {
        return await DispatchGuideService.issue(draft.id);
      } catch (error) {
        throw new DraftKeptError(error);
      }
    },
    onSuccess: (guide) => {
      toast.success(`Guía emitida ${documentLabel(guide)}.`);
      setFormOpen(false);
      refresh();
    },
    onError: (error) => {
      if (error instanceof DraftKeptError) {
        toast.error(dispatchErrorMessage(error.source, "No se pudo emitir. El borrador quedó en el listado."));
        setFormOpen(false);
        refresh();
        return;
      }
      toast.error(dispatchErrorMessage(error, "No se pudo emitir la guía."));
    },
  });

  const issueExisting = useMutation({
    mutationFn: (id: number) => DispatchGuideService.issue(id),
    onSuccess: (guide) => {
      toast.success(`Guía emitida ${documentLabel(guide)}.`);
      setPendingIssue(null);
      refresh();
    },
    onError: (error) => toast.error(dispatchErrorMessage(error, "No se pudo emitir la guía.")),
  });

  const voidGuide = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => DispatchGuideService.voidGuide(id, reason),
    onSuccess: () => {
      toast.success("Guía anulada. Sigue en el listado.");
      setPendingVoid(null);
      refresh();
    },
    onError: (error) => toast.error(dispatchErrorMessage(error, "No se pudo anular la guía.")),
  });

  const assignDelivery = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof DispatchGuideService.assignDelivery>[1] }) =>
      DispatchGuideService.assignDelivery(id, payload),
    onSuccess: () => {
      toast.success("Delivery asignado.");
      setPendingAssign(null);
      refresh();
    },
    onError: (error) => toast.error(dispatchErrorMessage(error, "No se pudo asignar el delivery.")),
  });

  const guides = guidesQuery.data?.content ?? [];
  const totalPages = guidesQuery.data?.totalPages ?? 0;
  const formPending = saveDraft.isPending || issueNew.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Guías de remisión</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Borrador, emisión y anulación. La guía anulada permanece en el listado.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              placeholder="Destinatario, guía, delivery…"
              className="pl-9"
              aria-label="Buscar guías"
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[180px]" aria-label="Filtrar estado">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUSES}>Todos</SelectItem>
              {(statusesQuery.data ?? []).map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" asChild>
            <Link to="/deliveries">
              <Truck className="h-5 w-5" />
              Delivery
            </Link>
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-5 w-5" />
            Nueva guía
          </Button>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
        {guidesQuery.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Cargando guías…</span>
          </div>
        ) : guidesQuery.isError ? (
          <p className="py-10 text-center text-destructive">
            {dispatchErrorMessage(guidesQuery.error, "No se pudieron cargar las guías.")}
          </p>
        ) : guides.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">No hay guías para los filtros actuales.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Documento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Destinatario</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead className="w-[160px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {guides.map((guide) => (
                <TableRow key={guide.id} className="transition-colors duration-150">
                  <TableCell className="font-medium">{documentLabel(guide)}</TableCell>
                  <TableCell>
                    <Badge variant={badgeVariant(GUIDE_STATUS_BADGE, guide.status)} className="border-0">
                      {guide.statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{guide.recipientName}</span>
                    <span className="block text-xs text-muted-foreground">{guide.senderName}</span>
                  </TableCell>
                  <TableCell>{guide.transferReasonLabel}</TableCell>
                  <TableCell className="text-muted-foreground">{referenceLabel(guide)}</TableCell>
                  <TableCell>
                    <Badge variant={badgeVariant(ASSIGNMENT_BADGE, guide.assignmentStatus)} className="border-0">
                      {assigneeLabel(guide)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Ver guía" onClick={() => setDetailId(guide.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {guide.canIssue ? (
                        <Button variant="ghost" size="icon" title="Emitir" onClick={() => setPendingIssue(guide)}>
                          <FileCheck className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {guide.canAssignDelivery ? (
                        <Button variant="ghost" size="icon" title="Asignar delivery" onClick={() => setPendingAssign(guide)}>
                          <Truck className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {guide.canVoid ? (
                        <Button variant="ghost" size="icon" title="Anular" onClick={() => setPendingVoid(guide)}>
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

      {totalPages > 1 ? (
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" disabled={page <= 0} onClick={() => setPage((current) => current - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages}
          </span>
          <Button variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((current) => current + 1)}>
            Siguiente
          </Button>
        </div>
      ) : null}

      <ShippingGuideFormDialog
        open={formOpen}
        pending={formPending}
        onClose={() => setFormOpen(false)}
        onSaveDraft={(payload) => saveDraft.mutate(payload)}
        onIssue={(payload) => issueNew.mutate(payload)}
      />
      <ShippingGuideDetailDialog guideId={detailId} onClose={() => setDetailId(null)} />
      <DeliveryAssignDialog
        guide={pendingAssign}
        pending={assignDelivery.isPending}
        onClose={() => setPendingAssign(null)}
        onAssign={(guideId, payload) => assignDelivery.mutate({ id: guideId, payload })}
      />
      {pendingIssue ? (
        <DispatchConfirmOverlay
          key={pendingIssue.id}
          title="Emitir guía"
          description={`Se emitirá la guía de ${pendingIssue.recipientName}. El número se asigna en esta transición.`}
          confirmLabel="Emitir"
          pending={issueExisting.isPending}
          onCancel={() => setPendingIssue(null)}
          onConfirm={() => issueExisting.mutate(pendingIssue.id)}
        />
      ) : null}
      {pendingVoid ? (
        <DispatchConfirmOverlay
          key={pendingVoid.id}
          title="Anular guía"
          description="La guía queda anulada y sigue en el listado. El histórico se conserva."
          confirmLabel="Anular"
          destructive
          askReason
          pending={voidGuide.isPending}
          onCancel={() => setPendingVoid(null)}
          onConfirm={(reason) => voidGuide.mutate({ id: pendingVoid.id, reason })}
        />
      ) : null}
    </div>
  );
}
