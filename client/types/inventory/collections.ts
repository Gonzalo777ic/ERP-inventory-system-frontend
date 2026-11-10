import { PaymentMethodConfig, Sale } from "../index";

export interface Collection {
    id: number;
    sale?: Sale;
    saleId?: number;
    accountsReceivableId?: number;
    installmentId?: number;
    collectionDate: string;
    amount: number;
    paymentMethod: PaymentMethodConfig;
    referenceNumber?: string;
    status: "PENDING" | "CONFIRMED" | "CANCELLED";
}

export interface CollectionPayload {
    saleId: number;
    amount: number;
    paymentMethodId: number;
    referenceNumber?: string;
    collectionDate?: string;
}


export interface SaleWithBalance extends Sale {
    paidAmount: number;
    balance: number;
    isOverdue?: boolean;
    dueDateStr?: string;
}