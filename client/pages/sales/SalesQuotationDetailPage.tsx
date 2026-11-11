import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { SalesCommercialService } from "../../api/services/salesCommercialService";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  SALES_QUOTATION_STATUS_BADGE,
  SALES_QUOTATION_STATUS_LABELS,
} from "../../types/salesCommercial";
import { formatCurrency, formatDate } from "../../utils/format";
import { SalesCommercialLinesTable } from "./SalesCommercialLinesTable";

export default function SalesQuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const quotationId = Number(id);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["sales-quotation", quotationId],
    queryFn: async () => {
      const quotation = await SalesCommercialService.getQuotation(quotationId);
      if (!quotation) {
        throw new Error(`Cotización ${quotationId} no encontrada.`);
      }
      return quotation;
    },
    enabled: Number.isFinite(quotationId) && quotationId > 0,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">
              {data?.number ?? "Cotización"}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Detalle de cotización de venta.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/sales">
            <ArrowLeft className="h-4 w-4" />
            Volver a Ventas
          </Link>
        </Button>
      </div>

      <div className="rounded-lg bg-card shadow-xl overflow-hidden border border-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-3">Cargando cotización…</span>
          </div>
        ) : isError || !data ? (
          <p className="text-center py-10 text-destructive">
            {error instanceof Error
              ? error.message
              : "Cotización no encontrada."}
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
                <Badge variant={SALES_QUOTATION_STATUS_BADGE[data.status]}>
                  {SALES_QUOTATION_STATUS_LABELS[data.status]}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Emisión</p>
                <p className="font-medium">{formatDate(data.issuedAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Vigencia</p>
                <p className="font-medium">{formatDate(data.validUntil)}</p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs text-muted-foreground">Notas</p>
                <p className="text-sm">
                  {data.notes ?? (
                    <span className="text-muted-foreground">Sin notas</span>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Pedido vinculado</p>
                {data.orderId ? (
                  <Link
                    to={`/sales/orders/${data.orderId}`}
                    className="font-medium text-primary hover:underline"
                  >
                    Pedido #{data.orderId}
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-bold text-right sm:text-left">
                  {formatCurrency(data.total.amount, data.total.currency)}
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
