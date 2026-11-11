import type {
  AccountingJournal,
  ChartAccount,
  JournalEntry,
} from "../types/accounting";
import { ACCOUNTING_DISPLAY_CURRENCY } from "../types/accounting";

/**
 * Demo chart, journals and entries when store accounting API is not ready.
 * Account codes belong here (or API) — never in TSX screens.
 */

const CURRENCY = ACCOUNTING_DISPLAY_CURRENCY;

export const CHART_ACCOUNT_FIXTURES: readonly ChartAccount[] = [
  {
    id: 1,
    code: "10",
    name: "Efectivo y equivalentes",
    type: "ASSET",
    parentId: null,
    currency: CURRENCY,
    deletedAt: null,
  },
  {
    id: 2,
    code: "1041",
    name: "Caja general",
    type: "ASSET",
    parentId: 1,
    currency: CURRENCY,
    deletedAt: null,
  },
  {
    id: 3,
    code: "1042",
    name: "Bancos moneda nacional",
    type: "ASSET",
    parentId: 1,
    currency: CURRENCY,
    deletedAt: null,
  },
  {
    id: 4,
    code: "12",
    name: "Cuentas por cobrar comerciales",
    type: "ASSET",
    parentId: null,
    currency: CURRENCY,
    deletedAt: null,
  },
  {
    id: 5,
    code: "1212",
    name: "Clientes",
    type: "ASSET",
    parentId: 4,
    currency: CURRENCY,
    deletedAt: null,
  },
  {
    id: 6,
    code: "40",
    name: "Tributos por pagar",
    type: "LIABILITY",
    parentId: null,
    currency: CURRENCY,
    deletedAt: null,
  },
  {
    id: 7,
    code: "4011",
    name: "IGV — débito fiscal",
    type: "LIABILITY",
    parentId: 6,
    currency: CURRENCY,
    deletedAt: null,
  },
  {
    id: 8,
    code: "42",
    name: "Cuentas por pagar comerciales",
    type: "LIABILITY",
    parentId: null,
    currency: CURRENCY,
    deletedAt: null,
  },
  {
    id: 9,
    code: "4212",
    name: "Proveedores",
    type: "LIABILITY",
    parentId: 8,
    currency: CURRENCY,
    deletedAt: null,
  },
  {
    id: 10,
    code: "70",
    name: "Ventas",
    type: "INCOME",
    parentId: null,
    currency: CURRENCY,
    deletedAt: null,
  },
  {
    id: 11,
    code: "7011",
    name: "Ventas de mercaderías",
    type: "INCOME",
    parentId: 10,
    currency: CURRENCY,
    deletedAt: null,
  },
  {
    id: 12,
    code: "60",
    name: "Compras",
    type: "EXPENSE",
    parentId: null,
    currency: CURRENCY,
    deletedAt: null,
  },
  {
    id: 13,
    code: "6011",
    name: "Compras de mercaderías",
    type: "EXPENSE",
    parentId: 12,
    currency: CURRENCY,
    deletedAt: null,
  },
];

/** Account ids used by journals/docs (resolved from fixtures above). */
export const ACC = {
  caja: 2,
  bancos: 3,
  clientes: 5,
  igv: 7,
  proveedores: 9,
  ventas: 11,
  compras: 13,
} as const;

export const JOURNAL_FIXTURES: readonly AccountingJournal[] = [
  {
    id: 1,
    code: "VEN",
    name: "Diario de ventas",
    kind: "SALES",
    defaultAccountId: ACC.clientes,
    deletedAt: null,
  },
  {
    id: 2,
    code: "COM",
    name: "Diario de compras",
    kind: "PURCHASES",
    defaultAccountId: ACC.proveedores,
    deletedAt: null,
  },
  {
    id: 3,
    code: "BAN",
    name: "Diario de bancos",
    kind: "BANK",
    defaultAccountId: ACC.bancos,
    deletedAt: null,
  },
  {
    id: 4,
    code: "CAJ",
    name: "Diario de caja",
    kind: "CASH",
    defaultAccountId: ACC.caja,
    deletedAt: null,
  },
  {
    id: 5,
    code: "MSC",
    name: "Diario misceláneo",
    kind: "MISCELLANEOUS",
    defaultAccountId: null,
    deletedAt: null,
  },
];

