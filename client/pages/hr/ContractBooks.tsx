import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ContractService, readContractError } from "@/api/services/contractService";
import { CatalogSelect, Field, formatDate, formatMoney, optionLabel } from "@/pages/hr/contractUi";
import type { ContractDetail, HrCatalog } from "@/types/hr/contract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function useRefresh(contractId: number) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["hr-contract", contractId] });
    queryClient.invalidateQueries({ queryKey: ["hr-contracts"] });
  };
}

export function WageBook({ contractId, detail, catalog }: { contractId: number; detail: ContractDetail; catalog?: HrCatalog }) {
  const refresh = useRefresh(contractId);
  const [amount, setAmount] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const closed = detail.summary.status === "CANCELLED" || detail.summary.status === "COMPLETED";

  const propose = useMutation({
    mutationFn: () => ContractService.proposeWage(contractId, Number(amount), validFrom),
    onSuccess: () => {
      toast.success("Sueldo propuesto.");
      setAmount("");
      refresh();
    },
    onError: (error: unknown) => toast.error(readContractError(error, "No se pudo proponer el sueldo.")),
  });
  const approve = useMutation({
    mutationFn: (wageId: number) => ContractService.approveWage(contractId, wageId),
    onSuccess: () => {
      toast.success("Sueldo aprobado. El anterior queda reemplazado.");
      refresh();
    },
    onError: (error: unknown) => toast.error(readContractError(error, "No se pudo aprobar el sueldo.")),
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Remuneración vigente: {formatMoney(detail.wage)}</p>
      <BookTable
        empty="El contrato aún no tiene sueldos."
        headers={["Sueldo", "Válido desde", "Estado", "Aprobado por", ""]}
        rows={detail.wages.map((wage) => [
          formatMoney(wage.amount),
          formatDate(wage.validFrom),
          optionLabel(catalog?.wageStatuses, wage.status),
          wage.approvedBy || "—",
          wage.status === "PROPOSED" ? (
            <Button key={wage.id} size="sm" variant="outline" onClick={() => approve.mutate(wage.id)} disabled={approve.isPending}>
              Aprobar
            </Button>
          ) : (
            "—"
          ),
        ])}
      />
      <InlineForm
        disabled={closed || propose.isPending || !amount || !validFrom}
        pending={propose.isPending}
        onSubmit={() => propose.mutate()}
      >
        <Field label="Sueldo">
          <Input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </Field>
        <Field label="Válido desde">
          <Input type="date" value={validFrom} onChange={(event) => setValidFrom(event.target.value)} />
        </Field>
      </InlineForm>
    </div>
  );
}

export function RoleBook({ contractId, detail }: { contractId: number; detail: ContractDetail }) {
  const refresh = useRefresh(contractId);
  const [title, setTitle] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const closed = detail.summary.status === "CANCELLED" || detail.summary.status === "COMPLETED";
  const add = useMutation({
    mutationFn: () => ContractService.addRole(contractId, title, startsOn),
    onSuccess: () => {
      toast.success("Cargo registrado.");
      setTitle("");
      refresh();
    },
    onError: (error: unknown) => toast.error(readContractError(error, "No se pudo registrar el cargo.")),
  });
  return (
    <div className="space-y-4">
      <BookTable
        empty="El contrato aún no tiene cargo."
        headers={["Cargo", "Desde", "Hasta"]}
        rows={detail.roles.map((role) => [role.title, formatDate(role.startsOn), formatDate(role.endsOn)])}
      />
      <InlineForm disabled={closed || add.isPending || !title || !startsOn} pending={add.isPending} onSubmit={() => add.mutate()} label="Agregar cargo">
        <Field label="Cargo">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <Field label="Desde">
          <Input type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} />
        </Field>
      </InlineForm>
    </div>
  );
}

