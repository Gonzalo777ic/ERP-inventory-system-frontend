import axios from "axios";
import { identityApiBase } from "../apiBases";
import { httpAuth } from "../httpAuth";
import type {
  ContractDetail,
  ContractSummary,
  ContractTerms,
  HrCatalog,
  WorkStatement,
} from "../../types/hr/contract";

const contractsUrl = (suffix = "") => `${identityApiBase()}/hr/contracts${suffix}`;

export function readContractError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string" && data.trim()) return data;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export interface RosterQuery {
  legalEntityId: number;
  document?: string;
  name?: string;
  activeOnly?: boolean;
}

export const ContractService = {
  catalog: async (): Promise<HrCatalog> => {
    const response = await httpAuth.get<HrCatalog>(`${identityApiBase()}/hr/catalog`);
    return response.data;
  },

  roster: async (query: RosterQuery): Promise<ContractSummary[]> => {
    const response = await httpAuth.get<ContractSummary[]>(contractsUrl("/roster"), { params: query });
    return response.data;
  },

  detail: async (id: number): Promise<ContractDetail> => {
    const response = await httpAuth.get<ContractDetail>(contractsUrl(`/${id}`));
    return response.data;
  },

  create: async (body: {
    employeeId: number;
    contractType?: string;
    startsOn: string;
    endsOn?: string | null;
    wage: { amount: number; currency?: string };
  }): Promise<void> => {
    await httpAuth.post(contractsUrl(), body);
  },

  updateTerms: async (id: number, body: Record<string, unknown>): Promise<ContractTerms> => {
    const response = await httpAuth.put<ContractTerms>(contractsUrl(`/${id}/terms`), body);
    return response.data;
  },

  cease: async (id: number, on: string, reason: string): Promise<void> => {
    await httpAuth.post(contractsUrl(`/${id}/cease`), { on, reason });
  },

  activate: async (id: number): Promise<void> => {
    await httpAuth.post(contractsUrl(`/${id}/activate`));
  },

  proposeWage: async (id: number, amount: number, validFrom: string): Promise<void> => {
    await httpAuth.post(contractsUrl(`/${id}/wages`), { amount: { amount }, validFrom });
  },

  approveWage: async (id: number, wageId: number): Promise<void> => {
    await httpAuth.post(contractsUrl(`/${id}/wages/${wageId}/approve`));
  },

  addRole: async (id: number, title: string, startsOn: string): Promise<void> => {
    await httpAuth.post(contractsUrl(`/${id}/roles`), { title, startsOn });
  },

  addShift: async (id: number, name: string, startsOn: string): Promise<void> => {
    await httpAuth.post(contractsUrl(`/${id}/shifts`), { name, startsOn });
  },

  addAffiliation: async (
    id: number,
    name: string,
    amountKind: string,
    amount: number | null
  ): Promise<void> => {
    await httpAuth.post(contractsUrl(`/${id}/affiliations`), {
      name,
      amountKind,
      amount: amount == null ? null : { amount },
    });
  },

  deactivateAffiliation: async (id: number, affiliationId: number): Promise<void> => {
    await httpAuth.post(contractsUrl(`/${id}/affiliations/${affiliationId}/deactivate`));
  },

  renew: async (id: number, startsOn: string, endsOn: string, notes: string): Promise<void> => {
    await httpAuth.post(contractsUrl(`/${id}/renewals`), { startsOn, endsOn, notes: notes || null });
  },

  addAnnex: async (id: number, fileName: string, comment: string): Promise<void> => {
    await httpAuth.post(contractsUrl(`/${id}/annexes`), { fileName, comment: comment || null });
  },

  statement: async (id: number, kind: "work" | "cts"): Promise<WorkStatement> => {
    const response = await httpAuth.get<WorkStatement>(contractsUrl(`/${id}/statements/${kind}`));
    return response.data;
  },
};
