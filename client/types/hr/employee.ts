export const IDENTITY_DOCUMENT_TYPES = ["DNI", "CE", "PASSPORT", "PTP"] as const;
export type IdentityDocumentType = (typeof IDENTITY_DOCUMENT_TYPES)[number];

export const IDENTITY_DOCUMENT_LABELS: Record<IdentityDocumentType, string> = {
  DNI: "DNI",
  CE: "Carné de extranjería",
  PASSPORT: "Pasaporte",
  PTP: "PTP",
};

export const SEXES = ["FEMALE", "MALE"] as const;
export type Sex = (typeof SEXES)[number];

export const SEX_LABELS: Record<Sex, string> = {
  FEMALE: "Femenino",
  MALE: "Masculino",
};

export const PHONE_USES = ["PERSONAL", "WORK", "OTHER"] as const;
export type PhoneUse = (typeof PHONE_USES)[number];

export const PHONE_USE_LABELS: Record<PhoneUse, string> = {
  PERSONAL: "Personal",
  WORK: "Laboral",
  OTHER: "Otro",
};

export interface EmployeePhone {
  use: PhoneUse;
  number: string;
}

export interface EmployeeAddress {
  line: string;
  district: string | null;
  city: string | null;
}

/** Proyección de la ficha. La edad llega calculada; la pantalla no la recalcula. */
export interface EmployeeResponse {
  id: number;
  legalEntityId: number;
  documentType: IdentityDocumentType;
  documentNumber: string;
  surnames: string;
  givenNames: string;
  displayName: string;
  personalEmail: string | null;
  workEmail: string | null;
  cuspp: string | null;
  phones: EmployeePhone[];
  birthDate: string;
  ageYears: number;
  childrenCount: number;
  sex: Sex;
  address: EmployeeAddress;
}

export interface EmployeeWriteRequest {
  legalEntityId?: number;
  documentType: IdentityDocumentType;
  documentNumber: string;
  surnames: string;
  givenNames: string;
  personalEmail: string | null;
  workEmail: string | null;
  cuspp: string | null;
  phones: EmployeePhone[];
  birthDate: string;
  childrenCount: number;
  sex: Sex;
  address: EmployeeAddress;
}
