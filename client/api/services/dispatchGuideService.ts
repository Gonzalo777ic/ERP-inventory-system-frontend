import axios from "axios";
import { storeApiBase } from "../apiBases";
import { httpStore } from "../httpStore";
import type {
  AssignDeliveryPayload,
  CreateDispatchGuidePayload,
  DispatchCatalogItem,
  DispatchGuide,
  DispatchGuidePage,
  DispatchGuideQuery,
} from "../../types/dispatch";

/** Tamaño de página de los listados de despacho. No es una regla de negocio. */
export const DISPATCH_LIST_PAGE_SIZE = 50;

export const dispatchQueryKeys = {
  all: ["dispatch-guides"] as const,
  list: (query: DispatchGuideQuery) => [...dispatchQueryKeys.all, "list", query] as const,
  detail: (id: number) => [...dispatchQueryKeys.all, "detail", id] as const,
  reasons: () => [...dispatchQueryKeys.all, "reasons"] as const,
  statuses: () => [...dispatchQueryKeys.all, "statuses"] as const,
  assignmentStatuses: () => [...dispatchQueryKeys.all, "assignment-statuses"] as const,
};

const guidesUrl = (suffix = "") => `${storeApiBase()}/dispatch/guides${suffix}`;

export function dispatchErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message && message.trim()) {
      return message;
    }
  }
  return fallback;
}

export const DispatchGuideService = {
  async list(query: DispatchGuideQuery): Promise<DispatchGuidePage> {
    const response = await httpStore.get<DispatchGuidePage>(guidesUrl(), {
      params: {
        status: query.status || undefined,
        assignmentStatus: query.assignmentStatus || undefined,
        q: query.q?.trim() || undefined,
        assignable: query.assignable || undefined,
        page: query.page,
        size: DISPATCH_LIST_PAGE_SIZE,
      },
    });
    return response.data;
  },

  async get(id: number): Promise<DispatchGuide> {
    const response = await httpStore.get<DispatchGuide>(guidesUrl(`/${id}`));
    return response.data;
  },

  async create(payload: CreateDispatchGuidePayload): Promise<DispatchGuide> {
    const response = await httpStore.post<DispatchGuide>(guidesUrl(), payload);
    return response.data;
  },

  async issue(id: number): Promise<DispatchGuide> {
    const response = await httpStore.post<DispatchGuide>(guidesUrl(`/${id}/issue`));
    return response.data;
  },

  async voidGuide(id: number, reason: string): Promise<DispatchGuide> {
    const response = await httpStore.post<DispatchGuide>(guidesUrl(`/${id}/void`), { reason });
    return response.data;
  },

  async assignDelivery(id: number, payload: AssignDeliveryPayload): Promise<DispatchGuide> {
    const response = await httpStore.post<DispatchGuide>(guidesUrl(`/${id}/delivery`), payload);
    return response.data;
  },

  async transferReasons(): Promise<DispatchCatalogItem[]> {
    const response = await httpStore.get<DispatchCatalogItem[]>(guidesUrl("/transfer-reasons"));
    return response.data;
  },

  async statuses(): Promise<DispatchCatalogItem[]> {
    const response = await httpStore.get<DispatchCatalogItem[]>(guidesUrl("/statuses"));
    return response.data;
  },

  async assignmentStatuses(): Promise<DispatchCatalogItem[]> {
    const response = await httpStore.get<DispatchCatalogItem[]>(guidesUrl("/assignment-statuses"));
    return response.data;
  },
};
