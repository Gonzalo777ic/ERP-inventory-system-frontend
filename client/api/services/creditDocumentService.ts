import { storeApiBase } from "../apiBases";
import { httpStore } from "../httpStore";
import { CreditDocument, CreditDocumentPayload, CreditDocumentStatus } from "../../types/store";

const creditDocumentsUrl = (suffix = "") => `${storeApiBase()}/store/credit-documents${suffix}`;

export const CreditDocumentService = {

  /**
   * Obtener TODOS los documentos legales (Dashboard General)
   */
  getAll: async (): Promise<CreditDocument[]> => {

    const response = await httpStore.get<CreditDocument[]>(creditDocumentsUrl());
    return response.data;
  },

  getByAccount: async (arId: number): Promise<CreditDocument[]> => {
    const response = await httpStore.get<CreditDocument[]>(`${creditDocumentsUrl()}/ar/${arId}`);
    return response.data;
  },

  create: async (data: CreditDocumentPayload): Promise<CreditDocument> => {
    const response = await httpStore.post<CreditDocument>(creditDocumentsUrl(), data);
    return response.data;
  },

  updateStatus: async (id: number, status: string): Promise<CreditDocument> => {
    const response = await httpStore.patch<CreditDocument>(`${creditDocumentsUrl()}/${id}/status?status=${status}`);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await httpStore.delete(`${creditDocumentsUrl()}/${id}`);
  },

  downloadPdf: async (id: number): Promise<Blob> => {
    const response = await httpStore.get<Blob>(`${creditDocumentsUrl()}/${id}/pdf`, {
      responseType: 'blob' 
    });
    return response.data;
  },

  /**
   * Firma el documento cambiando su estado a SIGNED.
   * Esto habilita la descarga del PDF oficial.
   */
  signDocument: async (id: number): Promise<CreditDocument> => {
    return CreditDocumentService.updateStatus(id, 'SIGNED');
  }
  
};