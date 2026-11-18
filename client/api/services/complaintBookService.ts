import axios from "axios";
import { storeApiBase } from "../apiBases";
import { httpStore } from "../httpStore";

export interface CodedOption {
  code: string;
  label: string;
  description: string;
}

export interface ComplaintCatalog {
  kinds: CodedOption[];
  documentTypes: { code: string; label: string; minLength: number; maxLength: number }[];
  subjectKinds: CodedOption[];
  statuses: CodedOption[];
}

export interface ComplaintAction {
  code: string;
  label: string;
  path: string;
  textField: string | null;
  textLabel: string | null;
}

export interface ComplaintSheet {
  id: number;
  sheetNumber: string;
  filedAt: string;
  customerId: number | null;
  consumerName: string;
  documentType: string;
  documentTypeLabel: string;
  documentNumber: string;
  address: string;
  phone: string;
  email: string;
  minor: boolean;
  guardianName: string | null;
  guardianDocumentType: string | null;
  guardianDocumentTypeLabel: string | null;
  guardianDocumentNumber: string | null;
  subjectKind: string;
  subjectKindLabel: string;
  subjectDescription: string;
  claimedAmount: string | null;
  currency: string | null;
  orderReference: string | null;
  kind: string;
  kindLabel: string;
  detail: string;
  consumerRequest: string;
  status: string;
  statusLabel: string;
  providerResponse: string | null;
  attentionStartedAt: string | null;
  attentionStartedBy: string | null;
  attendedAt: string | null;
  attendedBy: string | null;
  voidedAt: string | null;
  voidedBy: string | null;
  voidReason: string | null;
  actions: ComplaintAction[];
}

const complaintsUrl = (suffix = "") => `${storeApiBase()}/store/complaints${suffix}`;

export const ComplaintBookService = {
  list: async (): Promise<ComplaintSheet[]> => {
    const response = await httpStore.get<ComplaintSheet[]>(complaintsUrl());
    return response.data;
  },

  get: async (id: number): Promise<ComplaintSheet> => {
    const response = await httpStore.get<ComplaintSheet>(complaintsUrl(`/${id}`));
    return response.data;
  },

  apply: async (id: number, action: ComplaintAction, text: string): Promise<ComplaintSheet> => {
    if (!/^[a-z]+$/.test(action.path)) {
      throw new Error("Transición no publicada");
    }
    const body = action.textField ? { [action.textField]: text } : {};
    const response = await httpStore.post<ComplaintSheet>(complaintsUrl(`/${id}/${action.path}`), body);
    return response.data;
  },
};

export function complaintErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
