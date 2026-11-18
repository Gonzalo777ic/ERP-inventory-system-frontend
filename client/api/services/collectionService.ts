import { storeApiBase } from "../apiBases";
import { httpStore } from "../httpStore";
import { Collection, CollectionPayload } from "../../types/inventory/collections";

const collectionsUrl = (suffix = "") => `${storeApiBase()}/store/collections${suffix}`;

export const CollectionService = {
  

  getAll: async (): Promise<Collection[]> => {
    const response = await httpStore.get<Collection[]>(collectionsUrl());
    return response.data;
  },


  getBySaleId: async (saleId: number): Promise<Collection[]> => {
    const response = await httpStore.get<Collection[]>(`${collectionsUrl()}/sale/${saleId}`);
    return response.data;
  },


  create: async (data: CollectionPayload): Promise<Collection> => {
    const response = await httpStore.post<Collection>(collectionsUrl(), data);
    return response.data;
  },
  

  delete: async (id: number): Promise<void> => {
    await httpStore.delete(`${collectionsUrl()}/${id}`);
  }
};