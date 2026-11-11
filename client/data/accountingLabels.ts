import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "../components/ui/badge";
import type {
  AccountType,
  AccountingInvoiceKind,
  AccountingInvoiceStatus,
  JournalEntryStatus,
  JournalKind,
  LedgerDocumentStatus,
  LedgerInstallmentStatus,
} from "../types/accounting";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  ASSET: "Activo",
  LIABILITY: "Pasivo",
  EQUITY: "Patrimonio",
  INCOME: "Ingreso",
  EXPENSE: "Gasto",
  COST: "Costo",
};

export const JOURNAL_KIND_LABELS: Record<JournalKind, string> = {
  SALES: "Ventas",
  PURCHASES: "Compras",
  BANK: "Banco",
  CASH: "Caja",
  MISCELLANEOUS: "Misceláneo",
};

export const ENTRY_STATUS_LABELS: Record<JournalEntryStatus, string> = {
  DRAFT: "Borrador",
  POSTED: "Publicado",
  ANNULLED: "Anulado",
};

export const ENTRY_STATUS_BADGE: Record<JournalEntryStatus, BadgeVariant> = {
  DRAFT: "neutral",
  POSTED: "success",
  ANNULLED: "danger",
};

export const INVOICE_KIND_LABELS: Record<AccountingInvoiceKind, string> = {
  CUSTOMER: "Cliente",
  SUPPLIER: "Proveedor",
};

export const INVOICE_STATUS_LABELS: Record<AccountingInvoiceStatus, string> = {
  DRAFT: "Borrador",
  POSTED: "Publicada",
  PARTIALLY_PAID: "Pago parcial",
  PAID: "Pagada",
  CANCELLED: "Anulada",
};

export const INVOICE_STATUS_BADGE: Record<
  AccountingInvoiceStatus,
  BadgeVariant
> = {
  DRAFT: "neutral",
  POSTED: "info",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  CANCELLED: "danger",
};

export const LEDGER_STATUS_LABELS: Record<LedgerDocumentStatus, string> = {
  OPEN: "Abierta",
  PARTIAL: "Parcial",
  PAID: "Pagada",
  OVERDUE: "Vencida",
  CANCELLED: "Anulada",
};

export const LEDGER_STATUS_BADGE: Record<LedgerDocumentStatus, BadgeVariant> = {
  OPEN: "info",
  PARTIAL: "warning",
  PAID: "success",
  OVERDUE: "danger",
  CANCELLED: "neutral",
};

export const INSTALLMENT_STATUS_LABELS: Record<
  LedgerInstallmentStatus,
  string
> = {
  OPEN: "Abierta",
  PARTIAL: "Parcial",
  PAID: "Pagada",
  OVERDUE: "Vencida",
};

export const INSTALLMENT_STATUS_BADGE: Record<
  LedgerInstallmentStatus,
  BadgeVariant
> = {
  OPEN: "info",
  PARTIAL: "warning",
  PAID: "success",
  OVERDUE: "danger",
};
