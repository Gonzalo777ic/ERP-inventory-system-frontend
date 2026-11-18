import { storeApiBase } from "../apiBases";
import { httpStore } from "../httpStore";

import { PaymentMethodConfig, PaymentMethodPayload } from "../../types/store";

const paymentMethodsUrl = (suffix = "") => `${storeApiBase()}/store/payment-methods${suffix}`;

export const PaymentMethodService = {
  
  getAll: async (): Promise<PaymentMethodConfig[]> => {
    const response = await httpStore.get<PaymentMethodConfig[]>(paymentMethodsUrl());
    return response.data;
  },

  create: async (data: PaymentMethodPayload): Promise<PaymentMethodConfig> => {
    const response = await httpStore.post<PaymentMethodConfig>(paymentMethodsUrl(), data);
    return response.data;
  },
  
  update: async (id: number, data: PaymentMethodPayload): Promise<PaymentMethodConfig> => {
    const response = await httpStore.put<PaymentMethodConfig>(`${paymentMethodsUrl()}/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await httpStore.delete(`${paymentMethodsUrl()}/${id}`);
  }
};