import { useState } from "react";
import { Ban, FileCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type DispatchConfirmOverlayProps = {
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  destructive?: boolean;
  askReason?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
};

export function DispatchConfirmOverlay({
  title,
  description,
  confirmLabel,
  pending = false,
  destructive = false,
  askReason = false,
  onCancel,
  onConfirm,
}: DispatchConfirmOverlayProps) {
  const [reason, setReason] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={() => {
        if (!pending) onCancel();
      }}
    >
      <div
        className="max-w-sm w-full rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispatch-confirm-title"
      >
        <div className="border-b border-border pb-3 space-y-1">
          <h3 id="dispatch-confirm-title" className="text-lg font-bold">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {askReason ? (
          <div className="space-y-2">
            <Label htmlFor="void-reason">Motivo de anulación</Label>
            <Textarea
              id="void-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Por qué se anula la guía"
              disabled={pending}
            />
          </div>
        ) : null}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={pending}>
            Volver
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            className="gap-2"
            disabled={pending || (askReason && reason.trim() === "")}
            onClick={() => onConfirm(reason.trim())}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : destructive ? <Ban className="h-4 w-4" /> : <FileCheck className="h-4 w-4" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
