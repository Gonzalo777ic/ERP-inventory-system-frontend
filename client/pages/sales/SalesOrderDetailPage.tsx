import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ClipboardList, Loader2 } from "lucide-react";
import { SalesCommercialService } from "../../api/services/salesCommercialService";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  SALES_ORDER_STATUS_BADGE,
  SALES_ORDER_STATUS_LABELS,
} from "../../types/salesCommercial";
import { formatCurrency, formatDate } from "../../utils/format";
import { SalesCommercialLinesTable } from "./SalesCommercialLinesTable";

export default function SalesOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["sales-order", orderId],
    queryFn: async () => {
      const order = await SalesCommercialService.getOrder(orderId);
      if (!order) {
        throw new Error(`Pedido ${orderId} no encontrado.`);
      }
      return order;
    },
    enabled: Number.isFinite(orderId) && orderId > 0,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">
              {data?.number ?? "Pedido"}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Detalle de pedido de venta.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/sales?tab=orders">
            <ArrowLeft className="h-4 w-4" />
            Volver a Pedidos
          </Link>
        </Button>
      </div>

      <div className="rounded-lg bg-card shadow-xl overflow-hidden border border-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-3">Cargando pedido…</span>
          </div>
        ) : isError || !data ? (
          <p className="text-center py-10 text-destructive">
            {error instanceof Error ? error.message : "Pedido no encontrado."}
          </p>
        ) : (
          <>
            <div className="grid gap-4 border-b border-border p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="font-medium">{data.partnerName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Estado</p>
                <Badge variant={SALES_ORDER_STATUS_BADGE[data.status]}>
                  {SALES_ORDER_STATUS_LABELS[data.status]}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Fecha</p>
                <p className="font-medium">{formatDate(data.orderedAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-bold">
                  {formatCurrency(data.total.amount, data.total.currency)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Cotización</p>
                {data.quotationId ? (
                  <Link
                    to={`/sales/quotations/${data.quotationId}`}
                    className="font-medium text-primary hover:underline"
                  >
                    Cotización #{data.quotationId}
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Venta fiscal</p>
                {data.saleId ? (
                  <Link
                    to="/sales/registry"
                    className="font-medium text-primary hover:underline"
                  >
                    Venta #{data.saleId}
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs text-muted-foreground">Notas</p>
                <p className="text-sm">
                  {data.notes ?? (
                    <span className="text-muted-foreground">Sin notas</span>
                  )}
                </p>
              </div>
            </div>
            <SalesCommercialLinesTable lines={data.lines} />
          </>
        )}
      </div>
    </div>
  );
}
