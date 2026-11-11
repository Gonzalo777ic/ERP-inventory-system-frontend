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
  SALES_QUOTATION_STATUS_BADGE,
  SALES_QUOTATION_STATUS_LABELS,
} from "../../types/salesCommercial";
import { formatCurrency, formatDate } from "../../utils/format";

export function SalesQuotationsPanel() {
  const { data: quotations = [], isLoading, isError, error } = useQuery({
    queryKey: ["sales-quotations"],
    queryFn: () => SalesCommercialService.listQuotations(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-3">Cargando cotizaciones…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-center py-10 text-destructive">
        {error instanceof Error
          ? error.message
          : "Error al cargar cotizaciones."}
      </p>
    );
  }

  if (quotations.length === 0) {
    return (
      <p className="text-center py-10 text-muted-foreground">
        Aún no hay cotizaciones de venta.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/60 hover:bg-muted/60">
          <TableHead>Número</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Emisión</TableHead>
          <TableHead>Vigencia</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="w-[72px] text-center">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotations.map((q) => (
          <TableRow key={q.id} className="transition-colors duration-150">
            <TableCell className="font-medium">{q.number}</TableCell>
            <TableCell>{q.partnerName}</TableCell>
            <TableCell>{formatDate(q.issuedAt)}</TableCell>
            <TableCell>{formatDate(q.validUntil)}</TableCell>
            <TableCell>
              <Badge variant={SALES_QUOTATION_STATUS_BADGE[q.status]}>
                {SALES_QUOTATION_STATUS_LABELS[q.status]}
              </Badge>
            </TableCell>
            <TableCell className="font-bold text-right">
              {formatCurrency(q.total.amount, q.total.currency)}
            </TableCell>
            <TableCell className="text-center">
              <Button asChild variant="ghost" size="icon" title="Ver detalle">
                <Link to={`/sales/quotations/${q.id}`}>
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
