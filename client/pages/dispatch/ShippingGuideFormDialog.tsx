import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { DispatchGuideService, dispatchQueryKeys } from "@/api/services/dispatchGuideService";
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
import { Textarea } from "@/components/ui/textarea";
import type { CreateDispatchGuidePayload } from "@/types/dispatch";

type LineDraft = {
  key: string;
  productId: string;
  productName: string;
  quantity: string;
};

type ShippingGuideFormDialogProps = {
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onSaveDraft: (payload: CreateDispatchGuidePayload) => void;
  onIssue: (payload: CreateDispatchGuidePayload) => void;
};

const DEFAULT_LINE_QUANTITY = "1";

function emptyLine(): LineDraft {
  return {
    key: crypto.randomUUID(),
    productId: "",
    productName: "",
    quantity: DEFAULT_LINE_QUANTITY,
  };
}

function optionalId(raw: string, label: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`${label} debe ser un id numérico.`);
  }
  return Number(trimmed);
}

function buildPayload(form: {
  senderName: string;
  recipientName: string;
  recipientDocument: string;
  transferReason: string;
  originAddress: string;
  destinationAddress: string;
  saleId: string;
  saleOrderId: string;
  notes: string;
  lines: LineDraft[];
}): CreateDispatchGuidePayload {
  if (!form.senderName.trim()) throw new Error("Indique el remitente.");
  if (!form.recipientName.trim()) throw new Error("Indique el destinatario.");
  if (!form.transferReason) throw new Error("Seleccione el motivo de traslado.");
  if (!form.originAddress.trim()) throw new Error("Indique el punto de partida.");
  if (!form.destinationAddress.trim()) throw new Error("Indique el punto de llegada.");

  const filled = form.lines.filter(
    (line) => line.productName.trim() || line.productId.trim() || line.quantity.trim(),
  );
  if (filled.length === 0) {
    throw new Error("Agregue al menos una línea con producto y cantidad.");
  }

  return {
    senderName: form.senderName.trim(),
    recipientName: form.recipientName.trim(),
    recipientDocument: form.recipientDocument.trim() || null,
    transferReason: form.transferReason,
    originAddress: form.originAddress.trim(),
    destinationAddress: form.destinationAddress.trim(),
    saleId: optionalId(form.saleId, "La venta"),
    saleOrderId: optionalId(form.saleOrderId, "El pedido"),
    notes: form.notes.trim() || null,
    lines: filled.map((line) => {
      if (!line.productName.trim()) {
        throw new Error("Cada línea necesita el nombre del producto.");
      }
      if (!/^\d+$/.test(line.quantity.trim()) || Number(line.quantity.trim()) <= 0) {
        throw new Error("La cantidad debe ser un entero mayor que cero.");
      }
      return {
        productId: optionalId(line.productId, "El producto"),
        productName: line.productName.trim(),
        quantity: Number(line.quantity.trim()),
      };
    }),
  };
}

