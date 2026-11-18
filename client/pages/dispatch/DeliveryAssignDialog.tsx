import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AssignDeliveryPayload, DispatchGuide } from "@/types/dispatch";
import { documentLabel } from "./dispatchDisplay";

type DeliveryAssignDialogProps = {
  guide: DispatchGuide | null;
  pending: boolean;
  onClose: () => void;
  onAssign: (guideId: number, payload: AssignDeliveryPayload) => void;
};

export function DeliveryAssignDialog({ guide, pending, onClose, onAssign }: DeliveryAssignDialogProps) {
  const [assigneeName, setAssigneeName] = useState("");
  const [assigneeReference, setAssigneeReference] = useState("");
  const [medium, setMedium] = useState("");

  useEffect(() => {
    if (!guide) return;
    setAssigneeName(guide.assigneeName ?? "");
    setAssigneeReference(guide.assigneeReference ?? "");
    setMedium(guide.medium ?? "");
  }, [guide]);

  const submit = () => {
    if (!guide) return;
    if (!assigneeName.trim() && !assigneeReference.trim()) {
      toast.error("Indique el nombre o la referencia del delivery.");
      return;
    }
    onAssign(guide.id, {
      assigneeName: assigneeName.trim() || null,
      assigneeReference: assigneeReference.trim() || null,
      medium: medium.trim() || null,
    });
  };

  return (
    <Dialog open={guide != null} onOpenChange={(next) => { if (!next && !pending) onClose(); }}>
      <DialogContent className="max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Asignar delivery</DialogTitle>
          <DialogDescription>
            {guide
              ? `${documentLabel(guide)} · ${guide.recipientName}`
              : "Seleccione una guía emitida."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="delivery-name">Nombre del repartidor</Label>
            <Input
              id="delivery-name"
              value={assigneeName}
              onChange={(event) => setAssigneeName(event.target.value)}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delivery-reference">Referencia o id</Label>
            <Input
              id="delivery-reference"
              value={assigneeReference}
              onChange={(event) => setAssigneeReference(event.target.value)}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delivery-medium">Medio de entrega</Label>
            <Input
              id="delivery-medium"
              value={medium}
              placeholder="Vehículo, placa o medio"
              onChange={(event) => setMedium(event.target.value)}
              disabled={pending}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Basta el nombre o la referencia. La asignación queda registrada en la guía emitida.
          </p>
        </div>
        <DialogFooter className="gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Registrar asignación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
