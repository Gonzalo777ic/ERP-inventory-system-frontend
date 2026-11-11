import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  PackageCheck,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import {
  getPurchaseOrderById,
  getPurchaseOrders,
  receivePurchaseOrder,
} from "@/api/services/purchase-order";
import { ProcurementService } from "@/api/services/procurement";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import type { PurchaseOrder } from "@/types/index";
import { ComprasSubNav } from "@/components/compras/ComprasSubNav";
import { formatProcurementMoney } from "@/types/inventory/procurement";
import { ComprasSubNav } from "@/components/compras/ComprasSubNav";
import { OrderStatusBadge } from "./purchaseLabels";

const ORDERS_QUERY = ["purchase-orders"] as const;
const RECEIPTS_QUERY = ["purchase-receipts"] as const;

export default function PurchaseReceiptPage() {
  const { orderId: orderIdParam } = useParams<{ orderId?: string }>();
  const focusedId = orderIdParam ? Number(orderIdParam) : null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmId, setConfirmId] = useState<number | null>(focusedId);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ORDERS_QUERY,
    queryFn: () => getPurchaseOrders(),
  });

  const { data: receipts = [] } = useQuery({
    queryKey: RECEIPTS_QUERY,
    queryFn: () => ProcurementService.listReceipts(),
  });

  const { data: focusedOrder, isLoading: loadingFocused } = useQuery({
    queryKey: [...ORDERS_QUERY, focusedId],
    queryFn: () => getPurchaseOrderById(focusedId!),
    enabled: focusedId != null && !Number.isNaN(focusedId),
  });

  const toReceive = useMemo(
    () => orders.filter((o) => o.status === "CONFIRMADO"),
    [orders],
  );

  const receiveMutation = useMutation({
    mutationFn: (id: number) => receivePurchaseOrder(id),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY });
      queryClient.invalidateQueries({ queryKey: RECEIPTS_QUERY });
      queryClient.invalidateQueries({ queryKey: ["procurement-pipeline"] });
      toast.success(`OC-${order.id} recibida. Entrada de inventario registrada.`);
      setConfirmId(null);
      navigate("/purchases/receipts");
    },
    onError: (err: unknown) => {
      toast.error(
        err instanceof Error ? err.message : "No se pudo recepcionar",
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Cargando recepciones…</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <Button variant="ghost" size="sm" className="-ml-2 mb-1" asChild>
          <Link to="/compras">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Compras
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <PackageCheck className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Recepción de mercadería</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Solo OC confirmadas. La recepción completa el documento y deja el
          histórico; no hay baja lógica de libros.
        </p>
      </div>

      <ComprasSubNav />

      {focusedId != null && (
        <FocusedOrderPanel
          order={focusedOrder}
          loading={loadingFocused}
          onReceive={() => setConfirmId(focusedId)}
        />
      )}

      <section className="space-y-3">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Warehouse className="h-6 w-6 text-primary" />
          Pendientes de recepción ({toReceive.length})
        </h2>
        <ReceiptCandidates
          orders={toReceive}
          onReceive={(id) => setConfirmId(id)}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Recepciones publicadas</h2>
        {receipts.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">
            Aún no hay recepciones registradas.
          </p>
        ) : (
          <div className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Recepción</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Almacén</TableHead>
                  <TableHead>Líneas</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((r) => (
                  <TableRow key={r.id} className="transition-colors duration-150">
                    <TableCell className="font-medium">RCP-{r.id}</TableCell>
                    <TableCell>
                      <Link
                        to={`/purchases/orders`}
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        OC-{r.purchaseOrderId}
                      </Link>
                    </TableCell>
                    <TableCell>{r.warehouseName}</TableCell>
                    <TableCell>{r.lineCount}</TableCell>
                    <TableCell>
                      {new Date(r.receivedAt).toLocaleString("es-PE")}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
                        <CheckCircle className="h-4 w-4" />
                        {r.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <Dialog
        open={confirmId != null}
        onOpenChange={(open) => !open && setConfirmId(null)}
      >
        <DialogContent className="max-w-sm w-full rounded-xl shadow-2xl">
          <DialogHeader className="border-b border-border pb-3">
            <DialogTitle>Confirmar recepción</DialogTitle>
            <DialogDescription>
              ¿Recepcionar toda la mercadería de OC-{confirmId}? Se publicará
              la entrada de inventario y la orden pasará a Recibido.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmId(null)}>
              Volver
            </Button>
            <Button
              disabled={receiveMutation.isPending}
              onClick={() =>
                confirmId != null && receiveMutation.mutate(confirmId)
              }
            >
              {receiveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PackageCheck className="h-4 w-4 mr-2" />
              )}
              Recibir todo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FocusedOrderPanel({
  order,
  loading,
  onReceive,
}: {
  order: PurchaseOrder | undefined;
  loading: boolean;
  onReceive: () => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center p-4 rounded-lg border border-border bg-card">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Cargando OC…</span>
      </div>
    );
  }
  if (!order) {
    return (
      <p className="text-sm text-destructive">Orden no encontrada.</p>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Orden enfocada</p>
          <h3 className="text-xl font-bold">
            OC-{order.id} · {order.supplier?.name}
          </h3>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      <OrderLines order={order} />
      {order.status === "CONFIRMADO" && (
        <Button onClick={onReceive} className="shadow-md">
          <PackageCheck className="mr-2 h-4 w-4" />
          Recibir esta orden
        </Button>
      )}
    </div>
  );
}

function ReceiptCandidates({
  orders,
  onReceive,
}: {
  orders: PurchaseOrder[];
  onReceive: (id: number) => void;
}) {
  if (orders.length === 0) {
    return (
      <p className="text-center py-10 text-muted-foreground">
        No hay órdenes confirmadas pendientes de recepción.
      </p>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>Orden</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Entrega</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="transition-colors duration-150">
              <TableCell className="font-medium">OC-{order.id}</TableCell>
              <TableCell>{order.supplier?.name}</TableCell>
              <TableCell>{order.deliveryDate}</TableCell>
              <TableCell className="font-bold text-right">
                {formatProcurementMoney(order.totalAmount ?? 0)}
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" onClick={() => onReceive(order.id)}>
                  <PackageCheck className="h-4 w-4 mr-1" />
                  Recibir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function OrderLines({ order }: { order: PurchaseOrder }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>Producto</TableHead>
            <TableHead className="text-right">Cant.</TableHead>
            <TableHead className="text-right">Costo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.details.map((line) => (
            <TableRow key={line.id}>
              <TableCell className="font-medium">
                {line.product?.name ?? "—"}
              </TableCell>
              <TableCell className="text-right">{line.quantity}</TableCell>
              <TableCell className="font-bold text-right">
                {formatProcurementMoney(line.unitCost)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
