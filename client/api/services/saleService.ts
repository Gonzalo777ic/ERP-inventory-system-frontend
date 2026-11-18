import { storeApiBase } from "../apiBases";
import { httpStore } from "../httpStore";

import { Sale, SalePayload, SaleCreationDTO, SaleTypeRef } from "../../types/store";


const salesUrl = (suffix = "") => `${storeApiBase()}/store/sales${suffix}`;

export const SaleService = {
    
    /**
     * Obtener todas las ventas.
     * Soporta filtrado automático por rol en el backend.
     */
    getAll: async (): Promise<Sale[]> => {
        const response = await httpStore.get<Sale[]>(salesUrl());
        return response.data;
    },

    /**
     * Obtener una venta por ID con sus detalles y cobranzas.
     */
    getById: async (id: number): Promise<Sale> => {
        const response = await httpStore.get<Sale>(`${salesUrl()}/${id}`);
        return response.data;
    },

    /**
     * Crear una venta completa (Cabecera + Detalles).
     * Este es el método principal de registro de ventas.
     */
    createSaleWithDetails: async (data: SaleCreationDTO): Promise<Sale> => {
        const response = await httpStore.post<Sale>(salesUrl(), data);
        return response.data;
    },

    /** * Método legacy/alternativo para crear venta simple.
     * Se recomienda usar createSaleWithDetails.
     */
    create: async (data: SalePayload): Promise<Sale> => {
        const response = await httpStore.post<Sale>(salesUrl(), data);
        return response.data;
    },

    /**
     * Actualizar solo el estado de la venta (Ej: CANCELAR).
     */
    updateStatus: async (id: number, newStatus: string): Promise<Sale> => {
        const response = await httpStore.put<Sale>(`${salesUrl()}/${id}/status`, newStatus, {
             headers: { 'Content-Type': 'text/plain' }
        });
        return response.data;
    },

    /**
     * Obtener los tipos de comprobante disponibles (Boleta, Factura, etc.)
     * GET /api/store/sales/types
     */
    getSaleTypes: async (): Promise<SaleTypeRef[]> => {
        const response = await httpStore.get<SaleTypeRef[]>(`${salesUrl()}/types`);
        return response.data;
    },

    cancelSale: async (id: number): Promise<void> => {
        await httpStore.patch(`${salesUrl()}/${id}/cancel`);
    }
};