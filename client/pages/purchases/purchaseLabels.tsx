import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/types/inventory/orders";
import type { QuotationStatus } from "@/types/inventory/quotations";
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABELS,
  QUOTATION_STATUS_BADGE,
  QUOTATION_STATUS_LABELS,
} from "@/types/inventory/procurement";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={ORDER_STATUS_BADGE[status]}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  return (
    <Badge variant={QUOTATION_STATUS_BADGE[status]}>
      {QUOTATION_STATUS_LABELS[status]}
    </Badge>
  );
}
