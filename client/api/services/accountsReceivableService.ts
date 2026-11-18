import { storeApiBase } from "../apiBases";
import { httpStore } from "../httpStore";
import { AccountsReceivable, Installment } from "../../types/store";

const receivablesUrl = (suffix = "") => `${storeApiBase()}/store/accounts-receivable${suffix}`;

export const AccountsReceivableService = {

    /**
     * Obtener todas las cuentas por cobrar.
     * Útil para reportes financieros globales.
     */
    getAll: async (): Promise<AccountsReceivable[]> => {
        const response = await httpStore.get<AccountsReceivable[]>(receivablesUrl());
        return response.data;
    },

    /**
     * Obtener la cuenta por cobrar asociada a una venta específica.
     * Incluye las cuotas (installments) y su estado actual.
     */
    getBySaleId: async (saleId: number): Promise<AccountsReceivable> => {
        const response = await httpStore.get<AccountsReceivable>(`${receivablesUrl()}/sale/${saleId}`);
        return response.data;
    },

    /**
     * Obtener solo las cuotas de una cuenta por cobrar.
     */
    getInstallments: async (arId: number): Promise<Installment[]> => {
        const response = await httpStore.get<Installment[]>(`${receivablesUrl()}/${arId}/installments`);
        return response.data;
    },

    /**
     * Obtener una cuenta por cobrar específica por su ID.
     */
    getById: async (id: number): Promise<AccountsReceivable> => {
        const response = await httpStore.get<AccountsReceivable>(`${receivablesUrl()}/${id}`);
        return response.data;
    },
};