export function ShiftBook({ contractId, detail }: { contractId: number; detail: ContractDetail }) {
  const refresh = useRefresh(contractId);
  const [name, setName] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const closed = detail.summary.status === "CANCELLED" || detail.summary.status === "COMPLETED";
  const add = useMutation({
    mutationFn: () => ContractService.addShift(contractId, name, startsOn),
    onSuccess: () => {
      toast.success("Horario registrado.");
      setName("");
      refresh();
    },
    onError: (error: unknown) => toast.error(readContractError(error, "No se pudo registrar el horario.")),
  });
  return (
    <div className="space-y-4">
      <BookTable
        empty="El contrato aún no tiene horario. Agrega el horario de trabajo."
        headers={["Horario", "Desde"]}
        rows={detail.shifts.map((shift) => [shift.name, formatDate(shift.startsOn)])}
      />
      <InlineForm disabled={closed || add.isPending || !name || !startsOn} pending={add.isPending} onSubmit={() => add.mutate()} label="Agregar horario">
        <Field label="Horario">
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Desde">
          <Input type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} />
        </Field>
      </InlineForm>
    </div>
  );
}

export function AffiliationBook({
  contractId,
  detail,
  catalog,
}: {
  contractId: number;
  detail: ContractDetail;
  catalog?: HrCatalog;
}) {
  const refresh = useRefresh(contractId);
  const [name, setName] = useState("");
  const [amountKind, setAmountKind] = useState("");
  const [amount, setAmount] = useState("");
  const closed = detail.summary.status === "CANCELLED" || detail.summary.status === "COMPLETED";
  const add = useMutation({
    mutationFn: () =>
      ContractService.addAffiliation(contractId, name, amountKind, amount === "" ? null : Number(amount)),
    onSuccess: () => {
      toast.success("Afiliación registrada.");
      setName("");
      setAmount("");
      refresh();
    },
    onError: (error: unknown) => toast.error(readContractError(error, "No se pudo registrar la afiliación.")),
  });
  const deactivate = useMutation({
    mutationFn: (affiliationId: number) => ContractService.deactivateAffiliation(contractId, affiliationId),
    onSuccess: () => {
      toast.success("Afiliación desactivada.");
      refresh();
    },
    onError: (error: unknown) => toast.error(readContractError(error, "No se pudo desactivar la afiliación.")),
  });
  return (
    <div className="space-y-4">
      <BookTable
        empty="El contrato no tiene afiliaciones."
        headers={["Afiliación", "Tipo", "Importe", "Activo", ""]}
        rows={detail.affiliations.map((item) => [
          item.name,
          optionLabel(catalog?.affiliationKinds, item.amountKind),
          formatMoney(item.amount),
          item.active ? "Sí" : "No",
          item.active ? (
            <Button key={item.id} size="sm" variant="outline" onClick={() => deactivate.mutate(item.id)}>
              Desactivar
            </Button>
          ) : (
            "—"
          ),
        ])}
      />
      <InlineForm disabled={closed || add.isPending || !name || !amountKind} pending={add.isPending} onSubmit={() => add.mutate()}>
        <Field label="Afiliación">
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Tipo">
          <CatalogSelect
            value={amountKind}
            onChange={setAmountKind}
            options={catalog?.affiliationKinds}
            placeholder="Tipo"
            ariaLabel="Tipo de afiliación"
          />
        </Field>
        <Field label="Importe">
          <Input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </Field>
      </InlineForm>
    </div>
  );
}

