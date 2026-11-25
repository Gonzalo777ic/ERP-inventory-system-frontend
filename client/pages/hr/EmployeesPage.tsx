import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, IdCard, Loader2, Pencil, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { EmployeeService, readEmployeeError } from "@/api/services/employeeService";
import { LegalEntityService } from "@/api/services/legalEntityService";
import EmployeeForm from "@/pages/hr/EmployeeForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  IDENTITY_DOCUMENT_LABELS,
  PHONE_USE_LABELS,
  SEX_LABELS,
  type EmployeeResponse,
} from "@/types/hr/employee";

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [legalEntityId, setLegalEntityId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selected, setSelected] = useState<EmployeeResponse | null>(null);
  const [toRetire, setToRetire] = useState<EmployeeResponse | null>(null);

  const entitiesQuery = useQuery({
    queryKey: ["legal-entities"],
    queryFn: LegalEntityService.getAll,
  });

  const entities = entitiesQuery.data ?? [];
  const activeEntityId = legalEntityId ?? entities[0]?.id ?? null;
  const activeEntity = entities.find((entity) => entity.id === activeEntityId) ?? null;

  const employeesQuery = useQuery({
    queryKey: ["hr-employees", activeEntityId],
    queryFn: () => EmployeeService.list(activeEntityId as number),
    enabled: activeEntityId != null,
  });

  const employees = employeesQuery.data ?? [];

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter((employee) => {
      const phones = employee.phones.map((phone) => phone.number).join(" ");
      const haystack = [
        employee.documentNumber,
        employee.displayName,
        employee.personalEmail,
        employee.workEmail,
        employee.cuspp,
        phones,
        employee.address?.line,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [employees, searchTerm]);

  const retire = useMutation({
    mutationFn: (id: number) => EmployeeService.retire(id),
    onSuccess: () => {
      toast.success("Empleado dado de baja. El histórico se conserva.");
      queryClient.invalidateQueries({ queryKey: ["hr-employees", activeEntityId] });
      setToRetire(null);
    },
    onError: (error: unknown) => {
      toast.error(readEmployeeError(error, "No se pudo dar de baja."));
    },
  });

  const openCreate = () => {
    setSelected(null);
    setIsFormOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <IdCard className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Empleados</h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Select
            value={activeEntityId == null ? undefined : String(activeEntityId)}
            onValueChange={(value) => setLegalEntityId(Number(value))}
            disabled={entities.length === 0}
          >
            <SelectTrigger className="w-full sm:w-64" aria-label="Entidad legal">
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
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar documento, nombre…"
              className="pl-9"
              aria-label="Buscar empleados"
            />
          </div>
          <Button onClick={openCreate} className="shadow-md gap-2" disabled={activeEntityId == null}>
            <Plus className="h-5 w-5" />
            Nuevo empleado
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xl">
        {entitiesQuery.isLoading || employeesQuery.isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-3">Cargando empleados…</span>
          </div>
        ) : entitiesQuery.isError || employeesQuery.isError ? (
          <p className="py-10 text-center text-destructive">
            {readEmployeeError(
              entitiesQuery.error ?? employeesQuery.error,
              "No se pudo cargar la lista."
            )}
          </p>
        ) : entities.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">
            No hay entidades legales vigentes. Registra la empresa antes de dar de alta trabajadores.
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">
            {employees.length === 0
              ? "Aún no hay empleados vigentes en esta entidad legal."
              : "Ningún empleado coincide con la búsqueda."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead>Documento</TableHead>
                <TableHead>Trabajador</TableHead>
                <TableHead>Edad</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead className="w-[100px] text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((employee) => (
                <TableRow key={employee.id} className="transition-colors duration-150">
                  <TableCell>
                    <p className="text-xs text-muted-foreground">
                      {IDENTITY_DOCUMENT_LABELS[employee.documentType]}
                    </p>
                    <p className="font-medium">{employee.documentNumber}</p>
                  </TableCell>
                  <TableCell>
                    <p>{employee.surnames}</p>
                    <p className="text-sm text-muted-foreground">{employee.givenNames}</p>
                    <p className="text-xs text-muted-foreground">
                      {SEX_LABELS[employee.sex]} · {employee.childrenCount} hijos
                    </p>
                  </TableCell>
                  <TableCell>{employee.ageYears} años</TableCell>
                  <TableCell>
                    <p className="text-sm">{employee.workEmail ?? employee.personalEmail ?? "—"}</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.phones.length === 0
                        ? "Sin teléfono"
                        : employee.phones
                            .map((phone) => `${PHONE_USE_LABELS[phone.use]} ${phone.number}`)
                            .join(" · ")}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Editar"
                        onClick={() => {
                          setSelected(employee);
                          setIsFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Dar de baja"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setToRetire(employee)}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => !open && setIsFormOpen(false)}>
        <DialogContent className="rounded-xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected ? "Editar empleado" : "Nuevo empleado"}</DialogTitle>
          </DialogHeader>
          {activeEntity && (
            <EmployeeForm
              key={selected?.id ?? "new"}
              legalEntityId={activeEntity.id}
              legalEntityName={activeEntity.legalName}
              initialData={selected}
              onSuccess={() => setIsFormOpen(false)}
              onClose={() => setIsFormOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {toRetire && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-xl font-bold text-destructive">Dar de baja</h3>
              <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={() => setToRetire(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-sm">
              ¿Confirmas la baja de <span className="font-medium">{toRetire.displayName}</span>? Deja de
              aparecer en el listado vigente y el histórico se conserva. El número de documento podrá
              reutilizarse.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setToRetire(null)} disabled={retire.isPending}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={() => retire.mutate(toRetire.id)} disabled={retire.isPending}>
                {retire.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
                Dar de baja
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
