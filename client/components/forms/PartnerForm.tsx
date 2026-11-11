import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PartnerService } from "../../api/services/partnerService";
import {
  PARTNER_DOCUMENT_TYPES,
  PARTNER_DOCUMENT_TYPE_LABELS,
  PARTNER_TYPES,
  PARTNER_TYPE_LABELS,
  type PartnerResponse,
  type PartnerType,
} from "../../types/partner";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";

const PARTNER_TYPES_MIN = 1;

const PartnerFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(160),
  isCompany: z.boolean(),
  types: z
    .array(z.enum(PARTNER_TYPES))
    .min(PARTNER_TYPES_MIN, "Selecciona al menos un tipo."),
  documentType: z.enum(PARTNER_DOCUMENT_TYPES).nullable(),
  documentNumber: z
    .string()
    .trim()
    .max(32)
    .transform((v) => (v === "" ? null : v)),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "Correo inválido.",
    })
    .transform((v) => (v === "" ? null : v)),
  phone: z
    .string()
    .trim()
    .max(40)
    .transform((v) => (v === "" ? null : v)),
  primaryAddress: z
    .string()
    .trim()
    .max(240)
    .transform((v) => (v === "" ? null : v)),
});

type PartnerFormInput = z.input<typeof PartnerFormSchema>;
type PartnerFormOutput = z.output<typeof PartnerFormSchema>;

interface PartnerFormProps {
  initialData?: PartnerResponse | null;
  onSuccess: () => void;
  onClose: () => void;
}

const emptyValues: PartnerFormInput = {
  displayName: "",
  isCompany: false,
  types: ["CUSTOMER"],
  documentType: null,
  documentNumber: "",
  email: "",
  phone: "",
  primaryAddress: "",
};

export default function PartnerForm({
  initialData,
  onSuccess,
  onClose,
}: PartnerFormProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;

  const form = useForm<PartnerFormInput, unknown, PartnerFormOutput>({
    resolver: zodResolver(PartnerFormSchema),
    defaultValues: initialData
      ? {
          displayName: initialData.displayName,
          isCompany: initialData.isCompany,
          types: [...initialData.types],
          documentType: initialData.documentType,
          documentNumber: initialData.documentNumber ?? "",
          email: initialData.email ?? "",
          phone: initialData.phone ?? "",
          primaryAddress: initialData.primaryAddress ?? "",
        }
      : emptyValues,
  });

  const selectedTypes = form.watch("types");

  const mutation = useMutation({
    mutationFn: (values: PartnerFormOutput) => {
      const payload = {
        displayName: values.displayName,
        isCompany: values.isCompany,
        types: values.types as PartnerType[],
        documentType: values.documentType,
        documentNumber: values.documentNumber,
        email: values.email,
        phone: values.phone,
        primaryAddress: values.primaryAddress,
      };
      return isEditMode && initialData
        ? PartnerService.update(initialData.id, payload)
        : PartnerService.create(payload);
    },
    onSuccess: () => {
      toast.success(
        isEditMode ? "Partner actualizado." : "Partner creado.",
      );
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : `No se pudo ${isEditMode ? "actualizar" : "crear"} el partner.`;
      toast.error(message);
    },
  });

  const toggleType = (type: PartnerType, checked: boolean) => {
    const current = form.getValues("types");
    const next = checked
      ? Array.from(new Set([...current, type]))
      : current.filter((t) => t !== type);
    form.setValue("types", next, { shouldValidate: true });
  };

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
    >
      <div className="space-y-2">
        <Label htmlFor="partner-displayName">Nombre</Label>
        <Input
          id="partner-displayName"
          placeholder="Persona o razón social"
          disabled={mutation.isPending}
          {...form.register("displayName")}
        />
        {form.formState.errors.displayName && (
          <p className="text-sm text-destructive">
            {form.formState.errors.displayName.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
        <div className="space-y-0.5">
          <Label htmlFor="partner-isCompany">Es empresa</Label>
          <p className="text-xs text-muted-foreground">
            Activa si la ficha es persona jurídica.
          </p>
        </div>
        <Switch
          id="partner-isCompany"
          checked={form.watch("isCompany")}
          onCheckedChange={(checked) => form.setValue("isCompany", checked)}
          disabled={mutation.isPending}
        />
      </div>

      <fieldset className="space-y-2">
        <LegendLabel>Tipos</LegendLabel>
        <div className="grid grid-cols-2 gap-3">
          {PARTNER_TYPES.map((type) => (
            <label
              key={type}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              <Checkbox
                checked={selectedTypes.includes(type)}
                onCheckedChange={(value) =>
                  toggleType(type, value === true)
                }
                disabled={mutation.isPending}
              />
              {PARTNER_TYPE_LABELS[type]}
            </label>
          ))}
        </div>
        {form.formState.errors.types && (
          <p className="text-sm text-destructive">
            {form.formState.errors.types.message}
          </p>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Tipo de documento</Label>
          <Select
            value={form.watch("documentType") ?? "NONE"}
            onValueChange={(value) =>
              form.setValue(
                "documentType",
                value === "NONE"
                  ? null
                  : (value as (typeof PARTNER_DOCUMENT_TYPES)[number]),
              )
            }
            disabled={mutation.isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sin documento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Sin documento</SelectItem>
              {PARTNER_DOCUMENT_TYPES.map((code) => (
                <SelectItem key={code} value={code}>
                  {PARTNER_DOCUMENT_TYPE_LABELS[code]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="partner-documentNumber">N° documento</Label>
          <Input
            id="partner-documentNumber"
            placeholder="DNI / RUC…"
            disabled={mutation.isPending}
            {...form.register("documentNumber")}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="partner-email">Correo</Label>
          <Input
            id="partner-email"
            type="email"
            placeholder="correo@ejemplo.com"
            disabled={mutation.isPending}
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="partner-phone">Teléfono</Label>
          <Input
            id="partner-phone"
            placeholder="+51 …"
            disabled={mutation.isPending}
            {...form.register("phone")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="partner-address">Dirección principal</Label>
        <Input
          id="partner-address"
          placeholder="Calle, distrito, ciudad"
          disabled={mutation.isPending}
          {...form.register("primaryAddress")}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={mutation.isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending} className="shadow-md">
          {mutation.isPending && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {isEditMode ? "Guardar cambios" : "Crear partner"}
        </Button>
      </div>
    </form>
  );
}

function LegendLabel({ children }: { children: React.ReactNode }) {
  return (
    <legend className="text-sm font-medium leading-none text-foreground">
      {children}
    </legend>
  );
}
