/**
 * Partner DTOs aligned with the Contactos maestro (cliente / proveedor / empleado / contacto).
 * Soft-delete via deletedAt; list endpoints exclude retired rows by default.
 */

export const PARTNER_TYPES = [
  "CUSTOMER",
  "SUPPLIER",
  "EMPLOYEE",
  "CONTACT",
] as const;

export type PartnerType = (typeof PARTNER_TYPES)[number];

export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  CUSTOMER: "Cliente",
  SUPPLIER: "Proveedor",
  EMPLOYEE: "Empleado",
  CONTACT: "Contacto",
};

/** Semantic Badge variants for each partner type (tokens in global.css). */
export const PARTNER_TYPE_BADGE_VARIANT: Record<
  PartnerType,
  "info" | "warning" | "success" | "neutral"
> = {
  CUSTOMER: "info",
  SUPPLIER: "warning",
  EMPLOYEE: "success",
  CONTACT: "neutral",
};

export const PARTNER_DOCUMENT_TYPES = [
  "DNI",
  "RUC",
  "CE",
  "PASSPORT",
  "OTHER",
] as const;

export type PartnerDocumentType = (typeof PARTNER_DOCUMENT_TYPES)[number];

export const PARTNER_DOCUMENT_TYPE_LABELS: Record<PartnerDocumentType, string> =
  {
    DNI: "DNI",
    RUC: "RUC",
    CE: "Carné de extranjería",
    PASSPORT: "Pasaporte",
    OTHER: "Otro",
  };

/** Outbound list/detail projection (never a JPA entity). */
export interface PartnerResponse {
  id: number;
  displayName: string;
  isCompany: boolean;
  types: PartnerType[];
  documentType: PartnerDocumentType | null;
  documentNumber: string | null;
  email: string | null;
  phone: string | null;
  primaryAddress: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
}

export interface PartnerWriteRequest {
  displayName: string;
  isCompany: boolean;
  types: PartnerType[];
  documentType: PartnerDocumentType | null;
  documentNumber: string | null;
  email: string | null;
  phone: string | null;
  primaryAddress: string | null;
}

export interface PartnerListQuery {
  /** Free-text search over name, document, email, phone */
  search?: string;
  /** When true, include soft-deleted (audit). Default false. */
  includeRetired?: boolean;
}
