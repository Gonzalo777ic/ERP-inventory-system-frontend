import { ACC } from "./accountingFixtures";
import type {
  AccountingHubSummary,
  AccountingInvoice,
  AccountsPayableDoc,
  AccountsReceivableDoc,
  JournalEntry,
} from "../types/accounting";
import { ACCOUNTING_DISPLAY_CURRENCY } from "../types/accounting";

const CURRENCY = ACCOUNTING_DISPLAY_CURRENCY;

export const INVOICE_FIXTURES: readonly AccountingInvoice[] = [
  {
    id: 1,
    number: "FC-001",
    kind: "CUSTOMER",
    partnerName: "Distribuidora Andes SAC",
    partnerDocument: "20123456789",
    issueDate: "2026-11-03",
    dueDate: "2026-12-03",
    status: "PARTIALLY_PAID",
    subtotal: 1000,
    taxTotal: 180,
    total: 1180,
    paidAmount: 590,
    currency: CURRENCY,
    journalId: 1,
    journalEntryId: 1,
    lines: [
      {
        id: 1,
        description: "Aceite motor 5W-30 (lote)",
        quantity: 20,
        unitPrice: 50,
        taxAmount: 180,
        lineTotal: 1180,
        accountId: ACC.ventas,
      },
    ],
  },
  {
    id: 2,
    number: "FC-002",
    kind: "CUSTOMER",
    partnerName: "Taller El Rayo EIRL",
    partnerDocument: "20654321098",
    issueDate: "2026-11-07",
    dueDate: "2026-11-21",
    status: "POSTED",
    subtotal: 250,
    taxTotal: 45,
    total: 295,
    paidAmount: 0,
    currency: CURRENCY,
    journalId: 1,
    journalEntryId: null,
    lines: [
      {
        id: 2,
        description: "Filtro de aceite",
        quantity: 10,
        unitPrice: 25,
        taxAmount: 45,
        lineTotal: 295,
        accountId: ACC.ventas,
      },
    ],
  },
  {
    id: 3,
    number: "FP-010",
    kind: "SUPPLIER",
    partnerName: "Lubricantes del Sur SAC",
    partnerDocument: "20998887776",
    issueDate: "2026-11-04",
    dueDate: "2026-12-04",
    status: "POSTED",
    subtotal: 500,
    taxTotal: 90,
    total: 590,
    paidAmount: 0,
    currency: CURRENCY,
    journalId: 2,
    journalEntryId: 2,
    lines: [
      {
        id: 3,
        description: "Compra mercadería lubricantes",
        quantity: 1,
        unitPrice: 500,
        taxAmount: 90,
        lineTotal: 590,
        accountId: ACC.compras,
      },
    ],
  },
  {
    id: 4,
    number: "FP-011",
    kind: "SUPPLIER",
    partnerName: "Repuestos Norte SAC",
    partnerDocument: "20111222333",
    issueDate: "2026-11-06",
    dueDate: "2026-11-20",
    status: "DRAFT",
    subtotal: 800,
    taxTotal: 144,
    total: 944,
    paidAmount: 0,
    currency: CURRENCY,
    journalId: 2,
    journalEntryId: null,
    lines: [
      {
        id: 4,
        description: "Repuestos varios",
        quantity: 1,
        unitPrice: 800,
        taxAmount: 144,
        lineTotal: 944,
        accountId: ACC.compras,
      },
    ],
  },
];

