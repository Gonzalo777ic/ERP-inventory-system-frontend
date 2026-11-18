import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import {
  dispatchErrorMessage,
  dispatchService,
  type NearbyResponse,
  type OrderRefKind,
  type TrackingPolicy,
} from "../../api/services/dispatchService";
import { formatDuration, formatMeters, formatWhen } from "./dispatchFormat";

export default function NearbyCarriersPage() {
  const [policy, setPolicy] = useState<TrackingPolicy | null>(null);
  const [orderKind, setOrderKind] = useState<OrderRefKind>("CUSTOMER_ORDER");
  const [orderId, setOrderId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [result, setResult] = useState<NearbyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void dispatchService.policy().then(setPolicy).catch(() => setPolicy(null));
  }, []);

  const parsedOrderId = orderId.trim() === "" ? undefined : Number(orderId);
  const parsedLatitude = latitude.trim() === "" ? undefined : Number(latitude);
  const parsedLongitude = longitude.trim() === "" ? undefined : Number(longitude);

  const search = async (event?: FormEvent) => {
    event?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await dispatchService.nearby({
        orderId: parsedOrderId,
        orderKind: parsedOrderId == null ? undefined : orderKind,
        latitude: parsedLatitude,
        longitude: parsedLongitude,
      });
      setResult(response);
    } catch (cause) {
      setResult(null);
      setError(dispatchErrorMessage(cause, "No se pudo ordenar a los transportistas."));
    } finally {
      setLoading(false);
    }
  };

  const savePoint = async () => {
    if (parsedOrderId == null || parsedLatitude == null || parsedLongitude == null) {
      setError("Para guardar el punto hacen falta el pedido y las coordenadas.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await dispatchService.saveDeparture(parsedOrderId, {
        orderKind,
        latitude: parsedLatitude,
        longitude: parsedLongitude,
      });
      await search();
    } catch (cause) {
      setError(dispatchErrorMessage(cause, "No se pudo guardar el punto del pedido."));
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <MapPin className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Transportistas cercanos</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          El servidor ordena por distancia
          {policy ? ` y usa ubicaciones de los últimos ${formatDuration(policy.freshnessSeconds)}.` : "."}
        </p>
        <Link to="/dispatch/inbox" className="text-sm font-medium text-primary">
          Volver a la bandeja
        </Link>
      </div>

      <form onSubmit={(event) => void search(event)} className="space-y-4 rounded-lg bg-card p-4 shadow-xl">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Pedido</span>
            <select
              value={orderKind}
              onChange={(event) => setOrderKind(event.target.value as OrderRefKind)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="CUSTOMER_ORDER">Pedido de tienda</option>
              <option value="SALE_ORDER">Pedido de venta</option>
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Número</span>
            <Input value={orderId} onChange={(event) => setOrderId(event.target.value)} inputMode="numeric" />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Latitud</span>
            <Input value={latitude} onChange={(event) => setLatitude(event.target.value)} inputMode="decimal" />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Longitud</span>
            <Input value={longitude} onChange={(event) => setLongitude(event.target.value)} inputMode="decimal" />
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
            Buscar cercanos
          </Button>
          <Button type="button" variant="outline" disabled={loading} onClick={() => void savePoint()}>
            Guardar punto del pedido
          </Button>
        </div>
      </form>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <section className="rounded-lg bg-card shadow-xl overflow-hidden">
        {result ? (
          <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
            Origen {result.origin.latitude}, {result.origin.longitude}
            {result.origin.label ? ` · ${result.origin.label}` : ""}
          </p>
        ) : null}
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-3">Calculando cercanía...</span>
          </div>
        ) : !result || result.carriers.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">
            No hay transportistas con ubicación reciente.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transportista</TableHead>
                <TableHead>Último punto</TableHead>
                <TableHead className="text-right">Distancia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.carriers.map((carrier) => (
                <TableRow key={carrier.carrierId} className="transition-colors duration-150">
                  <TableCell className="font-medium">
                    {carrier.displayName}
                    <span className="ml-2 text-muted-foreground">{carrier.code}</span>
                  </TableCell>
                  <TableCell>{formatWhen(carrier.lastFixAt)}</TableCell>
                  <TableCell className="text-right font-bold">{formatMeters(carrier.distanceMeters)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
