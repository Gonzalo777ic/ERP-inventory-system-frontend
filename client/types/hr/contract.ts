export interface CatalogOption {
  code: string;
  label: string;
  sunatCode: string | null;
}

export interface HrCatalog {
  banks: CatalogOption[];
  workerKinds: CatalogOption[];
  pensionRegimes: CatalogOption[];
  laborRegimes: CatalogOption[];
  paymentMethods: CatalogOption[];
  accountTypes: CatalogOption[];
  contractTypes: CatalogOption[];
  affiliationKinds: CatalogOption[];
  retentionModes: CatalogOption[];
  contractStatuses: CatalogOption[];
  wageStatuses: CatalogOption[];
}

export interface MoneyAmount {
  amount: number;
  currency: string;
}

export interface ContractSummary {
  id: number;
  employeeId: number;
  legalEntityId: number;
  documentType: string;
  documentNumber: string;
  displayName: string;
  workerKind: string | null;
  payrollGroup: string | null;
  contractType: string;
  status: string;
  startsOn: string;
  endsOn: string | null;
  cessationOn: string | null;
}

export interface PaymentAccount {
  method: string | null;
  bank: string | null;
  sunatCode: string | null;
  bankLabel: string | null;
  accountType: string | null;
  number: string | null;
  currency: string | null;
}

export interface ContractTerms {
  workerKind: string | null;
  payrollGroup: string | null;
  pensionRegime: string | null;
  laborRegime: string | null;
  allowSalaryAdvance: boolean;
  notes: string | null;
  wages: PaymentAccount | null;
  cts: PaymentAccount | null;
  retentionMode: string | null;
  retentionValue: number | null;
  retentionBeneficiary: string | null;
  cessationOn: string | null;
  cessationReason: string | null;
}

export interface WageRow {
  id: number;
  amount: MoneyAmount;
  validFrom: string;
  status: string;
  approvedBy: string | null;
  approvedAt: string | null;
}

export interface RoleRow {
  id: number;
  title: string;
  startsOn: string;
  endsOn: string | null;
}

export interface ShiftRow {
  id: number;
  name: string;
  startsOn: string;
}

export interface AffiliationRow {
  id: number;
  name: string;
  amountKind: string;
  amount: MoneyAmount | null;
  active: boolean;
}

export interface RenewalRow {
  id: number;
  startsOn: string;
  endsOn: string;
  notes: string | null;
}

export interface AnnexRow {
  id: number;
  fileName: string;
  comment: string | null;
  recordedBy: string;
  recordedAt: string;
}

export interface ContractDetail {
  summary: ContractSummary;
  terms: ContractTerms;
  wage: MoneyAmount;
  wages: WageRow[];
  roles: RoleRow[];
  shifts: ShiftRow[];
  affiliations: AffiliationRow[];
  renewals: RenewalRow[];
  annexes: AnnexRow[];
}

export interface WorkStatement {
  kind: string;
  text: string;
}
