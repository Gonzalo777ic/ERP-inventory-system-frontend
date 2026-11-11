import { ProcurementService } from "./procurement";
import type {
  OrderStatus,
  PurchaseOrder,
  PurchaseOrderPayload,
} from "../../types/index";

/** Thin adapters over ProcurementService for form / page imports. */

export const getPurchaseOrders = async (params?: {
  filterSupplierId?: number;
}): Promise<PurchaseOrder[]> =>
  ProcurementService.listOrders(params?.filterSupplierId);

export const getPurchaseOrderById = async (
  id: number,
): Promise<PurchaseOrder> => ProcurementService.getOrder(id);

export const createPurchaseOrder = async (
  payload: PurchaseOrderPayload,
): Promise<PurchaseOrder> => ProcurementService.createOrder(payload);

export const updatePurchaseOrder = async (
  id: number,
  payload: PurchaseOrderPayload,
): Promise<PurchaseOrder> => ProcurementService.updateOrder(id, payload);

export const updateOrderStatus = async (
  id: number,
  status: OrderStatus,
): Promise<PurchaseOrder> =>
  ProcurementService.updateOrderStatus(id, status);

/** Anula la orden (libro); no borra filas. */
export const cancelPurchaseOrder = async (
  id: number,
): Promise<PurchaseOrder> => ProcurementService.cancelOrder(id);

export const receivePurchaseOrder = async (
  id: number,
): Promise<PurchaseOrder> => ProcurementService.receiveOrder(id);

/** @deprecated Prefer cancelPurchaseOrder — anula el documento, no elimina. */
export const deletePurchaseOrder = cancelPurchaseOrder;
