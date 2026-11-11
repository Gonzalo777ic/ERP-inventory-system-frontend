import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { formatCurrency } from "../../utils/format";
import type { SalesCommercialLineDto } from "../../types/salesCommercial";

type Props = {
  lines: SalesCommercialLineDto[];
};

export function SalesCommercialLinesTable({ lines }: Props) {
  if (lines.length === 0) {
    return (
      <p className="text-center py-10 text-muted-foreground">
        Sin líneas en el documento.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/60 hover:bg-muted/60">
          <TableHead>SKU</TableHead>
          <TableHead>Producto</TableHead>
          <TableHead className="text-right">Cant.</TableHead>
          <TableHead className="text-right">P. unit.</TableHead>
          <TableHead className="text-right">Importe</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((line) => (
          <TableRow
            key={line.id}
            className="transition-colors duration-150"
          >
            <TableCell className="font-medium">{line.productSku}</TableCell>
            <TableCell>{line.productName}</TableCell>
            <TableCell className="text-right">{line.quantity}</TableCell>
            <TableCell className="text-right">
              {formatCurrency(line.unitPrice.amount, line.unitPrice.currency)}
            </TableCell>
            <TableCell className="font-bold text-right">
              {formatCurrency(line.lineTotal.amount, line.lineTotal.currency)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
