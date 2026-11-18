import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Truck } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  dispatchErrorMessage,
  dispatchService,
  isIgnoredLocationError,
  type InboxView,
  type RouteView,
} from "../../api/services/dispatchService";
import {
  formatWhen,
  routeStatusLabel,
  routeStatusVariant,
  scopeLabel,
} from "./dispatchFormat";
import { useForegroundTracking } from "./useForegroundTracking";

export default function CarrierInboxPage() {
  const [inbox, setInbox] = useState<InboxView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) {
      setLoading(true);
      setError(null);
    }
    try {
      setInbox(await dispatchService.inbox());
    } catch (cause) {
      if (!quiet) {
        setInbox(null);
        setError(dispatchErrorMessage(cause, "No se pudo abrir la bandeja."));
      }
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeIds = (inbox?.routes ?? [])
    .filter((route) => route.status === "EN_CAMINO")
    .map((route) => route.id);

  const trackingHint = useForegroundTracking(activeIds.length > 0, (latitude, longitude) => {
    void Promise.all(
      activeIds.map(async (routeId) => {
        try {
          await dispatchService.recordLocation(routeId, latitude, longitude);
        } catch (cause) {
          if (!isIgnoredLocationError(cause)) {
            setError(dispatchErrorMessage(cause, "No se pudo registrar la ubicación."));
          }
        }
      }),
    ).then(() => load(true));
  });

  const act = async (route: RouteView, action: "start" | "deliver") => {
    setBusyId(route.id);
    setError(null);
    try {
      if (action === "start") await dispatchService.start(route.id);
      else await dispatchService.deliver(route.id);
      await load();
    } catch (cause) {
      setError(dispatchErrorMessage(cause, "No se pudo actualizar el recorrido."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Bandeja del transportista</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {inbox
              ? `${inbox.carrierName} · ${inbox.carrierCode}`
              : "Entregas asignadas a tu ficha."}
          </p>
        </div>
        <div className="flex gap-4">
          <Link to="/dispatch/nearby" className="text-sm font-medium text-primary">
            Cercanía
          </Link>
          <Link to="/dispatch/carriers" className="text-sm font-medium text-primary">
            Fichas
          </Link>
        </div>
      </div>

      {trackingHint ? <p className="text-sm text-muted-foreground">{trackingHint}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <section className="rounded-lg bg-card shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-3">Cargando entregas...</span>
          </div>
        ) : !inbox || inbox.routes.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">
            {inbox ? "No tienes entregas asignadas." : "No hay bandeja para esta sesión."}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {inbox.routes.map((route) => (
              <li key={route.id} className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium">{route.summary}</p>
                  <Badge variant={routeStatusVariant(route.status)}>{routeStatusLabel(route.status)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {scopeLabel(route.scope)}
                  {route.orderKind === "SALE_ORDER" || route.orderKind === "CUSTOMER_ORDER"
                    ? ` · Pedido ${route.orderId}`
                    : ""}
                </p>
                <p className="text-sm">
                  {route.destinationLabel || "Sin dirección"}
                  {route.latitude != null && route.longitude != null
                    ? ` · ${route.latitude}, ${route.longitude}`
                    : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Asignado {formatWhen(route.assignedAt)}
                  {route.lastFixAt ? ` · Último punto ${formatWhen(route.lastFixAt)}` : ""}
                </p>
                <div className="flex gap-3">
                  {route.status === "ASIGNADO" ? (
                    <Button type="button" disabled={busyId === route.id} onClick={() => void act(route, "start")}>
                      {busyId === route.id ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                      Iniciar recorrido
                    </Button>
                  ) : null}
                  {route.status === "EN_CAMINO" ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busyId === route.id}
                      onClick={() => void act(route, "deliver")}
                    >
                      Marcar entregado
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
