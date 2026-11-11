import { Link } from "react-router-dom";
import { Eye, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SalesCommercialService } from "../../api/services/salesCommercialService";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  SALES_ORDER_STATUS_BADGE,
  SALES_ORDER_STATUS_LABELS,
} from "../../types/salesCommercial";
import { formatCurrency, formatDate } from "../../utils/format";

export function SalesOrdersPanel() {
  const { data: orders = [], isLoading, isError, error } = useQuery({
    queryKey: ["sales-orders"],
    queryFn: () => SalesCommercialService.listOrders(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-3">Cargando pedidos…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-center py-10 text-destructive">
        {error instanceof Error ? error.message : "Error al cargar pedidos."}
      </p>
    );
  }

  if (orders.length === 0) {
    return (
      <p className="text-center py-10 text-muted-foreground">
        Aún no hay pedidos de venta.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/60 hover:bg-muted/60">
          <TableHead>Número</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Origen</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="w-[72px] text-center">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id} className="transition-colors duration-150">
            <TableCell className="font-medium">{order.number}</TableCell>
            <TableCell>{order.partnerName}</TableCell>
            <TableCell>{formatDate(order.orderedAt)}</TableCell>
            <TableCell>
              <Badge variant={SALES_ORDER_STATUS_BADGE[order.status]}>
                {SALES_ORDER_STATUS_LABELS[order.status]}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {order.quotationId
                ? `Cotización #${order.quotationId}`
                : order.saleId
                  ? `Venta fiscal #${order.saleId}`
                  : "—"}
            </TableCell>
            <TableCell className="font-bold text-right">
              {formatCurrency(order.total.amount, order.total.currency)}
            </TableCell>
            <TableCell className="text-center">
              <Button asChild variant="ghost" size="icon" title="Ver detalle">
                <Link to={`/sales/orders/${order.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
