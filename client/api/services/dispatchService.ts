import axios from "axios";
import { storeApiBase } from "../apiBases";
import { httpStore } from "../httpStore";

export type OrderRefKind = "CUSTOMER_ORDER" | "SALE_ORDER";
export type DeliveryScope = "TOTAL" | "PARCIAL";
export type RouteStatus = "ASIGNADO" | "EN_CAMINO" | "ENTREGADO";

export type RouteView = {
  id: number;
  carrierId: number;
  assignmentRef: string;
  orderKind: OrderRefKind;
  orderId: number;
  scope: DeliveryScope;
  summary: string;
  destinationLabel: string | null;
  latitude: number | null;
  longitude: number | null;
  status: RouteStatus;
  assignedAt: string;
  startedAt: string | null;
  deliveredAt: string | null;
  lastFixAt: string | null;
};

export type InboxView = {
  carrierId: number;
  carrierCode: string;
  carrierName: string;
  routes: RouteView[];
};

export type TrackingPolicy = {
  intervalSeconds: number;
  freshnessSeconds: number;
};

export type CarrierView = {
  id: number;
  code: string;
  displayName: string;
  identitySubject: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  lastFixAt: string | null;
};

export type NearbyCarrier = {
  carrierId: number;
  code: string;
  displayName: string;
  distanceMeters: number;
  lastFixAt: string;
  latitude: number;
  longitude: number;
};

export type NearbyResponse = {
  origin: {
    orderKind: OrderRefKind | null;
    orderId: number | null;
    label: string | null;
    latitude: number;
    longitude: number;
  };
  carriers: NearbyCarrier[];
};

const LOCATION_TOO_SOON = "LOCATION_TOO_SOON";
const ROUTE_NOT_IN_PROGRESS = "ROUTE_NOT_IN_PROGRESS";

function dispatchUrl(suffix = ""): string {
  return `${storeApiBase()}/dispatch${suffix}`;
}

export function isIgnoredLocationError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const code = error.response?.data?.code;
  return code === LOCATION_TOO_SOON || code === ROUTE_NOT_IN_PROGRESS;
}

export function dispatchErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim() !== "") return message;
  }
  return fallback;
}

export const dispatchService = {
  async policy(): Promise<TrackingPolicy> {
    const response = await httpStore.get<TrackingPolicy>(dispatchUrl("/tracking-policy"));
    return response.data;
  },
  async inbox(): Promise<InboxView> {
    const response = await httpStore.get<InboxView>(dispatchUrl("/inbox"));
    return response.data;
  },
  async start(routeId: number): Promise<RouteView> {
    const response = await httpStore.post<RouteView>(dispatchUrl(`/routes/${routeId}/start`));
    return response.data;
  },
  async deliver(routeId: number): Promise<RouteView> {
    const response = await httpStore.post<RouteView>(dispatchUrl(`/routes/${routeId}/deliver`));
    return response.data;
  },
  async recordLocation(routeId: number, latitude: number, longitude: number): Promise<RouteView> {
    const response = await httpStore.post<RouteView>(dispatchUrl(`/routes/${routeId}/locations`), {
      latitude,
      longitude,
    });
    return response.data;
  },
  async carriers(): Promise<CarrierView[]> {
    const response = await httpStore.get<CarrierView[]>(dispatchUrl("/carriers"));
    return response.data;
  },
  async registerCarrier(payload: {
    code: string;
    displayName: string;
    identitySubject: string;
    phone?: string;
  }): Promise<CarrierView> {
    const response = await httpStore.post<CarrierView>(dispatchUrl("/carriers"), payload);
    return response.data;
  },
  async retireCarrier(id: number): Promise<void> {
    await httpStore.post(dispatchUrl(`/carriers/${id}/retire`));
  },
  async nearby(query: {
    orderId?: number;
    orderKind?: OrderRefKind;
    latitude?: number;
    longitude?: number;
  }): Promise<NearbyResponse> {
    const response = await httpStore.get<NearbyResponse>(dispatchUrl("/carriers/nearby"), { params: query });
    return response.data;
  },
  async saveDeparture(orderId: number, payload: {
    orderKind: OrderRefKind;
    latitude: number;
    longitude: number;
    label?: string;
  }): Promise<void> {
    await httpStore.put(dispatchUrl(`/orders/${orderId}/departure`), payload);
  },
};
