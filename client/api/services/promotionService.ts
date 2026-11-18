import { storeApiBase } from "../apiBases";
import { httpStore } from "../httpStore";

const promotionsUrl = (suffix = "") => `${storeApiBase()}/store/promotions${suffix}`;
const promotionTargetsUrl = (suffix = "") => `${storeApiBase()}/store/promotion-targets${suffix}`; 



export interface Promotion {
  id: number;
  name: string;
  type: 'PORCENTAJE' | 'MONTO_FIJO' | 'TRES_POR_DOS' | string;
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  appliesTo: 'PRODUCT' | 'CATEGORY' | 'SALE_TOTAL' | string;
}

export type PromotionPayload = Omit<Promotion, 'id'>;



export interface PromotionTarget {
    id?: number;
    promotionId: number;
    targetType: 'PRODUCT' | 'CATEGORY' | string;
    targetId: number;
}



export const PromotionService = {
  
  getAll: async (): Promise<Promotion[]> => {

    const response = await httpStore.get<Promotion[]>(promotionsUrl());
    return response.data;
  },
  
  create: async (data: PromotionPayload): Promise<Promotion> => {

    const response = await httpStore.post<Promotion>(promotionsUrl(), data);
    return response.data;
  },

  update: async (id: number, data: PromotionPayload): Promise<Promotion> => {

    const response = await httpStore.put<Promotion>(`${promotionsUrl()}/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {

    await httpStore.delete(`${promotionsUrl()}/${id}`);
  },


  
  getTargetsByPromotion: async (promotionId: number): Promise<PromotionTarget[]> => {

    const response = await httpStore.get<PromotionTarget[]>(`${promotionTargetsUrl()}/by-promotion/${promotionId}`);
    return response.data;
  },

  bulkUpdateTargets: async (promotionId: number, targets: PromotionTarget[]): Promise<PromotionTarget[]> => {

    const response = await httpStore.post<PromotionTarget[]>(`${promotionTargetsUrl()}/bulk-update/${promotionId}`, targets);
    return response.data;
  },
  

};