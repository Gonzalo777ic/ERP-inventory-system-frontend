import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, UserRound } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import {
  dispatchErrorMessage,
  dispatchService,
  type CarrierView,
} from "../../api/services/dispatchService";
import { formatWhen } from "./dispatchFormat";

export default function CarriersPage() {
  const [rows, setRows] = useState<CarrierView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [identitySubject, setIdentitySubject] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await dispatchService.carriers());
    } catch (cause) {
      setError(dispatchErrorMessage(cause, "No se pudieron cargar las fichas."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const register = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await dispatchService.registerCarrier({
        code,
        displayName,
        identitySubject,
        phone: phone.trim() === "" ? undefined : phone,
      });
      setCode("");
      setDisplayName("");
      setIdentitySubject("");
      setPhone("");
      await load();
    } catch (cause) {
      setError(dispatchErrorMessage(cause, "No se pudo registrar la ficha."));
    } finally {
      setSaving(false);
    }
  };

  const retire = async (id: number) => {
    setError(null);
    try {
      await dispatchService.retireCarrier(id);
      await load();
    } catch (cause) {
      setError(dispatchErrorMessage(cause, "No se pudo dar de baja la ficha."));
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <UserRound className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Transportistas</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          La credencial sigue en Identidad. Esta ficha solo guarda el identificador de esa sesión.
        </p>
        <Link to="/dispatch/inbox" className="text-sm font-medium text-primary">
          Volver a la bandeja
        </Link>
      </div>

      <form onSubmit={(event) => void register(event)} className="grid gap-4 rounded-lg bg-card p-4 shadow-xl md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium">Código</span>
          <Input value={code} onChange={(event) => setCode(event.target.value)} required />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Nombre</span>
          <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium">Id de identidad</span>
          <Input
            value={identitySubject}
            onChange={(event) => setIdentitySubject(event.target.value)}
            placeholder="subject de la sesión ya registrada"
            required
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Teléfono</span>
          <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
        </label>
        <div className="flex items-end">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            Registrar
          </Button>
        </div>
      </form>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <section className="rounded-lg bg-card shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-3">Cargando fichas...</span>
          </div>
        ) : rows.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">No hay transportistas vigentes.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Último punto</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((carrier) => (
                <TableRow key={carrier.id} className="transition-colors duration-150">
                  <TableCell className="font-medium">{carrier.code}</TableCell>
                  <TableCell>{carrier.displayName}</TableCell>
                  <TableCell>{formatWhen(carrier.lastFixAt)}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive">
                          Dar de baja
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Dar de baja</AlertDialogTitle>
                          <AlertDialogDescription>
                            La ficha deja de estar vigente. Los recorridos y las ubicaciones se conservan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => void retire(carrier.id)}>
                            Dar de baja
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
