import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  Lock,
  Plus,
  Unlock,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { CashSessionService } from "../../api/services/cashSessionService";
import {
  CASH_ACTOR_DEFAULT,
  CASH_PAYMENT_METHOD_OPTIONS,
} from "../../data/cashFixtures";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  CASH_MOVEMENT_KIND_LABELS,
  CASH_SESSION_STATUS_LABELS,
  type CashSessionResponse,
} from "../../types/cash/session";
import {
  CloseCashSessionDialog,
  OpenCashSessionDialog,
  RegisterCashMovementDialog,
} from "./CashSessionDialogs";

function formatInstant(iso: string): string {
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function moneyLabel(amount: string, currency: string): string {
  return `${currency} ${amount}`;
}

function TotalsStrip({ session }: { session: CashSessionResponse }) {
  const t = session.totals;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <li className="rounded-lg border border-border bg-card p-4 shadow-xl">
        <p className="text-sm text-muted-foreground">Fondo apertura</p>
        <p className="text-2xl font-bold text-right">
          {moneyLabel(t.openingFloat, t.currency)}
        </p>
      </li>
      <li className="rounded-lg border border-border bg-card p-4 shadow-xl">
        <p className="text-sm text-muted-foreground">Ingresos</p>
        <p className="text-2xl font-bold text-right text-success">
          {moneyLabel(t.totalIncome, t.currency)}
        </p>
      </li>
      <li className="rounded-lg border border-border bg-card p-4 shadow-xl">
        <p className="text-sm text-muted-foreground">Egresos</p>
        <p className="text-2xl font-bold text-right text-danger">
          {moneyLabel(t.totalExpense, t.currency)}
        </p>
      </li>
      <li className="rounded-lg border border-border bg-card p-4 shadow-xl">
        <p className="text-sm text-muted-foreground">Esperado (servicio)</p>
        <p className="text-2xl font-bold text-right">
          {moneyLabel(t.expectedCash, t.currency)}
        </p>
        {t.countedCash !== null && t.difference !== null ? (
          <p className="mt-1 text-xs text-muted-foreground text-right">
            Contado {moneyLabel(t.countedCash, t.currency)} · Diff{" "}
            {moneyLabel(t.difference, t.currency)}
          </p>
        ) : null}
      </li>
    </ul>
  );
}

