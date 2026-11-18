import type { RouteStatus } from "../../api/services/dispatchService";

export function routeStatusLabel(status: RouteStatus): string {
  if (status === "EN_CAMINO") return "En camino";
  if (status === "ENTREGADO") return "Entregado";
  return "Asignado";
}

export function routeStatusVariant(status: RouteStatus): "info" | "success" | "neutral" {
  if (status === "EN_CAMINO") return "info";
  if (status === "ENTREGADO") return "success";
  return "neutral";
}

export function scopeLabel(scope: "TOTAL" | "PARCIAL"): string {
  return scope === "PARCIAL" ? "Entrega parcial" : "Entrega total";
}

export function formatWhen(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export function formatDuration(seconds: number): string {
  if (seconds % 60 === 0) {
    return `${seconds / 60} min`;
  }
  return `${seconds} s`;
}

export function formatMeters(meters: number): string {
  return `${new Intl.NumberFormat("es-PE").format(meters)} m`;
}
