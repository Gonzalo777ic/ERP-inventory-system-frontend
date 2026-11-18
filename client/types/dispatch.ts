export type DispatchGuideLine = {
  id: number;
  productId: number | null;
  productName: string;
  quantity: number;
};

export type DispatchGuide = {
  id: number;
  documentNumber: string | null;
  series: string | null;
  number: string | null;
  status: string;
  statusLabel: string;
  transferReason: string;
  transferReasonLabel: string;
  senderName: string;
  recipientName: string;
  recipientDocument: string | null;
  originAddress: string;
  destinationAddress: string;
  saleId: number | null;
  saleOrderId: number | null;
  notes: string | null;
  createdAt: string;
  issuedAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  assignmentStatus: string;
  assignmentStatusLabel: string;
  assigneeName: string | null;
  assigneeReference: string | null;
  medium: string | null;
  assignedAt: string | null;
  canIssue: boolean;
  canAssignDelivery: boolean;
  canVoid: boolean;
  lines: DispatchGuideLine[];
};

export type DispatchGuidePage = {
  content: DispatchGuide[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type DispatchCatalogItem = {
  key: string;
  label: string;
};

export type CreateDispatchGuideLine = {
  productId: number | null;
  productName: string;
  quantity: number;
};

export type CreateDispatchGuidePayload = {
  senderName: string;
  recipientName: string;
  recipientDocument: string | null;
  transferReason: string;
  originAddress: string;
  destinationAddress: string;
  saleId: number | null;
  saleOrderId: number | null;
  notes: string | null;
  lines: CreateDispatchGuideLine[];
};

export type AssignDeliveryPayload = {
  assigneeName: string | null;
  assigneeReference: string | null;
  medium: string | null;
};

export type DispatchGuideQuery = {
  status?: string;
  assignmentStatus?: string;
  q?: string;
  assignable?: boolean;
  page: number;
};
