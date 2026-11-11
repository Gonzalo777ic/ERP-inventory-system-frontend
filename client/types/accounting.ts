/**
 * Contabilidad UI contracts (Admin ERP).
 * Account / journal codes live in API or fixtures — never hardcoded in screens.
 */

export const ACCOUNTING_DISPLAY_CURRENCY = "PEN" as const;

export type AccountType =
  | "ASSET"
  | "LIABILITY"
  | "EQUITY"
  | "INCOME"
  | "EXPENSE"
  | "COST";

export type JournalKind =
  | "SALES"
  | "PURCHASES"
  | "BANK"
  | "CASH"
  | "MISCELLANEOUS";

export type JournalEntryStatus = "DRAFT" | "POSTED" | "ANNULLED";

export type AccountingInvoiceKind = "CUSTOMER" | "SUPPLIER";

export type AccountingInvoiceStatus =
  | "DRAFT"
  | "POSTED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "CANCELLED";

export type LedgerDocumentStatus =
  | "OPEN"
  | "PARTIAL"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export type LedgerInstallmentStatus =
  | "OPEN"
  | "PARTIAL"
  | "PAID"
  | "OVERDUE";

export interface ChartAccount {
  id: number;
  code: string;
  name: string;
  type: AccountType;
  parentId: number | null;
  currency: typeof ACCOUNTING_DISPLAY_CURRENCY;
  deletedAt: string | null;
}

export interface AccountingJournal {
  id: number;
  code: string;
  name: string;
  kind: JournalKind;
  defaultAccountId: number | null;
  deletedAt: string | null;
}

export interface JournalEntryLine {
  id: number;
  accountId: number;
  debit: number;
  credit: number;
  memo?: string;
}

export interface JournalEntry {
  id: number;
  number: string;
  journalId: number;
  entryDate: string;
  concept: string;
  referenceDocument: string | null;
  status: JournalEntryStatus;
  reversalOfId: number | null;
  createdBy: string;
  lines: JournalEntryLine[];
}

export interface JournalEntryListQuery {
  search?: string;
  journalId?: number;
  status?: JournalEntryStatus | "ALL";
}

export interface AccountingInvoiceLine {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  lineTotal: number;
  accountId: number;
}

export interface AccountingInvoice {
  id: number;
  number: string;
  kind: AccountingInvoiceKind;
  partnerName: string;
  partnerDocument: string;
  issueDate: string;
  dueDate: string;
  status: AccountingInvoiceStatus;
  subtotal: number;
  taxTotal: number;
  total: number;
  paidAmount: number;
  currency: typeof ACCOUNTING_DISPLAY_CURRENCY;
  journalId: number;
  journalEntryId: number | null;
  lines: AccountingInvoiceLine[];
}

export interface LedgerInstallment {
  id: number;
  number: number;
  dueDate: string;
  expectedAmount: number;
  paidAmount: number;
  status: LedgerInstallmentStatus;
}

export interface AccountsReceivableDoc {
  id: number;
  number: string;
  partnerName: string;
  invoiceId: number;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: LedgerDocumentStatus;
  receivableAccountId: number;
  installments: LedgerInstallment[];
}

export interface AccountsPayableDoc {
  id: number;
  number: string;
  partnerName: string;
  invoiceId: number;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: LedgerDocumentStatus;
  payableAccountId: number;
  installments: LedgerInstallment[];
}

export interface AccountingHubSummary {
  draftEntries: number;
  postedEntries: number;
  openInvoices: number;
  arOpenBalance: number;
  apOpenBalance: number;
  overdueArCount: number;
  overdueApCount: number;
}
