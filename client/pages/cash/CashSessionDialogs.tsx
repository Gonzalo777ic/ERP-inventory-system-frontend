import { Loader2 } from "lucide-react";
import { CASH_PAYMENT_METHOD_OPTIONS } from "../../data/cashFixtures";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import type { CashRegisterResponse, CashSessionResponse } from "../../types/cash/session";

type OpenProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registers: CashRegisterResponse[];
  registerId: string;
  onRegisterIdChange: (value: string) => void;
  openingFloat: string;
  onOpeningFloatChange: (value: string) => void;
  pending: boolean;
  onConfirm: () => void;
};

export function OpenCashSessionDialog({
  open,
  onOpenChange,
  registers,
  registerId,
  onRegisterIdChange,
  openingFloat,
  onOpeningFloatChange,
  pending,
  onConfirm,
}: OpenProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle>Abrir sesión de caja</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cash-register">Caja</Label>
            <Select value={registerId} onValueChange={onRegisterIdChange}>
              <SelectTrigger id="cash-register">
                <SelectValue placeholder="Seleccionar caja…" />
              </SelectTrigger>
              <SelectContent>
                {registers.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.code} · {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="opening-float">Fondo de apertura</Label>
            <Input
              id="opening-float"
              value={openingFloat}
              onChange={(e) => onOpeningFloatChange(e.target.value)}
              inputMode="decimal"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="shadow-md"
            disabled={!registerId || pending}
            onClick={onConfirm}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Abrir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type MoveProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: "INCOME" | "EXPENSE";
  onKindChange: (value: "INCOME" | "EXPENSE") => void;
  concept: string;
  onConceptChange: (value: string) => void;
  method: string;
  onMethodChange: (value: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  reference: string;
  onReferenceChange: (value: string) => void;
  pending: boolean;
  onConfirm: () => void;
};

export function RegisterCashMovementDialog({
  open,
  onOpenChange,
  kind,
  onKindChange,
  concept,
  onConceptChange,
  method,
  onMethodChange,
  amount,
  onAmountChange,
  reference,
  onReferenceChange,
  pending,
  onConfirm,
}: MoveProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle>Registrar movimiento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={kind}
              onValueChange={(v) => onKindChange(v as "INCOME" | "EXPENSE")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME">Ingreso</SelectItem>
                <SelectItem value="EXPENSE">Egreso</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="move-concept">Concepto</Label>
            <Input
              id="move-concept"
              value={concept}
              onChange={(e) => onConceptChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Método</Label>
            <Select value={method} onValueChange={onMethodChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CASH_PAYMENT_METHOD_OPTIONS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="move-amount">Monto</Label>
            <Input
              id="move-amount"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              inputMode="decimal"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="move-ref">Referencia (opcional)</Label>
            <Input
              id="move-ref"
              value={reference}
              onChange={(e) => onReferenceChange(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="shadow-md"
            disabled={!concept.trim() || !amount || pending}
            onClick={onConfirm}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Registrar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type CloseProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: CashSessionResponse | undefined;
  countedCash: string;
  onCountedCashChange: (value: string) => void;
  pending: boolean;
  onConfirm: () => void;
};

function moneyLabel(amount: string, currency: string): string {
  return `${currency} ${amount}`;
}

export function CloseCashSessionDialog({
  open,
  onOpenChange,
  session,
  countedCash,
  onCountedCashChange,
  pending,
  onConfirm,
}: CloseProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle>Cerrar sesión / arqueo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {session ? (
            <p className="text-sm text-muted-foreground">
              Esperado según servicio:{" "}
              <span className="font-bold text-foreground">
                {moneyLabel(
                  session.totals.expectedCash,
                  session.totals.currency,
                )}
              </span>
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="counted-cash">Efectivo contado</Label>
            <Input
              id="counted-cash"
              value={countedCash}
              onChange={(e) => onCountedCashChange(e.target.value)}
              inputMode="decimal"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="shadow-md"
            disabled={!countedCash || pending}
            onClick={onConfirm}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Cerrar caja"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
