import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { DispatchGuideService, dispatchQueryKeys } from "@/api/services/dispatchGuideService";
import { dispatchService } from "@/api/services/dispatchService";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AssignDeliveryPayload, DispatchGuide } from "@/types/dispatch";
import { documentLabel } from "./dispatchDisplay";

type DeliveryAssignDialogProps = {
  guide: DispatchGuide | null;
  pending: boolean;
  onClose: () => void;
  onAssign: (guideId: number, payload: AssignDeliveryPayload) => void;
};

export function DeliveryAssignDialog({ guide, pending, onClose, onAssign }: DeliveryAssignDialogProps) {
  const [carrierId, setCarrierId] = useState("");
  const [scope, setScope] = useState("");
  const [medium, setMedium] = useState("");

  const carriersQuery = useQuery({
    queryKey: ["dispatch-carriers"],
    queryFn: () => dispatchService.carriers(),
    enabled: guide != null,
  });

  const scopesQuery = useQuery({
    queryKey: dispatchQueryKeys.scopes(),
    queryFn: () => DispatchGuideService.deliveryScopes(),
    enabled: guide != null,
  });

  useEffect(() => {
    if (!guide) return;
    setCarrierId(guide.carrierId != null ? String(guide.carrierId) : "");
    setScope(guide.deliveryScope ?? "");
    setMedium(guide.medium ?? "");
  }, [guide]);

  useEffect(() => {
    if (scope || !scopesQuery.data?.length) return;
    setScope(scopesQuery.data[0].key);
  }, [scope, scopesQuery.data]);

  const carriers = carriersQuery.data ?? [];

  const submit = () => {
    if (!guide) return;
    if (!/^\d+$/.test(carrierId)) {
      toast.error("Seleccione un transportista vigente.");
      return;
    }
    onAssign(guide.id, {
      carrierId: Number(carrierId),
      scope: scope || null,
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
            <Label>Transportista</Label>
            <Select value={carrierId || undefined} onValueChange={setCarrierId} disabled={pending || carriersQuery.isLoading}>
              <SelectTrigger aria-label="Transportista">
                <SelectValue placeholder={carriersQuery.isLoading ? "Cargando fichas…" : "Seleccione un transportista"} />
              </SelectTrigger>
              <SelectContent>
                {carriers.map((carrier) => (
                  <SelectItem key={carrier.id} value={String(carrier.id)}>
                    {carrier.displayName} · {carrier.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {carriersQuery.isError ? (
              <p className="text-sm text-destructive">No se pudieron cargar los transportistas.</p>
            ) : null}
            {!carriersQuery.isLoading && carriers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay transportistas vigentes.{" "}
                <Link to="/dispatch/carriers" className="font-medium text-primary">
                  Registrar una ficha
                </Link>
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Alcance</Label>
            <Select value={scope || undefined} onValueChange={setScope} disabled={pending}>
              <SelectTrigger aria-label="Alcance de la entrega">
                <SelectValue placeholder="Alcance" />
              </SelectTrigger>
              <SelectContent>
                {(scopesQuery.data ?? []).map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="delivery-medium">Medio de entrega</Label>
            <Input
              id="delivery-medium"
              value={medium}
              placeholder="Vehículo o placa, si hace falta anotarlo"
              onChange={(event) => setMedium(event.target.value)}
              disabled={pending}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {guide?.saleOrderId != null
              ? `Queda el transportista en la guía y se abre su recorrido para el pedido ${guide.saleOrderId}.`
              : "Queda el transportista en la guía. El recorrido del escritorio se abre cuando la guía referencia un pedido de venta."}
          </p>
        </div>
        <DialogFooter className="gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={pending || carriers.length === 0}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Registrar asignación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
