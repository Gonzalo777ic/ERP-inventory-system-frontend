import axios from "axios";
import { identityApiBase } from "../apiBases";
import { httpAuth } from "../httpAuth";
import type { EmployeeResponse, EmployeeWriteRequest } from "../../types/hr/employee";

const employeesUrl = (suffix = "") => `${identityApiBase()}/hr/employees${suffix}`;

export function readEmployeeError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object" && "message" in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export const EmployeeService = {
  async list(legalEntityId: number): Promise<EmployeeResponse[]> {
    const response = await httpAuth.get<EmployeeResponse[]>(employeesUrl(), {
      params: { legalEntityId },
    });
    return response.data;
  },

  async create(request: EmployeeWriteRequest): Promise<EmployeeResponse> {
    const response = await httpAuth.post<EmployeeResponse>(employeesUrl(), request);
    return response.data;
  },

  async update(id: number, request: EmployeeWriteRequest): Promise<EmployeeResponse> {
    const response = await httpAuth.put<EmployeeResponse>(employeesUrl(`/${id}`), {
      documentType: request.documentType,
      documentNumber: request.documentNumber,
      surnames: request.surnames,
      givenNames: request.givenNames,
      personalEmail: request.personalEmail,
      workEmail: request.workEmail,
      cuspp: request.cuspp,
      phones: request.phones,
      birthDate: request.birthDate,
      childrenCount: request.childrenCount,
      sex: request.sex,
      address: request.address,
    });
    return response.data;
  },

  async retire(id: number): Promise<void> {
    await httpAuth.delete(employeesUrl(`/${id}`));
  },
};
