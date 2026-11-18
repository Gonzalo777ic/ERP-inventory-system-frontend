import type { BadgeProps } from "@/components/ui/badge";

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

const STATUS_TONE: Record<string, BadgeVariant> = {
  RECEIVED: "warning",
  IN_ATTENTION: "info",
  ATTENDED: "success",
  VOIDED: "neutral",
};

const WHEN_FORMAT = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "short",
  timeStyle: "short",
});

export function complaintStatusTone(code: string): BadgeVariant {
  return STATUS_TONE[code] ?? "neutral";
}

export function formatComplaintWhen(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return WHEN_FORMAT.format(date);
}

export function formatComplaintAmount(amount: string | null, currency: string | null): string {
  if (!amount) return "—";
  return currency ? `${amount} ${currency}` : amount;
}
