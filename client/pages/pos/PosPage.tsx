import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  LayoutGrid,
  Loader2,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PosService } from "../../api/services/posService";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import type { PosCartLineInput, PosTicketResponse } from "../../types/pos/ticket";

type CartQty = Record<number, number>;

function moneyLabel(amount: string, currency: string): string {
  return `${currency} ${amount}`;
}

function toCartLines(cart: CartQty): PosCartLineInput[] {
  return Object.entries(cart)
    .map(([productId, quantity]) => ({
      productId: Number(productId),
      quantity,
    }))
    .filter((line) => line.quantity > 0);
}

export default function PosPage() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartQty>({});
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [lastTicket, setLastTicket] = useState<PosTicketResponse | null>(null);

  const catalogQuery = useQuery({
    queryKey: ["pos-catalog"],
    queryFn: () => PosService.listCatalog(),
  });

  const methodsQuery = useQuery({
    queryKey: ["pos-payment-methods"],
    queryFn: () => PosService.listPaymentMethods(),
  });

  const cartLines = useMemo(() => toCartLines(cart), [cart]);

  const previewQuery = useQuery({
    queryKey: ["pos-preview", cartLines],
    queryFn: () => PosService.previewTicket({ lines: cartLines }),
    enabled: cartLines.length > 0,
  });

  useEffect(() => {
    const methods = methodsQuery.data;
    if (!methods?.length) return;
    if (!paymentMethodId) setPaymentMethodId(String(methods[0].id));
  }, [methodsQuery.data, paymentMethodId]);

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const preview = previewQuery.data;
      if (!preview) throw new Error("No hay preview de totales.");
      return PosService.confirmTicket({
        lines: cartLines,
        payments: [
          {
            paymentMethodId: Number(paymentMethodId),
            amount: preview.totals.total,
          },
        ],
      });
    },
    onSuccess: (ticket) => {
      toast.success(`Ticket #${ticket.id} cobrado`);
      setLastTicket(ticket);
      setCart({});
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "No se pudo cobrar");
    },
  });

  const products = (catalogQuery.data ?? []).filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${p.sku} ${p.name} ${p.categoryLabel}`.toLowerCase().includes(q);
  });

  const bump = (productId: number, delta: number) => {
    setCart((prev) => {
      const next = { ...prev };
      const qty = (next[productId] ?? 0) + delta;
      if (qty <= 0) delete next[productId];
      else next[productId] = qty;
      return next;
    });
  };

  const preview = previewQuery.data;
  const totals = preview?.totals;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <LayoutGrid className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">POS</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Productos y cobro. Catálogo y totales desde mock local
            {PosService.isMockMode() ? " (sin inventory cross-service)" : ""}.
          </p>
        </div>
        {lastTicket ? (
          <Badge variant="success">
            Último ticket #{lastTicket.id} ·{" "}
            {moneyLabel(lastTicket.totals.total, lastTicket.totals.currency)}
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Catálogo</h2>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar SKU o nombre…"
                className="pl-9"
                aria-label="Buscar productos POS"
              />
            </div>
          </div>

          {catalogQuery.isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-3">Cargando catálogo…</span>
            </div>
          ) : products.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground">
              No hay productos que coincidan.
            </p>
          ) : (
            <ul className="grid gap-3 p-4 sm:grid-cols-2">
              {products.map((product) => {
                const qty = cart[product.id] ?? 0;
                return (
                  <li
                    key={product.id}
                    className="flex flex-col gap-3 rounded-lg border border-border p-4 transition-colors duration-150 hover:bg-muted/40"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.sku} · {product.categoryLabel}
                      </p>
                      <p className="font-bold text-right">
                        {moneyLabel(product.unitPrice, product.currency)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Quitar ${product.name}`}
                        onClick={() => bump(product.id, -1)}
                        disabled={qty === 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="min-w-8 text-center font-medium">
                        {qty}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        className="shadow-md"
                        aria-label={`Agregar ${product.name}`}
                        onClick={() => bump(product.id, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card shadow-xl overflow-hidden h-fit">
          <div className="flex items-center justify-between gap-3 border-b border-border p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Cobro</h2>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Vaciar carrito"
              disabled={cartLines.length === 0}
              onClick={() => setCart({})}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4 p-4">
            {cartLines.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">
                Agrega productos para armar el ticket.
              </p>
            ) : previewQuery.isLoading || !preview ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-3">Calculando totales…</span>
              </div>
            ) : (
              <>
                <ul className="space-y-2">
                  {preview.lines.map((line) => (
                    <li
                      key={line.productId}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {line.name}{" "}
                          <span className="text-muted-foreground">
                            ×{line.quantity}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {line.sku}
                        </p>
                      </div>
                      <p className="font-bold text-right">
                        {moneyLabel(line.lineTotal, preview.totals.currency)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="space-y-1 border-t border-border pt-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-bold">
                      {moneyLabel(totals!.subtotal, totals!.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {totals!.taxRateLabel}
                    </span>
                    <span className="font-bold">
                      {moneyLabel(totals!.taxAmount, totals!.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold">
                      {moneyLabel(totals!.total, totals!.currency)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Método de pago</Label>
                  <Select
                    value={paymentMethodId}
                    onValueChange={setPaymentMethodId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar…" />
                    </SelectTrigger>
                    <SelectContent>
                      {(methodsQuery.data ?? []).map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full gap-2 shadow-md"
                  disabled={
                    !paymentMethodId ||
                    confirmMutation.isPending ||
                    previewQuery.isFetching
                  }
                  onClick={() => confirmMutation.mutate()}
                >
                  {confirmMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CreditCard className="h-5 w-5" />
                  )}
                  Cobrar {moneyLabel(totals!.total, totals!.currency)}
                </Button>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
