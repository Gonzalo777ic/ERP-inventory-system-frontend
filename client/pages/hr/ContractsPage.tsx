import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileSignature, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { ContractService, readContractError } from "@/api/services/contractService";
import { EmployeeService } from "@/api/services/employeeService";
import { LegalEntityService } from "@/api/services/legalEntityService";
import { CatalogSelect, ContractStatusBadge, Field, formatDate, optionLabel } from "@/pages/hr/contractUi";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Filters {
  document: string;
  name: string;
  activeOnly: boolean;
}

const EMPTY_FILTERS: Filters = { document: "", name: "", activeOnly: false };

export default function ContractsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [legalEntityId, setLegalEntityId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [creating, setCreating] = useState(false);

  const entitiesQuery = useQuery({
    queryKey: ["legal-entities"],
    queryFn: LegalEntityService.getAll,
  });
  const catalogQuery = useQuery({
    queryKey: ["hr-catalog"],
    queryFn: ContractService.catalog,
  });

  const entities = entitiesQuery.data ?? [];
  const activeEntityId = legalEntityId ?? entities[0]?.id ?? null;
  const catalog = catalogQuery.data;

  const rosterQuery = useQuery({
    queryKey: ["hr-contracts", activeEntityId, applied],
    queryFn: () =>
      ContractService.roster({
        legalEntityId: activeEntityId as number,
        document: applied.document || undefined,
        name: applied.name || undefined,
        activeOnly: applied.activeOnly,
      }),
    enabled: activeEntityId != null,
  });

  const rows = rosterQuery.data ?? [];

  const read = () => {
    setApplied({ ...draft });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <FileSignature className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Contratos</h1>
        </div>
        <Button onClick={() => setCreating(true)} disabled={activeEntityId == null}>
          <Plus className="h-5 w-5" />
          Nuevo contrato
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 xl:items-end">
          <Field label="Entidad legal">
            <Select
              value={activeEntityId == null ? undefined : String(activeEntityId)}
              onValueChange={(value) => setLegalEntityId(Number(value))}
              disabled={entities.length === 0}
            >
              <SelectTrigger aria-label="Entidad legal">
                <SelectValue placeholder="Entidad legal" />
              </SelectTrigger>
              <SelectContent>
                {entities.map((entity) => (
                  <SelectItem key={entity.id} value={String(entity.id)}>
                    {entity.legalName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Documento">
            <Input
              value={draft.document}
              onChange={(event) => setDraft((current) => ({ ...current, document: event.target.value }))}
              aria-label="Documento"
            />
          </Field>
          <Field label="Nombre">
            <Input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              aria-label="Nombre"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox
              checked={draft.activeOnly}
              onCheckedChange={(checked) => setDraft((current) => ({ ...current, activeOnly: checked === true }))}
              aria-label="Solo activos"
            />
            Solo activos
          </label>
          <Button variant="outline" onClick={read}>
            <Search className="h-4 w-4" />
            Leer
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        {rosterQuery.isLoading ? (
          <div className="flex justify-center p-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="p-10 text-center text-muted-foreground">No hay contratos para esta búsqueda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Cese</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/hr/contracts/${row.id}`)}
                >
                  <TableCell className="font-medium">{row.documentNumber}</TableCell>
                  <TableCell>{row.displayName}</TableCell>
                  <TableCell>{optionLabel(catalog?.contractTypes, row.contractType)}</TableCell>
                  <TableCell>{row.payrollGroup || "—"}</TableCell>
                  <TableCell>{formatDate(row.startsOn)}</TableCell>
                  <TableCell>{formatDate(row.endsOn)}</TableCell>
                  <TableCell>{formatDate(row.cessationOn)}</TableCell>
                  <TableCell>
                    <ContractStatusBadge status={row.status} catalog={catalog?.contractStatuses} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>Nuevo contrato</DialogTitle>
          </DialogHeader>
          {activeEntityId != null && (
            <CreateContractForm
              legalEntityId={activeEntityId}
              onClose={() => setCreating(false)}
              onCreated={() => {
                queryClient.invalidateQueries({ queryKey: ["hr-contracts", activeEntityId] });
                setCreating(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateContractForm({
  legalEntityId,
  onClose,
  onCreated,
}: {
  legalEntityId: number;
  onClose: () => void;
  onCreated: () => void;
}) {
  const catalogQuery = useQuery({ queryKey: ["hr-catalog"], queryFn: ContractService.catalog });
  const employeesQuery = useQuery({
    queryKey: ["hr-employees", legalEntityId],
    queryFn: () => EmployeeService.list(legalEntityId),
  });
  const [employeeId, setEmployeeId] = useState("");
  const [contractType, setContractType] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [wage, setWage] = useState("");

  const create = useMutation({
    mutationFn: () =>
      ContractService.create({
        employeeId: Number(employeeId),
        contractType: contractType || undefined,
        startsOn,
        endsOn: endsOn || null,
        wage: { amount: Number(wage) },
      }),
    onSuccess: () => {
      toast.success("Contrato en borrador.");
      onCreated();
    },
    onError: (error: unknown) => toast.error(readContractError(error, "No se pudo crear el contrato.")),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        create.mutate();
      }}
    >
      <Field label="Trabajador">
        <Select value={employeeId || undefined} onValueChange={setEmployeeId}>
          <SelectTrigger aria-label="Trabajador">
            <SelectValue placeholder="Trabajador" />
          </SelectTrigger>
          <SelectContent>
            {(employeesQuery.data ?? []).map((employee) => (
              <SelectItem key={employee.id} value={String(employee.id)}>
                {employee.displayName} · {employee.documentNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Tipo de contrato">
        <CatalogSelect
          value={contractType}
          onChange={setContractType}
          options={catalogQuery.data?.contractTypes}
          placeholder="Tipo de contrato"
          ariaLabel="Tipo de contrato"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Inicio">
          <Input type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} required />
        </Field>
        <Field label="Vencimiento">
          <Input type="date" value={endsOn} onChange={(event) => setEndsOn(event.target.value)} />
        </Field>
      </div>
      <Field label="Remuneración">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={wage}
          onChange={(event) => setWage(event.target.value)}
          required
        />
      </Field>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={create.isPending || !employeeId || !startsOn || !wage}>
          {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Grabar
        </Button>
      </div>
    </form>
  );
}
