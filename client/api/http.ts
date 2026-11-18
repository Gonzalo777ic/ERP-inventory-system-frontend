import axios from "axios";
import { inventoryApiBase } from "./apiBases";

export const http = axios.create({
  baseURL: inventoryApiBase(),
});




export async function tryRequest<T>(fn: () => Promise<{ data: T }>, fallback: () => Promise<T>): Promise<T> {
  try {
    const res = await fn();
    return res.data;
  } catch {
    return await fallback();
  }
}
