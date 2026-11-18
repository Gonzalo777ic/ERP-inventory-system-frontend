import { storeApiBase } from "../apiBases";
import { httpStore } from "../httpStore";

import { SaleDetail, SaleDetailPayload } from "../../types/store";

const saleDetailsUrl = (suffix = "") => `${storeApiBase()}/store/saledetails${suffix}`;

export const SaleDetailService = {

    /**
     * Obtiene todos los detalles de una venta específica por su ID.
     * GET /api/store/saledetails/sale/{saleId}
     */
    getDetailsBySaleId: async (saleId: number): Promise<SaleDetail[]> => {
        const response = await httpStore.get<SaleDetail[]>(`${saleDetailsUrl()}/sale/${saleId}`);
        return response.data;
    },

    /**
     * Añade un nuevo detalle (ítem/producto) a una venta YA EXISTENTE.
     * POST /api/store/saledetails
     * Nota: Para ventas nuevas, usar SaleService.createSaleWithDetails
     */
    addDetail: async (detailPayload: SaleDetailPayload): Promise<SaleDetail> => {
        const response = await httpStore.post<SaleDetail>(saleDetailsUrl(), detailPayload);
        return response.data;
    },

    /**
     * Elimina un detalle de venta por su ID.
     * DELETE /api/store/saledetails/{id}
     */
    deleteDetail: async (detailId: number): Promise<void> => {
        await httpStore.delete(`${saleDetailsUrl()}/${detailId}`);
    },
};