export default function CashPage() {
  const queryClient = useQueryClient();
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [moveDialog, setMoveDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);

  const [registerId, setRegisterId] = useState("");
  const [openingFloat, setOpeningFloat] = useState("200.00");
  const [moveKind, setMoveKind] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [moveConcept, setMoveConcept] = useState("");
  const [moveAmount, setMoveAmount] = useState("");
  const [moveMethod, setMoveMethod] = useState<string>(
    CASH_PAYMENT_METHOD_OPTIONS[0],
  );
  const [moveRef, setMoveRef] = useState("");
  const [countedCash, setCountedCash] = useState("");

  const sessionsQuery = useQuery({
    queryKey: ["cash-sessions"],
    queryFn: () => CashSessionService.listSessions(),
  });

  const registersQuery = useQuery({
    queryKey: ["cash-registers"],
    queryFn: () => CashSessionService.listRegisters(),
  });

  const sessions = sessionsQuery.data ?? [];
  const activeSessionId = useMemo(() => {
    if (selectedSessionId && sessions.some((s) => s.id === selectedSessionId)) {
      return selectedSessionId;
    }
    const open = sessions.find((s) => s.status === "OPEN");
    return open?.id ?? sessions[0]?.id ?? null;
  }, [selectedSessionId, sessions]);

  const sessionQuery = useQuery({
    queryKey: ["cash-session", activeSessionId],
    queryFn: () => CashSessionService.getSession(activeSessionId!),
    enabled: activeSessionId !== null,
  });

  const movementsQuery = useQuery({
    queryKey: ["cash-movements", activeSessionId],
    queryFn: () => CashSessionService.listMovements(activeSessionId!),
    enabled: activeSessionId !== null,
  });

  const invalidateCash = async () => {
    await queryClient.invalidateQueries({ queryKey: ["cash-sessions"] });
    await queryClient.invalidateQueries({ queryKey: ["cash-session"] });
    await queryClient.invalidateQueries({ queryKey: ["cash-movements"] });
  };

  const openMutation = useMutation({
    mutationFn: () =>
      CashSessionService.openSession({
        registerId: Number(registerId),
        openingFloat,
        openedBy: CASH_ACTOR_DEFAULT,
      }),
    onSuccess: (session) => {
      toast.success(`Sesión abierta en ${session.registerCode}`);
      setOpenDialog(false);
      setSelectedSessionId(session.id);
      void invalidateCash();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "No se pudo abrir caja");
    },
  });

  const moveMutation = useMutation({
    mutationFn: () =>
      CashSessionService.registerMovement({
        sessionId: activeSessionId!,
        kind: moveKind,
        concept: moveConcept,
        paymentMethodName: moveMethod,
        amount: moveAmount,
        externalReference: moveRef || undefined,
      }),
    onSuccess: () => {
      toast.success("Movimiento registrado");
      setMoveDialog(false);
      setMoveConcept("");
      setMoveAmount("");
      setMoveRef("");
      void invalidateCash();
    },
    onError: (err: unknown) => {
      toast.error(
        err instanceof Error ? err.message : "No se pudo registrar el movimiento",
      );
    },
  });

  const closeMutation = useMutation({
    mutationFn: () =>
      CashSessionService.closeSession({
        sessionId: activeSessionId!,
        countedCash,
        closedBy: CASH_ACTOR_DEFAULT,
      }),
    onSuccess: (session) => {
      toast.success(
        `Caja cerrada. Diff ${moneyLabel(session.totals.difference ?? "0.00", session.totals.currency)}`,
      );
      setCloseDialog(false);
      void invalidateCash();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "No se pudo cerrar caja");
    },
  });

  const session = sessionQuery.data;
  const isOpen = session?.status === "OPEN";

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Wallet className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Caja</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Sesión, movimientos y arqueo. Totales solo desde el servicio
            {CashSessionService.isMockMode() ? " (demo local)" : ""}.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setOpenDialog(true)}
          >
            <Unlock className="h-5 w-5" />
            Abrir sesión
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            disabled={!isOpen}
            onClick={() => {
              setMoveConcept("");
              setMoveAmount("");
              setMoveDialog(true);
            }}
          >
            <Plus className="h-5 w-5" />
            Movimiento
          </Button>
          <Button
            className="gap-2 shadow-md"
            disabled={!isOpen}
            onClick={() => {
              setCountedCash(session?.totals.expectedCash ?? "");
              setCloseDialog(true);
            }}
          >
            <Lock className="h-5 w-5" />
            Cerrar / arqueo
          </Button>
        </div>
      </div>

      {sessionsQuery.isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-3">Cargando sesiones…</span>
        </div>
      ) : sessionsQuery.isError ? (
        <p className="text-center py-10 text-destructive">
          {sessionsQuery.error instanceof Error
            ? sessionsQuery.error.message
            : "Error al cargar sesiones"}
        </p>
      ) : (
        <>
          <section className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border p-4">
              <Wallet className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Sesiones</h2>
            </div>
            {sessions.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">
                No hay sesiones. Abre una caja para comenzar.
              </p>
            ) : (
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead>Id</TableHead>
                    <TableHead>Caja</TableHead>
                    <TableHead>Apertura</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Esperado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((row) => (
                    <TableRow
                      key={row.id}
                      className={`cursor-pointer transition-colors duration-150 ${
                        row.id === activeSessionId ? "bg-muted/60" : ""
                      }`}
                      onClick={() => setSelectedSessionId(row.id)}
                    >
                      <TableCell className="font-medium">#{row.id}</TableCell>
                      <TableCell>
                        {row.registerCode} · {row.registerName}
                      </TableCell>
                      <TableCell>{formatInstant(row.openedAt)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={row.status === "OPEN" ? "success" : "neutral"}
                        >
                          {CASH_SESSION_STATUS_LABELS[row.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {moneyLabel(
                          row.totals.expectedCash,
                          row.totals.currency,
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>

          {sessionQuery.isLoading || !session ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-3">Cargando detalle…</span>
            </div>
          ) : (
            <>
              <TotalsStrip session={session} />

              <section className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
                <div className="flex items-center gap-3 border-b border-border p-4">
                  <Wallet className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">
                    Movimientos · sesión #{session.id}
                  </h2>
                </div>
                {movementsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-3">Cargando movimientos…</span>
                  </div>
                ) : (movementsQuery.data ?? []).length === 0 ? (
                  <p className="text-center py-10 text-muted-foreground">
                    Sin movimientos en esta sesión.
                  </p>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted">
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(movementsQuery.data ?? []).map((mov) => {
                        const incomeLike =
                          mov.kind === "INCOME" || mov.kind === "OPENING";
                        return (
                          <TableRow
                            key={mov.id}
                            className="transition-colors duration-150"
                          >
                            <TableCell>{formatInstant(mov.occurredAt)}</TableCell>
                            <TableCell>
                              <Badge variant="info">
                                {CASH_MOVEMENT_KIND_LABELS[mov.kind]}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {mov.concept}
                              {mov.externalReference ? (
                                <span className="block text-xs text-muted-foreground">
                                  Ref. {mov.externalReference}
                                </span>
                              ) : null}
                            </TableCell>
                            <TableCell>{mov.paymentMethodName}</TableCell>
                            <TableCell className="text-right font-bold">
                              <span className="inline-flex items-center justify-end gap-1">
                                {incomeLike ? (
                                  <ArrowDownLeft className="h-4 w-4 text-success" />
                                ) : (
                                  <ArrowUpRight className="h-4 w-4 text-danger" />
                                )}
                                {moneyLabel(mov.amount, session.totals.currency)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  mov.status === "ANNULLED"
                                    ? "danger"
                                    : "success"
                                }
                              >
                                {mov.status === "ANNULLED" ? "Anulado" : "OK"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </section>
            </>
          )}
        </>
      )}

      <OpenCashSessionDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        registers={registersQuery.data ?? []}
        registerId={registerId}
        onRegisterIdChange={setRegisterId}
        openingFloat={openingFloat}
        onOpeningFloatChange={setOpeningFloat}
        pending={openMutation.isPending}
        onConfirm={() => openMutation.mutate()}
      />

      <RegisterCashMovementDialog
        open={moveDialog}
        onOpenChange={setMoveDialog}
        kind={moveKind}
        onKindChange={setMoveKind}
        concept={moveConcept}
        onConceptChange={setMoveConcept}
        method={moveMethod}
        onMethodChange={setMoveMethod}
        amount={moveAmount}
        onAmountChange={setMoveAmount}
        reference={moveRef}
        onReferenceChange={setMoveRef}
        pending={moveMutation.isPending}
        onConfirm={() => moveMutation.mutate()}
      />

      <CloseCashSessionDialog
        open={closeDialog}
        onOpenChange={setCloseDialog}
        session={session}
        countedCash={countedCash}
        onCountedCashChange={setCountedCash}
        pending={closeMutation.isPending}
        onConfirm={() => closeMutation.mutate()}
      />
    </div>
  );
}