export const JOURNAL_ENTRY_FIXTURES: readonly JournalEntry[] = [
  {
    id: 1,
    number: "VEN-2026-0001",
    journalId: 1,
    entryDate: "2026-11-03T10:15:00",
    concept: "Factura cliente FC-001 — mercadería",
    referenceDocument: "FC-001",
    status: "POSTED",
    reversalOfId: null,
    createdBy: "demo-admin",
    lines: [
      { id: 1, accountId: ACC.clientes, debit: 1180, credit: 0 },
      { id: 2, accountId: ACC.ventas, debit: 0, credit: 1000 },
      { id: 3, accountId: ACC.igv, debit: 0, credit: 180 },
    ],
  },
  {
    id: 2,
    number: "COM-2026-0001",
    journalId: 2,
    entryDate: "2026-11-04T14:00:00",
    concept: "Factura proveedor FP-010 — stock",
    referenceDocument: "FP-010",
    status: "POSTED",
    reversalOfId: null,
    createdBy: "demo-admin",
    lines: [
      { id: 4, accountId: ACC.compras, debit: 500, credit: 0 },
      { id: 5, accountId: ACC.igv, debit: 90, credit: 0 },
      { id: 6, accountId: ACC.proveedores, debit: 0, credit: 590 },
    ],
  },
  {
    id: 3,
    number: "BAN-2026-0001",
    journalId: 3,
    entryDate: "2026-11-05T09:30:00",
    concept: "Cobro transferencia FC-001",
    referenceDocument: "COB-441",
    status: "POSTED",
    reversalOfId: null,
    createdBy: "demo-admin",
    lines: [
      { id: 7, accountId: ACC.bancos, debit: 590, credit: 0 },
      { id: 8, accountId: ACC.clientes, debit: 0, credit: 590 },
    ],
  },
  {
    id: 4,
    number: "MSC-2026-0001",
    journalId: 5,
    entryDate: "2026-11-08T16:00:00",
    concept: "Asiento de ajuste (borrador)",
    referenceDocument: null,
    status: "DRAFT",
    reversalOfId: null,
    createdBy: "demo-admin",
    lines: [
      { id: 9, accountId: ACC.caja, debit: 100, credit: 0, memo: "Arqueo" },
      { id: 10, accountId: ACC.bancos, debit: 0, credit: 100 },
    ],
  },
  {
    id: 5,
    number: "VEN-2026-0002",
    journalId: 1,
    entryDate: "2026-11-09T11:00:00",
    concept: "Contra-asiento VEN-2026-0001 (nota de crédito)",
    referenceDocument: "NC-001",
    status: "ANNULLED",
    reversalOfId: 1,
    createdBy: "demo-admin",
    lines: [
      { id: 11, accountId: ACC.ventas, debit: 1000, credit: 0 },
      { id: 12, accountId: ACC.igv, debit: 180, credit: 0 },
      { id: 13, accountId: ACC.clientes, debit: 0, credit: 1180 },
    ],
  },
];

export function cloneChartAccounts(): ChartAccount[] {
  return CHART_ACCOUNT_FIXTURES.map((a) => ({ ...a }));
}

export function cloneJournals(): AccountingJournal[] {
  return JOURNAL_FIXTURES.map((j) => ({ ...j }));
}

export function cloneJournalEntries(): JournalEntry[] {
  return JOURNAL_ENTRY_FIXTURES.map((e) => ({
    ...e,
    lines: e.lines.map((l) => ({ ...l })),
  }));
}
