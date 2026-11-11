import type {
  PurchaseOrder,
  Quotation,
  QuotationPayload,
} from "../../types/index";
import { ProcurementService } from "./procurement";

export const getQuotations = async (params?: {
  supplierId?: number;
}): Promise<Quotation[]> =>
  ProcurementService.listQuotations(params?.supplierId);

export const getQuotationById = async (id: number): Promise<Quotation> =>
  ProcurementService.getQuotation(id);

export const createQuotation = async (
  payload: QuotationPayload,
): Promise<Quotation> => ProcurementService.createQuotation(payload);

export const linkProductToDetail = async (
  quotationId: number,
  detailId: number,
  productId: number,
): Promise<Quotation> =>
  ProcurementService.linkQuotationProduct(quotationId, detailId, productId);

export const convertToOrder = async (
  quotationId: number,
): Promise<PurchaseOrder> =>
  ProcurementService.convertQuotationToOrder(quotationId);

export const updateQuotation = async (
  id: number,
  payload: QuotationPayload,
): Promise<Quotation> => ProcurementService.updateQuotation(id, payload);

export const changeQuotationStatus = async (
  id: number,
  status: string,
): Promise<Quotation> =>
  ProcurementService.changeQuotationStatus(id, status);
