import { storeApiBase } from "../apiBases";
import { httpStore } from "../httpStore";

const taxRatesUrl = (suffix = "") => `${storeApiBase()}/store/tax-rates${suffix}`;

/**
 * INTERFAZ DE MODELO SINCRONIZADA CON EL BACKEND
 */
export interface TaxRate {
  id: number;
  name: string;
  rate: number;
}


type TaxRatePayload = Omit<TaxRate, 'id'>;

export const TaxRateService = {
  getAll: async (): Promise<TaxRate[]> => {

    const response = await httpStore.get<TaxRate[]>(taxRatesUrl());
    return response.data;
  },

  create: async (data: TaxRatePayload): Promise<TaxRate> => {

    const response = await httpStore.post<TaxRate>(taxRatesUrl(), data);
    return response.data;
  },
  
  
  update: async (id: number, data: TaxRatePayload): Promise<TaxRate> => {

    const response = await httpStore.put<TaxRate>(taxRatesUrl(`/${id}`), data);
    return response.data;
  },

  retire: async (id: number): Promise<void> => {
    await httpStore.post(taxRatesUrl(`/${id}/retire`));
  }
};