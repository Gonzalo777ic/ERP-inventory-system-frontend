import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { DispatchGuideService, dispatchQueryKeys } from "@/api/services/dispatchGuideService";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/utils/format";
import {
  ASSIGNMENT_BADGE,
  GUIDE_STATUS_BADGE,
  assigneeLabel,
  badgeVariant,
  documentLabel,
  referenceLabel,
} from "./dispatchDisplay";

type ShippingGuideDetailDialogProps = {
  guideId: number | null;
  onClose: () => void;
};

export function ShippingGuideDetailDialog({ guideId, onClose }: ShippingGuideDetailDialogProps) {
  const detailQuery = useQuery({
    queryKey: dispatchQueryKeys.detail(guideId ?? 0),
    queryFn: () => DispatchGuideService.get(guideId as number),
    enabled: guideId != null,
  });

  const guide = detailQuery.data;

  return (
    <Dialog open={guideId != null} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-w-3xl rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {guide ? documentLabel(guide) : "Guía de remisión"}
          </DialogTitle>
          <DialogDescription>
            {guide ? `${guide.senderName} hacia ${guide.recipientName}` : "Detalle del traslado"}
          </DialogDescription>
        </DialogHeader>

        {detailQuery.isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Cargando guía…</span>
          </div>
        ) : detailQuery.isError || !guide ? (
          <p className="py-10 text-center text-destructive">No se pudo cargar la guía.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={badgeVariant(GUIDE_STATUS_BADGE, guide.status)} className="border-0">
                {guide.statusLabel}
              </Badge>
              <Badge variant={badgeVariant(ASSIGNMENT_BADGE, guide.assignmentStatus)} className="border-0">
                {guide.assignmentStatusLabel}
              </Badge>
            </div>
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <DetailItem label="Motivo" value={guide.transferReasonLabel} />
              <DetailItem label="Referencia" value={referenceLabel(guide)} />
              <DetailItem label="Documento destinatario" value={guide.recipientDocument || "Sin documento"} />
              <DetailItem label="Delivery" value={assigneeLabel(guide)} />
              <DetailItem label="Medio" value={guide.medium || "Sin medio"} />
              <DetailItem label="Emitida" value={guide.issuedAt ? formatDate(guide.issuedAt) : "Pendiente de emisión"} />
              <DetailItem label="Punto de partida" value={guide.originAddress} />
              <DetailItem label="Punto de llegada" value={guide.destinationAddress} />
            </dl>
            {guide.notes ? <p className="text-sm text-muted-foreground">{guide.notes}</p> : null}
            {guide.voidReason ? (
              <p className="text-sm text-muted-foreground">Anulación: {guide.voidReason}</p>
            ) : null}
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guide.lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
                        Esta guía no tiene líneas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    guide.lines.map((line) => (
                      <TableRow key={line.id} className="transition-colors duration-150">
                        <TableCell>
                          <span className="font-medium">{line.productName}</span>
                          {line.productId != null ? (
                            <span className="block text-xs text-muted-foreground">Id {line.productId}</span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right font-medium">{line.quantity}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