export const AR_FIXTURES: readonly AccountsReceivableDoc[] = [
  {
    id: 1,
    number: "CXC-001",
    partnerName: "Distribuidora Andes SAC",
    invoiceId: 1,
    invoiceNumber: "FC-001",
    issueDate: "2026-11-03",
    dueDate: "2026-12-03",
    totalAmount: 1180,
    paidAmount: 590,
    status: "PARTIAL",
    receivableAccountId: ACC.clientes,
    installments: [
      {
        id: 1,
        number: 1,
        dueDate: "2026-11-18",
        expectedAmount: 590,
        paidAmount: 590,
        status: "PAID",
      },
      {
        id: 2,
        number: 2,
        dueDate: "2026-12-03",
        expectedAmount: 590,
        paidAmount: 0,
        status: "OPEN",
      },
    ],
  },
  {
    id: 2,
    number: "CXC-002",
    partnerName: "Taller El Rayo EIRL",
    invoiceId: 2,
    invoiceNumber: "FC-002",
    issueDate: "2026-11-07",
    dueDate: "2026-11-21",
    totalAmount: 295,
    paidAmount: 0,
    status: "OVERDUE",
    receivableAccountId: ACC.clientes,
    installments: [
      {
        id: 3,
        number: 1,
        dueDate: "2026-11-21",
        expectedAmount: 295,
        paidAmount: 0,
        status: "OVERDUE",
      },
    ],
  },
];

export const AP_FIXTURES: readonly AccountsPayableDoc[] = [
  {
    id: 1,
    number: "CXP-001",
    partnerName: "Lubricantes del Sur SAC",
    invoiceId: 3,
    invoiceNumber: "FP-010",
    issueDate: "2026-11-04",
    dueDate: "2026-12-04",
    totalAmount: 590,
    paidAmount: 0,
    status: "OPEN",
    payableAccountId: ACC.proveedores,
    installments: [
      {
        id: 1,
        number: 1,
        dueDate: "2026-12-04",
        expectedAmount: 590,
        paidAmount: 0,
        status: "OPEN",
      },
    ],
  },
  {
    id: 2,
    number: "CXP-002",
    partnerName: "Repuestos Norte SAC",
    invoiceId: 4,
    invoiceNumber: "FP-011",
    issueDate: "2026-11-06",
    dueDate: "2026-11-20",
    totalAmount: 944,
    paidAmount: 200,
    status: "PARTIAL",
    payableAccountId: ACC.proveedores,
    installments: [
      {
        id: 2,
        number: 1,
        dueDate: "2026-11-20",
        expectedAmount: 472,
        paidAmount: 200,
        status: "PARTIAL",
      },
      {
        id: 3,
        number: 2,
        dueDate: "2026-12-06",
        expectedAmount: 472,
        paidAmount: 0,
        status: "OPEN",
      },
    ],
  },
];

export function cloneInvoices(): AccountingInvoice[] {
  return INVOICE_FIXTURES.map((inv) => ({
    ...inv,
    lines: inv.lines.map((l) => ({ ...l })),
  }));
}

export function cloneAccountsReceivable(): AccountsReceivableDoc[] {
  return AR_FIXTURES.map((doc) => ({
    ...doc,
    installments: doc.installments.map((i) => ({ ...i })),
  }));
}

export function cloneAccountsPayable(): AccountsPayableDoc[] {
  return AP_FIXTURES.map((doc) => ({
    ...doc,
    installments: doc.installments.map((i) => ({ ...i })),
  }));
}

export function buildHubSummary(
  entries: JournalEntry[],
  invoices: AccountingInvoice[],
  ar: AccountsReceivableDoc[],
  ap: AccountsPayableDoc[],
): AccountingHubSummary {
  const balanceOf = (total: number, paid: number) =>
    Math.max(0, total - paid);

  return {
    draftEntries: entries.filter((e) => e.status === "DRAFT").length,
    postedEntries: entries.filter((e) => e.status === "POSTED").length,
    openInvoices: invoices.filter(
      (i) => i.status === "POSTED" || i.status === "PARTIALLY_PAID",
    ).length,
    arOpenBalance: ar
      .filter((d) => d.status !== "PAID" && d.status !== "CANCELLED")
      .reduce((s, d) => s + balanceOf(d.totalAmount, d.paidAmount), 0),
    apOpenBalance: ap
      .filter((d) => d.status !== "PAID" && d.status !== "CANCELLED")
      .reduce((s, d) => s + balanceOf(d.totalAmount, d.paidAmount), 0),
    overdueArCount: ar.filter((d) => d.status === "OVERDUE").length,
    overdueApCount: ap.filter((d) => d.status === "OVERDUE").length,
  };
}
