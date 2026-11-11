import { httpStore } from "../httpStore";
import {
  cloneChartAccounts,
  cloneJournalEntries,
  cloneJournals,
} from "../../data/accountingFixtures";
import {
  buildHubSummary,
  cloneAccountsPayable,
  cloneAccountsReceivable,
  cloneInvoices,
} from "../../data/accountingDocumentFixtures";
import type {
  AccountingHubSummary,
  AccountingInvoice,
  AccountingJournal,
  AccountsPayableDoc,
  AccountsReceivableDoc,
  ChartAccount,
  JournalEntry,
  JournalEntryListQuery,
} from "../../types/accounting";

const MOCK_LATENCY_MS = 180;
const ACCOUNTING_PATH = "/accounting";

let mockAccounts = cloneChartAccounts();
let mockJournals = cloneJournals();
let mockEntries = cloneJournalEntries();
let mockInvoices = cloneInvoices();
let mockAr = cloneAccountsReceivable();
let mockAp = cloneAccountsPayable();

function storeApiRoot(): string | null {
  const base = import.meta.env.VITE_STORE_API_URL;
  if (!base || typeof base !== "string" || base.trim() === "") {
    return null;
  }
  // VITE_STORE_API_URL is typically .../api/store — accounting may live under .../api
  return base.replace(/\/$/, "").replace(/\/store$/, "");
}

/**
 * Mock unless store API is set and VITE_ACCOUNTING_USE_MOCK=false.
 */
function useAccountingMock(): boolean {
  if (import.meta.env.VITE_ACCOUNTING_USE_MOCK === "true") return true;
  if (import.meta.env.VITE_ACCOUNTING_USE_MOCK === "false" && storeApiRoot()) {
    return false;
  }
  return true;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function accountingUrl(path: string): string {
  const root = storeApiRoot();
  if (!root) {
    throw new Error("VITE_STORE_API_URL no configurada para Contabilidad.");
  }
  return `${root}${ACCOUNTING_PATH}${path}`;
}

function matchesText(haystack: string, search?: string): boolean {
  if (!search?.trim()) return true;
  return haystack.toLowerCase().includes(search.trim().toLowerCase());
}

function filterEntries(
  rows: JournalEntry[],
  query: JournalEntryListQuery,
): JournalEntry[] {
  return rows
    .filter((e) => {
      if (query.journalId != null) return e.journalId === query.journalId;
      return true;
    })
    .filter((e) => {
      if (!query.status || query.status === "ALL") return true;
      return e.status === query.status;
    })
    .filter((e) =>
      matchesText(
        [e.number, e.concept, e.referenceDocument ?? "", String(e.id)].join(
          " ",
        ),
        query.search,
      ),
    )
    .map((e) => ({ ...e, lines: e.lines.map((l) => ({ ...l })) }))
    .sort((a, b) => b.entryDate.localeCompare(a.entryDate));
}

function activeAccounts(): ChartAccount[] {
  return mockAccounts
    .filter((a) => a.deletedAt == null)
    .map((a) => ({ ...a }));
}

function activeJournals(): AccountingJournal[] {
  return mockJournals
    .filter((j) => j.deletedAt == null)
    .map((j) => ({ ...j }));
}

export const AccountingService = {
  isMockMode: (): boolean => useAccountingMock(),

  listAccounts: async (): Promise<ChartAccount[]> => {
    if (useAccountingMock()) {
      await delay(MOCK_LATENCY_MS);
      return activeAccounts();
    }
    const response = await httpStore.get<ChartAccount[]>(
      accountingUrl("/accounts"),
    );
    return response.data.filter((a) => a.deletedAt == null);
  },

  listJournals: async (): Promise<AccountingJournal[]> => {
    if (useAccountingMock()) {
      await delay(MOCK_LATENCY_MS);
      return activeJournals();
    }
    const response = await httpStore.get<AccountingJournal[]>(
      accountingUrl("/journals"),
    );
    return response.data.filter((j) => j.deletedAt == null);
  },

  listEntries: async (
    query: JournalEntryListQuery = {},
  ): Promise<JournalEntry[]> => {
    if (useAccountingMock()) {
      await delay(MOCK_LATENCY_MS);
      return filterEntries(mockEntries, query);
    }
    const response = await httpStore.get<JournalEntry[]>(
      accountingUrl("/entries"),
      { params: query },
    );
    return filterEntries(response.data, query);
  },

  getEntryById: async (id: number): Promise<JournalEntry> => {
    if (useAccountingMock()) {
      await delay(MOCK_LATENCY_MS);
      const found = mockEntries.find((e) => e.id === id);
      if (!found) throw new Error(`Asiento ${id} no encontrado.`);
      return { ...found, lines: found.lines.map((l) => ({ ...l })) };
    }
    const response = await httpStore.get<JournalEntry>(
      accountingUrl(`/entries/${id}`),
    );
    return response.data;
  },

  listInvoices: async (): Promise<AccountingInvoice[]> => {
    if (useAccountingMock()) {
      await delay(MOCK_LATENCY_MS);
      return cloneInvoices();
    }
    const response = await httpStore.get<AccountingInvoice[]>(
      accountingUrl("/invoices"),
    );
    return response.data;
  },

  listAccountsReceivable: async (): Promise<AccountsReceivableDoc[]> => {
    if (useAccountingMock()) {
      await delay(MOCK_LATENCY_MS);
      return cloneAccountsReceivable();
    }
    const response = await httpStore.get<AccountsReceivableDoc[]>(
      accountingUrl("/accounts-receivable"),
    );
    return response.data;
  },

  listAccountsPayable: async (): Promise<AccountsPayableDoc[]> => {
    if (useAccountingMock()) {
      await delay(MOCK_LATENCY_MS);
      return cloneAccountsPayable();
    }
    const response = await httpStore.get<AccountsPayableDoc[]>(
      accountingUrl("/accounts-payable"),
    );
    return response.data;
  },

  getHubSummary: async (): Promise<AccountingHubSummary> => {
    if (useAccountingMock()) {
      await delay(MOCK_LATENCY_MS);
      return buildHubSummary(mockEntries, mockInvoices, mockAr, mockAp);
    }
    const response = await httpStore.get<AccountingHubSummary>(
      accountingUrl("/summary"),
    );
    return response.data;
  },

  /** Compat con libro diario legado (lista plana). */
  getAll: async (): Promise<JournalEntry[]> => {
    return AccountingService.listEntries();
  },

  getById: async (id: number): Promise<JournalEntry> => {
    return AccountingService.getEntryById(id);
  },

  /** Reset in-memory fixtures (tests / demo). */
  _resetMockStore: (): void => {
    mockAccounts = cloneChartAccounts();
    mockJournals = cloneJournals();
    mockEntries = cloneJournalEntries();
    mockInvoices = cloneInvoices();
    mockAr = cloneAccountsReceivable();
    mockAp = cloneAccountsPayable();
  },
};
