import { storeApiBase } from "../apiBases";
import { httpStore } from "../httpStore";
import { SaleReturn, SaleReturnRequestPayload } from "../../types/store";

const saleReturnsUrl = (suffix = "") => `${storeApiBase()}/store/sale-returns${suffix}`;

export const SaleReturnService = {

    /**
     * Crea un borrador de devolución.
     * Valida cantidades y calcula montos, pero no afecta inventario ni caja todavía.
     */
    createDraft: async (payload: SaleReturnRequestPayload): Promise<SaleReturn> => {
        const response = await httpStore.post<SaleReturn>(saleReturnsUrl(), payload);
        return response.data;
    },

    /**
     * Confirma la devolución.
     * Genera la Nota de Crédito, mueve el stock e impacta cuentas por cobrar.
     */
    confirm: async (returnId: number): Promise<SaleReturn> => {
        const response = await httpStore.post<SaleReturn>(`${saleReturnsUrl()}/${returnId}/confirm`);
        return response.data;
    },

    /**
     * Obtiene el historial de devoluciones de una venta específica.
     */
    getBySale: async (saleId: number): Promise<SaleReturn[]> => {
        const response = await httpStore.get<SaleReturn[]>(`${saleReturnsUrl()}/sale/${saleId}`);
        return response.data;
    },


    getAll: async (): Promise<SaleReturn[]> => {
        const response = await httpStore.get<SaleReturn[]>(saleReturnsUrl());
        return response.data;
    },
    
    /**
     * Cancela un borrador (opcional, si implementaste el endpoint DELETE)
     */
    cancelDraft: async (returnId: number): Promise<void> => {
        await httpStore.delete(`${saleReturnsUrl()}/${returnId}`);
    }
};