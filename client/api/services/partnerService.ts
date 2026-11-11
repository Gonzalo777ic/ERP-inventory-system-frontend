import { httpStore } from "../httpStore";
import { PARTNER_FIXTURES } from "../../data/partnerFixtures";
import type {
  PartnerListQuery,
  PartnerResponse,
  PartnerWriteRequest,
} from "../../types/partner";

const MOCK_ACTOR = "demo-admin";
const MOCK_LATENCY_MS = 180;

/** In-memory store so CRUD works without other services. */
let mockPartners: PartnerResponse[] = PARTNER_FIXTURES.map((p) => ({
  ...p,
  types: [...p.types],
}));
let nextId = Math.max(0, ...mockPartners.map((p) => p.id)) + 1;

function storeApiBase(): string | null {
  const base = import.meta.env.VITE_STORE_API_URL;
  if (!base || typeof base !== "string" || base.trim() === "") {
    return null;
  }
  return base.replace(/\/$/, "");
}

function partnersUrl(suffix = ""): string {
  const base = storeApiBase();
  if (!base) {
    throw new Error("VITE_STORE_API_URL no configurada.");
  }
  return `${base}/partners${suffix}`;
}

/**
 * Demo default: fixtures when no store URL, or when VITE_PARTNERS_USE_MOCK=true.
 * HTTP only when store URL is set and mock is explicitly disabled.
 */
export function partnersUseMock(): boolean {
  if (import.meta.env.VITE_PARTNERS_USE_MOCK === "true") return true;
  if (import.meta.env.VITE_PARTNERS_USE_MOCK === "false" && storeApiBase()) {
    return false;
  }
  return !storeApiBase();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function matchesSearch(partner: PartnerResponse, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    partner.displayName,
    partner.documentNumber,
    partner.email,
    partner.phone,
    partner.primaryAddress,
    ...partner.types,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function listFromMock(query: PartnerListQuery = {}): PartnerResponse[] {
  const includeRetired = query.includeRetired === true;
  return mockPartners
    .filter((p) => includeRetired || p.deletedAt === null)
    .filter((p) => matchesSearch(p, query.search ?? ""))
    .map((p) => ({ ...p, types: [...p.types] }));
}

export const PartnerService = {
  isMockMode: (): boolean => partnersUseMock(),

  async list(query: PartnerListQuery = {}): Promise<PartnerResponse[]> {
    if (partnersUseMock()) {
      await delay(MOCK_LATENCY_MS);
      return listFromMock(query);
    }
    const response = await httpStore.get<PartnerResponse[]>(partnersUrl(), {
      params: {
        search: query.search || undefined,
        includeRetired: query.includeRetired === true ? true : undefined,
      },
    });
    return response.data;
  },

  async getById(id: number): Promise<PartnerResponse> {
    if (partnersUseMock()) {
      await delay(MOCK_LATENCY_MS);
      const found = mockPartners.find((p) => p.id === id && p.deletedAt === null);
      if (!found) throw new Error(`Partner ${id} no encontrado`);
      return { ...found, types: [...found.types] };
    }
    const response = await httpStore.get<PartnerResponse>(partnersUrl(`/${id}`));
    return response.data;
  },

  async create(payload: PartnerWriteRequest): Promise<PartnerResponse> {
    if (partnersUseMock()) {
      await delay(MOCK_LATENCY_MS);
      const created: PartnerResponse = {
        id: nextId++,
        displayName: payload.displayName.trim(),
        isCompany: payload.isCompany,
        types: [...payload.types],
        documentType: payload.documentType,
        documentNumber: payload.documentNumber?.trim() || null,
        email: payload.email?.trim() || null,
        phone: payload.phone?.trim() || null,
        primaryAddress: payload.primaryAddress?.trim() || null,
        deletedAt: null,
        deletedBy: null,
      };
      mockPartners = [created, ...mockPartners];
      return { ...created, types: [...created.types] };
    }
    const response = await httpStore.post<PartnerResponse>(partnersUrl(), payload);
    return response.data;
  },

  async update(
    id: number,
    payload: PartnerWriteRequest,
  ): Promise<PartnerResponse> {
    if (partnersUseMock()) {
      await delay(MOCK_LATENCY_MS);
      const index = mockPartners.findIndex(
        (p) => p.id === id && p.deletedAt === null,
      );
      if (index < 0) throw new Error(`Partner ${id} no encontrado`);
      const updated: PartnerResponse = {
        ...mockPartners[index],
        displayName: payload.displayName.trim(),
        isCompany: payload.isCompany,
        types: [...payload.types],
        documentType: payload.documentType,
        documentNumber: payload.documentNumber?.trim() || null,
        email: payload.email?.trim() || null,
        phone: payload.phone?.trim() || null,
        primaryAddress: payload.primaryAddress?.trim() || null,
      };
      mockPartners = [
        ...mockPartners.slice(0, index),
        updated,
        ...mockPartners.slice(index + 1),
      ];
      return { ...updated, types: [...updated.types] };
    }
    const response = await httpStore.put<PartnerResponse>(
      partnersUrl(`/${id}`),
      payload,
    );
    return response.data;
  },

  /**
   * Soft-delete (dar de baja). Never physical DELETE.
   * API: POST /partners/{id}/retire
   */
  async retire(id: number): Promise<PartnerResponse> {
    if (partnersUseMock()) {
      await delay(MOCK_LATENCY_MS);
      const index = mockPartners.findIndex(
        (p) => p.id === id && p.deletedAt === null,
      );
      if (index < 0) {
        throw new Error(`Partner ${id} no encontrado o ya dado de baja`);
      }
      const retired: PartnerResponse = {
        ...mockPartners[index],
        deletedAt: new Date().toISOString(),
        deletedBy: MOCK_ACTOR,
      };
      mockPartners = [
        ...mockPartners.slice(0, index),
        retired,
        ...mockPartners.slice(index + 1),
      ];
      return { ...retired, types: [...retired.types] };
    }
    const response = await httpStore.post<PartnerResponse>(
      partnersUrl(`/${id}/retire`),
    );
    return response.data;
  },

  /** Test/demo helper: restore mock seed. */
  resetMockStore(): void {
    if (!partnersUseMock()) return;
    mockPartners = PARTNER_FIXTURES.map((p) => ({
      ...p,
      types: [...p.types],
    }));
    nextId = Math.max(0, ...mockPartners.map((p) => p.id)) + 1;
  },
};
