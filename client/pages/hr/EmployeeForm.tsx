import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { EmployeeService, readEmployeeError } from "@/api/services/employeeService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IDENTITY_DOCUMENT_LABELS,
  IDENTITY_DOCUMENT_TYPES,
  PHONE_USE_LABELS,
  PHONE_USES,
  SEX_LABELS,
  SEXES,
  type EmployeePhone,
  type EmployeeResponse,
  type IdentityDocumentType,
  type PhoneUse,
  type Sex,
} from "@/types/hr/employee";

interface EmployeeFormProps {
  legalEntityId: number;
  legalEntityName: string;
  initialData?: EmployeeResponse | null;
  onSuccess: () => void;
  onClose: () => void;
}

interface Draft {
  documentType: IdentityDocumentType;
  documentNumber: string;
  surnames: string;
  givenNames: string;
  personalEmail: string;
  workEmail: string;
  cuspp: string;
  phones: EmployeePhone[];
  birthDate: string;
  childrenCount: string;
  sex: Sex;
  line: string;
  district: string;
  city: string;
}

function draftFrom(employee: EmployeeResponse | null | undefined): Draft {
  return {
    documentType: employee?.documentType ?? "DNI",
    documentNumber: employee?.documentNumber ?? "",
    surnames: employee?.surnames ?? "",
    givenNames: employee?.givenNames ?? "",
    personalEmail: employee?.personalEmail ?? "",
    workEmail: employee?.workEmail ?? "",
    cuspp: employee?.cuspp ?? "",
    phones: employee?.phones?.map((phone) => ({ ...phone })) ?? [],
    birthDate: employee?.birthDate ?? "",
    childrenCount: String(employee?.childrenCount ?? 0),
    sex: employee?.sex ?? "FEMALE",
    line: employee?.address?.line ?? "",
    district: employee?.address?.district ?? "",
    city: employee?.address?.city ?? "",
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function EmployeeForm({
  legalEntityId,
  legalEntityName,
  initialData,
  onSuccess,
  onClose,
}: EmployeeFormProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(() => draftFrom(initialData));

  const save = useMutation({
    mutationFn: async () => {
      const childrenCount = Number(draft.childrenCount);
      if (!Number.isInteger(childrenCount) || childrenCount < 0) {
        throw new Error("La cantidad de hijos no es válida");
      }
      const phones = draft.phones.filter((phone) => phone.number.trim() !== "");
      return initialData
        ? EmployeeService.update(initialData.id, {
            legalEntityId,
            documentType: draft.documentType,
            documentNumber: draft.documentNumber.trim(),
            surnames: draft.surnames.trim(),
            givenNames: draft.givenNames.trim(),
            personalEmail: emptyToNull(draft.personalEmail),
            workEmail: emptyToNull(draft.workEmail),
            cuspp: emptyToNull(draft.cuspp),
            phones,
            birthDate: draft.birthDate,
            childrenCount,
            sex: draft.sex,
            address: addressOf(draft),
          })
        : EmployeeService.create({
            legalEntityId,
            documentType: draft.documentType,
            documentNumber: draft.documentNumber.trim(),
            surnames: draft.surnames.trim(),
            givenNames: draft.givenNames.trim(),
            personalEmail: emptyToNull(draft.personalEmail),
            workEmail: emptyToNull(draft.workEmail),
            cuspp: emptyToNull(draft.cuspp),
            phones,
            birthDate: draft.birthDate,
            childrenCount,
            sex: draft.sex,
            address: addressOf(draft),
          });
    },
    onSuccess: () => {
      toast.success(initialData ? "Empleado actualizado." : "Empleado registrado.");
      queryClient.invalidateQueries({ queryKey: ["hr-employees", legalEntityId] });
      onSuccess();
    },
    onError: (error: unknown) => {
      toast.error(readEmployeeError(error, "No se pudo guardar el empleado."));
    },
  });

  const patch = (partial: Partial<Draft>) => setDraft((current) => ({ ...current, ...partial }));

  const patchPhone = (index: number, partial: Partial<EmployeePhone>) => {
    setDraft((current) => ({
      ...current,
      phones: current.phones.map((phone, phoneIndex) =>
        phoneIndex === index ? { ...phone, ...partial } : phone
      ),
    }));
  };

  return (
    <form
      className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <p className="text-sm text-muted-foreground">
        Entidad legal: <span className="font-medium text-foreground">{legalEntityName}</span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Documento">
          <Select
            value={draft.documentType}
            onValueChange={(value) => patch({ documentType: value as IdentityDocumentType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IDENTITY_DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {IDENTITY_DOCUMENT_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Número de documento">
          <Input
            value={draft.documentNumber}
            onChange={(event) => patch({ documentNumber: event.target.value })}
            required
          />
        </Field>
        <Field label="Apellidos">
          <Input value={draft.surnames} onChange={(event) => patch({ surnames: event.target.value })} required />
        </Field>
        <Field label="Nombres">
          <Input value={draft.givenNames} onChange={(event) => patch({ givenNames: event.target.value })} required />
        </Field>
        <Field label="Correo personal">
          <Input
            type="email"
            value={draft.personalEmail}
            onChange={(event) => patch({ personalEmail: event.target.value })}
          />
        </Field>
        <Field label="Correo laboral">
          <Input type="email" value={draft.workEmail} onChange={(event) => patch({ workEmail: event.target.value })} />
        </Field>
        <Field label="CUSPP">
          <Input value={draft.cuspp} onChange={(event) => patch({ cuspp: event.target.value })} />
        </Field>
        <Field label="Sexo">
          <Select value={draft.sex} onValueChange={(value) => patch({ sex: value as Sex })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEXES.map((sex) => (
                <SelectItem key={sex} value={sex}>
                  {SEX_LABELS[sex]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Fecha de nacimiento">
          <Input type="date" value={draft.birthDate} onChange={(event) => patch({ birthDate: event.target.value })} required />
        </Field>
        <Field label="Cantidad de hijos">
          <Input
            type="number"
            min={0}
            value={draft.childrenCount}
            onChange={(event) => patch({ childrenCount: event.target.value })}
            required
          />
        </Field>
      </div>

      {initialData && (
        <p className="text-sm text-muted-foreground">
          Edad al último guardado: <span className="font-medium text-foreground">{initialData.ageYears} años</span>.
          El sistema la vuelve a calcular al guardar.
        </p>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Teléfonos</Label>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              patch({ phones: [...draft.phones, { use: "PERSONAL", number: "" }] })
            }
          >
            <Plus className="h-5 w-5" />
            Agregar teléfono
          </Button>
        </div>
        {draft.phones.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin teléfonos.</p>
        ) : (
          draft.phones.map((phone, index) => (
            <div key={index} className="grid grid-cols-[9rem_1fr_auto] gap-2">
              <Select
                value={phone.use}
                onValueChange={(value) => patchPhone(index, { use: value as PhoneUse })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHONE_USES.map((use) => (
                    <SelectItem key={use} value={use}>
                      {PHONE_USE_LABELS[use]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={phone.number}
                onChange={(event) => patchPhone(index, { number: event.target.value })}
                placeholder="Número"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Quitar teléfono"
                onClick={() =>
                  patch({ phones: draft.phones.filter((_, phoneIndex) => phoneIndex !== index) })
                }
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Dirección de domicilio">
          <Input value={draft.line} onChange={(event) => patch({ line: event.target.value })} required />
        </Field>
        <Field label="Distrito">
          <Input value={draft.district} onChange={(event) => patch({ district: event.target.value })} />
        </Field>
        <Field label="Ciudad">
          <Input value={draft.city} onChange={(event) => patch({ city: event.target.value })} />
        </Field>
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
          Cancelar
        </Button>
        <Button type="submit" className="shadow-md" disabled={save.isPending}>
          {save.isPending && <Loader2 className="h-5 w-5 animate-spin" />}
          Guardar
        </Button>
      </div>
    </form>
  );
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function addressOf(draft: Draft) {
  return {
    line: draft.line.trim(),
    district: emptyToNull(draft.district),
    city: emptyToNull(draft.city),
  };
}
