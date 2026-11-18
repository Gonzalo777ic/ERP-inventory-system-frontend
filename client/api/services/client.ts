import { storeApiBase } from "../apiBases";
import { httpStore } from '../httpStore';

const clientsUrl = (suffix = "") => `${storeApiBase()}/customers${suffix}`; 

export interface Client {
    id: number;
    auth0Id: string | null;
    email: string;
    fullName: string;
    documentType: string | null;
    documentNumber: string | null;
    phone: string | null;
    address: string | null;
}


export interface DocumentTypeRef {
    key: string;
    description: string;
}

export const ClientService = {
    /**
     * Obtener todos los clientes externos.
     * GET /api/auth/clients
     */
    getAll: async (): Promise<Client[]> => {
        const response = await httpStore.get<Client[]>(clientsUrl());
        return response.data;
    },
    
    /**
     * Obtener los tipos de documentos fiscales (DNI, RUC, etc.) desde el backend.
     * GET /api/auth/clients/document-types
     */
    getDocumentTypes: async (): Promise<DocumentTypeRef[]> => {
        const response = await httpStore.get<DocumentTypeRef[]>(clientsUrl("/document-types"));
        return response.data;
    }
};