export function ShippingGuideFormDialog({
  open,
  pending,
  onClose,
  onSaveDraft,
  onIssue,
}: ShippingGuideFormDialogProps) {
  const [senderName, setSenderName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientDocument, setRecipientDocument] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [originAddress, setOriginAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [saleId, setSaleId] = useState("");
  const [saleOrderId, setSaleOrderId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);

  const reasonsQuery = useQuery({
    queryKey: dispatchQueryKeys.reasons(),
    queryFn: () => DispatchGuideService.transferReasons(),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    setSenderName("");
    setRecipientName("");
    setRecipientDocument("");
    setTransferReason("");
    setOriginAddress("");
    setDestinationAddress("");
    setSaleId("");
    setSaleOrderId("");
    setNotes("");
    setLines([emptyLine()]);
  }, [open]);

  const submit = (mode: "draft" | "issue") => {
    try {
      const payload = buildPayload({
        senderName,
        recipientName,
        recipientDocument,
        transferReason,
        originAddress,
        destinationAddress,
        saleId,
        saleOrderId,
        notes,
        lines,
      });
      if (mode === "draft") onSaveDraft(payload);
      else onIssue(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Revise los datos de la guía.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !pending) onClose(); }}>
      <DialogContent className="max-w-3xl rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Nueva guía de remisión</DialogTitle>
          <DialogDescription>
            Registre el traslado. Emitir asigna el número y pasa la guía de borrador a emitida.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Remitente" id="guide-sender">
            <Input id="guide-sender" value={senderName} onChange={(event) => setSenderName(event.target.value)} disabled={pending} />
          </Field>
          <Field label="Destinatario" id="guide-recipient">
            <Input id="guide-recipient" value={recipientName} onChange={(event) => setRecipientName(event.target.value)} disabled={pending} />
          </Field>
          <Field label="Documento del destinatario" id="guide-document">
            <Input id="guide-document" value={recipientDocument} onChange={(event) => setRecipientDocument(event.target.value)} disabled={pending} />
          </Field>
          <div className="space-y-2">
            <Label>Motivo de traslado</Label>
            <Select value={transferReason || undefined} onValueChange={setTransferReason} disabled={pending}>
              <SelectTrigger aria-label="Motivo de traslado">
                <SelectValue placeholder="Seleccione un motivo" />
              </SelectTrigger>
              <SelectContent>
                {(reasonsQuery.data ?? []).map((reason) => (
                  <SelectItem key={reason.key} value={reason.key}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Field label="Punto de partida" id="guide-origin">
            <Input id="guide-origin" value={originAddress} onChange={(event) => setOriginAddress(event.target.value)} disabled={pending} />
          </Field>
          <Field label="Punto de llegada" id="guide-destination">
            <Input id="guide-destination" value={destinationAddress} onChange={(event) => setDestinationAddress(event.target.value)} disabled={pending} />
          </Field>
          <Field label="Pedido (opcional)" id="guide-order">
            <Input id="guide-order" inputMode="numeric" value={saleOrderId} onChange={(event) => setSaleOrderId(event.target.value)} disabled={pending} />
          </Field>
          <Field label="Venta (opcional)" id="guide-sale">
            <Input id="guide-sale" inputMode="numeric" value={saleId} onChange={(event) => setSaleId(event.target.value)} disabled={pending} />
          </Field>
        </div>

        <div className="space-y-2">
          <Label htmlFor="guide-notes">Notas</Label>
          <Textarea id="guide-notes" value={notes} onChange={(event) => setNotes(event.target.value)} disabled={pending} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Líneas del traslado</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => setLines((current) => [...current, emptyLine()])}
            >
              <Plus className="h-4 w-4" />
              Agregar línea
            </Button>
          </div>
          <div className="space-y-3">
            {lines.map((line) => (
              <div key={line.key} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_140px_120px_auto]">
                <Input
                  aria-label="Producto"
                  placeholder="Producto"
                  value={line.productName}
                  disabled={pending}
                  onChange={(event) => updateLine(setLines, line.key, { productName: event.target.value })}
                />
                <Input
                  aria-label="Id de producto"
                  placeholder="Id producto"
                  inputMode="numeric"
                  value={line.productId}
                  disabled={pending}
                  onChange={(event) => updateLine(setLines, line.key, { productId: event.target.value })}
                />
                <Input
                  aria-label="Cantidad"
                  placeholder="Cantidad"
                  inputMode="numeric"
                  value={line.quantity}
                  disabled={pending}
                  onChange={(event) => updateLine(setLines, line.key, { quantity: event.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={pending}
                  title="Quitar línea"
                  onClick={() =>
                    setLines((current) => {
                      const next = current.filter((item) => item.key !== line.key);
                      return next.length === 0 ? [emptyLine()] : next;
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="button" variant="outline" disabled={pending} onClick={() => submit("draft")}>
            Guardar borrador
          </Button>
          <Button type="button" disabled={pending} onClick={() => submit("issue")}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Emitir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function updateLine(
  setLines: Dispatch<SetStateAction<LineDraft[]>>,
  key: string,
  patch: Partial<LineDraft>,
) {
  setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
}