export function RenewalBook({ contractId, detail }: { contractId: number; detail: ContractDetail }) {
  const refresh = useRefresh(contractId);
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [notes, setNotes] = useState("");
  const closed = detail.summary.status === "CANCELLED" || detail.summary.status === "COMPLETED";
  const add = useMutation({
    mutationFn: () => ContractService.renew(contractId, startsOn, endsOn, notes),
    onSuccess: () => {
      toast.success("Renovación registrada.");
      setNotes("");
      refresh();
    },
    onError: (error: unknown) => toast.error(readContractError(error, "No se pudo renovar el contrato.")),
  });
  return (
    <div className="space-y-4">
      <BookTable
        empty="El contrato no tiene renovaciones."
        headers={["Renovación", "Vencimiento", "Observación"]}
        rows={detail.renewals.map((item) => [formatDate(item.startsOn), formatDate(item.endsOn), item.notes || "—"])}
      />
      <InlineForm disabled={closed || add.isPending || !startsOn || !endsOn} pending={add.isPending} onSubmit={() => add.mutate()} label="Agregar renovación">
        <Field label="Renovación">
          <Input type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} />
        </Field>
        <Field label="Vencimiento">
          <Input type="date" value={endsOn} onChange={(event) => setEndsOn(event.target.value)} />
        </Field>
        <Field label="Observación">
          <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
      </InlineForm>
    </div>
  );
}

export function AnnexBook({ contractId, detail }: { contractId: number; detail: ContractDetail }) {
  const refresh = useRefresh(contractId);
  const [fileName, setFileName] = useState("");
  const [comment, setComment] = useState("");
  const add = useMutation({
    mutationFn: () => ContractService.addAnnex(contractId, fileName, comment),
    onSuccess: () => {
      toast.success("Anexo registrado.");
      setFileName("");
      setComment("");
      refresh();
    },
    onError: (error: unknown) => toast.error(readContractError(error, "No se pudo registrar el anexo.")),
  });
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Se guarda el nombre y el comentario. El archivo no se almacena.</p>
      <BookTable
        empty="El contrato no tiene anexos."
        headers={["Archivo", "Comentario", "Usuario", "Fecha"]}
        rows={detail.annexes.map((item) => [item.fileName, item.comment || "—", item.recordedBy, formatDate(item.recordedAt)])}
      />
      <InlineForm disabled={add.isPending || !fileName} pending={add.isPending} onSubmit={() => add.mutate()} label="Registrar anexo">
        <Field label="Nombre del archivo">
          <Input value={fileName} onChange={(event) => setFileName(event.target.value)} />
        </Field>
        <Field label="Comentario">
          <Textarea value={comment} onChange={(event) => setComment(event.target.value)} />
        </Field>
      </InlineForm>
    </div>
  );
}

export function StatementBook({ contractId }: { contractId: number }) {
  const [kind, setKind] = useState<"work" | "cts" | null>(null);
  const statement = useQuery({
    queryKey: ["hr-statement", contractId, kind],
    queryFn: () => ContractService.statement(contractId, kind as "work" | "cts"),
    enabled: kind != null,
  });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button variant={kind === "work" ? "default" : "outline"} onClick={() => setKind("work")}>
          Constancia de trabajo
        </Button>
        <Button variant={kind === "cts" ? "default" : "outline"} onClick={() => setKind("cts")}>
          Certificado para retiro de CTS
        </Button>
      </div>
      {statement.isFetching ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : statement.data ? (
        <article className="whitespace-pre-wrap rounded-lg border border-border bg-card p-6 text-sm leading-6">
          {statement.data.text}
        </article>
      ) : (
        <p className="text-sm text-muted-foreground">Elige una constancia para ver el texto.</p>
      )}
    </div>
  );
}

function BookTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: Array<Array<string | number | ReactNode>>;
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map((header) => (
            <TableHead key={header}>{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((cells, index) => (
          <TableRow key={index}>
            {cells.map((cell, cellIndex) => (
              <TableCell key={cellIndex} className={cellIndex === 0 ? "font-medium" : undefined}>
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function InlineForm({
  children,
  onSubmit,
  disabled,
  pending,
  label = "Grabar",
}: {
  children: ReactNode;
  onSubmit: () => void;
  disabled: boolean;
  pending: boolean;
  label?: string;
}) {
  return (
    <form
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 xl:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {children}
      <Button type="submit" disabled={disabled}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {label}
      </Button>
    </form>
  );
}
