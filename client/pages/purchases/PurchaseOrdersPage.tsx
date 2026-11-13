import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle,
  Eye,
  Loader2,
  PackageCheck,
  PlusCircle,
  Send,
  ThumbsUp,
  Ban,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  cancelPurchaseOrder,
  getPurchaseOrderById,
  getPurchaseOrders,
  updateOrderStatus,
} from "@/api/services/purchase-order";
import PurchaseOrderForm from "@/components/forms/PurchaseOrderForm";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import type { OrderStatus, PurchaseOrder } from "@/types/index";
import { ComprasSubNav } from "@/components/compras/ComprasSubNav";
import { formatProcurementMoney } from "@/types/inventory/procurement";
import { OrderStatusBadge } from "./purchaseLabels";

const ORDERS_QUERY = ["purchase-orders"] as const;
const ROLE_CLAIM = "https://valeerp.local/roles";
const LIST_STALE_MS = 60_000;

const PurchaseOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const roles: string[] = (user as any)?.[ROLE_CLAIM] || [];
  const isSupplier = roles.some((role) =>
    ["ROLE_PROVEEDOR", "PROVEEDOR", "Supplier", "ROLE_SUPPLIER"].includes(role),
  );

  const [tab, setTab] = useState<"active" | "closed">("active");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [cancelId, setCancelId] = useState<number | null>(null);

  const { data: orders = [], isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ORDERS_QUERY,
    queryFn: () => getPurchaseOrders(),
    staleTime: LIST_STALE_MS,
  });

  const { data: editingOrder, isLoading: loadingEdit } = useQuery({
    queryKey: [...ORDERS_QUERY, editingId],
    queryFn: () => getPurchaseOrderById(editingId!),
    enabled: !!editingId && modalOpen,
    staleTime: 0,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY });
      queryClient.invalidateQueries({ queryKey: ["procurement-pipeline"] });
      toast.success("Estado de la orden actualizado");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelPurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY });
      queryClient.invalidateQueries({ queryKey: ["procurement-pipeline"] });
      toast.success("Orden cancelada. El documento permanece en el historial.");
      setCancelId(null);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "No se pudo cancelar");
    },
  });

  const active = useMemo(
    () =>
      orders.filter((o) =>
        ["BORRADOR", "PENDIENTE", "CONFIRMADO"].includes(o.status),
      ),
    [orders],
  );
  const closed = useMemo(
    () =>
      orders.filter((o) =>
        ["COMPLETO", "CANCELADO", "RECHAZADO"].includes(o.status),
      ),
    [orders],
  );
  const current = tab === "active" ? active : closed;

  const openNew = () => {
    setEditingId(null);
    setReadOnly(false);
    setModalOpen(true);
  };

  const openView = (id: number, editable: boolean) => {
    setEditingId(id);
    setReadOnly(!editable);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setReadOnly(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Cargando órdenes…</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 mb-1" asChild>
            <Link to="/compras">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Compras
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <ClipboardIcon />
            <h1 className="text-3xl font-bold">
              {isSupplier ? "Mis pedidos" : "Órdenes de compra"}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Documentos por estado. Cancelar o recibir — nunca borrar físico.
          </p>
        </div>
        {!isSupplier && (
          <Button onClick={openNew} className="shadow-md">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva OC
          </Button>
        )}
      </div>

      <ComprasSubNav />

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "active" | "closed")}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active">Activas ({active.length})</TabsTrigger>
          <TabsTrigger value="closed">Cerradas ({closed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <OrdersTable
            orders={current}
            isSupplier={isSupplier}
            busy={statusMutation.isPending}
            onView={openView}
            onStatus={(id, status) => statusMutation.mutate({ id, status })}
            onCancel={(id) => setCancelId(id)}
            onReceive={(id) => navigate(`/purchases/orders/${id}/receive`)}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? readOnly
                  ? `Detalle OC-${editingId}`
                  : `Editar OC-${editingId}`
                : "Nueva orden de compra"}
            </DialogTitle>
          </DialogHeader>
          {editingId && loadingEdit ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">
                Cargando detalle…
              </span>
            </div>
          ) : (
            <PurchaseOrderForm
              defaultPurchaseOrder={editingId ? editingOrder : undefined}
              onSuccess={closeModal}
              readOnly={readOnly}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={cancelId != null}
        onOpenChange={(open) => !open && setCancelId(null)}
      >
        <DialogContent className="max-w-sm w-full rounded-xl shadow-2xl">
          <DialogHeader className="border-b border-border pb-3">
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Cancelar orden
            </DialogTitle>
            <DialogDescription>
              ¿Cancelar OC-{cancelId}? El documento queda en historial; no se
              elimina.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelId(null)}>
              Volver
            </Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={() => cancelId != null && cancelMutation.mutate(cancelId)}
            >
              {cancelMutation.isPending ? "Cancelando…" : "Sí, cancelar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function ClipboardIcon() {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <Send className="h-5 w-5" />
    </span>
  );
}

function OrdersTable({
  orders,
  isSupplier,
  busy,
  onView,
  onStatus,
  onCancel,
  onReceive,
}: {
  orders: PurchaseOrder[];
  isSupplier: boolean;
  busy: boolean;
  onView: (id: number, editable: boolean) => void;
  onStatus: (id: number, status: OrderStatus) => void;
  onCancel: (id: number) => void;
  onReceive: (id: number) => void;
}) {
  if (orders.length === 0) {
    return (
      <p className="text-center py-10 text-muted-foreground">
        No hay órdenes en esta categoría.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>ID</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Entrega</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const editable =
              !isSupplier &&
              ["BORRADOR", "PENDIENTE"].includes(order.status);
            return (
              <TableRow
                key={order.id}
                className="transition-colors duration-150"
              >
                <TableCell className="font-medium">OC-{order.id}</TableCell>
                <TableCell>{order.supplier?.name ?? "—"}</TableCell>
                <TableCell>{order.orderDate}</TableCell>
                <TableCell>{order.deliveryDate}</TableCell>
                <TableCell className="font-bold text-right">
                  {formatProcurementMoney(order.totalAmount ?? 0)}
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1 flex-wrap">
                    {isSupplier && order.status === "PENDIENTE" && (
                      <>
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => onStatus(order.id, "CONFIRMADO")}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Aceptar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busy}
                          onClick={() => onStatus(order.id, "RECHAZADO")}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </>
                    )}
                    {!isSupplier && order.status === "BORRADOR" && (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => onStatus(order.id, "PENDIENTE")}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Enviar
                      </Button>
                    )}
                    {!isSupplier && order.status === "CONFIRMADO" && (
                      <Button
                        size="sm"
                        onClick={() => onReceive(order.id)}
                      >
                        <PackageCheck className="h-4 w-4 mr-1" />
                        Recibir
                      </Button>
                    )}
                    {!isSupplier &&
                      ["BORRADOR", "PENDIENTE", "CONFIRMADO"].includes(
                        order.status,
                      ) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          title="Cancelar orden"
                          onClick={() => onCancel(order.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    {order.status === "COMPLETO" && (
                      <Badge variant="success" className="mr-1">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Recibida
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(order.id, editable)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default PurchaseOrdersPage;
