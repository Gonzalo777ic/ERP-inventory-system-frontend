import type { ReactNode } from "react";
import type { CatalogOption, MoneyAmount } from "@/types/hr/contract";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function optionLabel(options: CatalogOption[] | undefined, code: string | null | undefined) {
  if (!code) return "—";
  return options?.find((item) => item.code === code)?.label ?? code;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function formatMoney(amount: MoneyAmount | null | undefined) {
  if (!amount) return "—";
  const shown = amount.amount.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${shown} ${amount.currency}`;
}

export function ContractStatusBadge({
  status,
  catalog,
}: {
  status: string;
  catalog?: CatalogOption[];
}) {
  const variant =
    status === "ACTIVE" ? "success" : status === "DRAFT" ? "warning" : status === "CANCELLED" ? "danger" : "secondary";
  return <Badge variant={variant}>{optionLabel(catalog, status)}</Badge>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function CatalogSelect({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: CatalogOption[] | undefined;
  placeholder: string;
  ariaLabel: string;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {(options ?? []).map((option) => (
          <SelectItem key={option.code} value={option.code}>
            {option.sunatCode ? `${option.label} (${option.sunatCode})` : option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
