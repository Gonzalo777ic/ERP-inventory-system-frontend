import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ContractService, readContractError } from "@/api/services/contractService";
import { CatalogSelect, Field } from "@/pages/hr/contractUi";
import type { ContractTerms, HrCatalog, PaymentAccount } from "@/types/hr/contract";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TermsDraft {
  workerKind: string;
  payrollGroup: string;
  pensionRegime: string;
  laborRegime: string;
  allowSalaryAdvance: boolean;
  notes: string;
  wagePaymentMethod: string;
  wageBank: string;
  wageAccountType: string;
  wageAccountNumber: string;
  ctsPaymentMethod: string;
  ctsBank: string;
  ctsAccountType: string;
  ctsAccountNumber: string;
  retentionMode: string;
  retentionValue: string;
  retentionBeneficiary: string;
  cessationOn: string;
  cessationReason: string;
}

function fromTerms(terms: ContractTerms | undefined): TermsDraft {
  const wages = terms?.wages;
  const cts = terms?.cts;
  return {
    workerKind: terms?.workerKind ?? "",
    payrollGroup: terms?.payrollGroup ?? "",
    pensionRegime: terms?.pensionRegime ?? "",
    laborRegime: terms?.laborRegime ?? "",
    allowSalaryAdvance: terms?.allowSalaryAdvance ?? false,
    notes: terms?.notes ?? "",
    wagePaymentMethod: wages?.method ?? "",
    wageBank: wages?.bank ?? "",
    wageAccountType: wages?.accountType ?? "",
    wageAccountNumber: wages?.number ?? "",
    ctsPaymentMethod: cts?.method ?? "",
    ctsBank: cts?.bank ?? "",
    ctsAccountType: cts?.accountType ?? "",
    ctsAccountNumber: cts?.number ?? "",
    retentionMode: terms?.retentionMode ?? "",
    retentionValue: terms?.retentionValue == null ? "" : String(terms.retentionValue),
    retentionBeneficiary: terms?.retentionBeneficiary ?? "",
    cessationOn: terms?.cessationOn ?? "",
    cessationReason: terms?.cessationReason ?? "",
  };
}

export default function ContractTermsPanel({
  contractId,
  terms,
  catalog,
  status,
}: {
  contractId: number;
  terms: ContractTerms | undefined;
  catalog: HrCatalog | undefined;
  status: string;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<TermsDraft>(() => fromTerms(terms));

  useEffect(() => {
    setDraft(fromTerms(terms));
  }, [terms]);

  const closed = status === "CANCELLED" || status === "COMPLETED";

  const save = useMutation({
    mutationFn: () =>
      ContractService.updateTerms(contractId, {
        workerKind: draft.workerKind,
        payrollGroup: draft.payrollGroup,
        pensionRegime: draft.pensionRegime,
        laborRegime: draft.laborRegime,
        allowSalaryAdvance: draft.allowSalaryAdvance,
        notes: draft.notes || null,
        wagePaymentMethod: draft.wagePaymentMethod || null,
        wageBank: draft.wageBank || null,
        wageAccountType: draft.wageAccountType || null,
        wageAccountNumber: draft.wageAccountNumber || null,
        ctsPaymentMethod: draft.ctsPaymentMethod || null,
        ctsBank: draft.ctsBank || null,
        ctsAccountType: draft.ctsAccountType || null,
        ctsAccountNumber: draft.ctsAccountNumber || null,
        retentionMode: draft.retentionMode,
        retentionValue: draft.retentionValue === "" ? null : Number(draft.retentionValue),
        retentionBeneficiary: draft.retentionBeneficiary || null,
      }),
    onSuccess: () => {
      toast.success("Datos del contrato actualizados.");
      queryClient.invalidateQueries({ queryKey: ["hr-contract", contractId] });
    },
    onError: (error: unknown) => toast.error(readContractError(error, "No se pudieron guardar los datos.")),
  });

  const cease = useMutation({
    mutationFn: () => ContractService.cease(contractId, draft.cessationOn, draft.cessationReason),
    onSuccess: () => {
      toast.success("Contrato cesado. El libro se conserva.");
      queryClient.invalidateQueries({ queryKey: ["hr-contract", contractId] });
      queryClient.invalidateQueries({ queryKey: ["hr-contracts"] });
    },
    onError: (error: unknown) => toast.error(readContractError(error, "No se pudo registrar el cese.")),
  });

  const set = (patch: Partial<TermsDraft>) => setDraft((current) => ({ ...current, ...patch }));

  return (
    <div className="space-y-6">
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Tipo de trabajador">
            <CatalogSelect
              value={draft.workerKind}
              onChange={(workerKind) => set({ workerKind })}
              options={catalog?.workerKinds}
              placeholder="Tipo"
              ariaLabel="Tipo de trabajador"
            />
          </Field>
          <Field label="Grupo de planilla">
            <Input value={draft.payrollGroup} onChange={(event) => set({ payrollGroup: event.target.value })} />
          </Field>
          <Field label="Régimen pensionario">
            <CatalogSelect
              value={draft.pensionRegime}
              onChange={(pensionRegime) => set({ pensionRegime })}
              options={catalog?.pensionRegimes}
              placeholder="Régimen"
              ariaLabel="Régimen pensionario"
            />
          </Field>
          <Field label="Régimen laboral">
            <CatalogSelect
              value={draft.laborRegime}
              onChange={(laborRegime) => set({ laborRegime })}
              options={catalog?.laborRegimes}
              placeholder="Régimen laboral"
              ariaLabel="Régimen laboral"
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <Checkbox
            checked={draft.allowSalaryAdvance}
            onCheckedChange={(checked) => set({ allowSalaryAdvance: checked === true })}
          />
          Recibe adelantos
        </label>
        <AccountFields
          title="Pago de haberes"
          catalog={catalog}
          method={draft.wagePaymentMethod}
          bank={draft.wageBank}
          accountType={draft.wageAccountType}
          number={draft.wageAccountNumber}
          onChange={(patch) =>
            set({
              wagePaymentMethod: patch.method ?? draft.wagePaymentMethod,
              wageBank: patch.bank ?? draft.wageBank,
              wageAccountType: patch.accountType ?? draft.wageAccountType,
              wageAccountNumber: patch.number ?? draft.wageAccountNumber,
            })
          }
        />
        <AccountFields
          title="Pago de CTS"
          catalog={catalog}
          method={draft.ctsPaymentMethod}
          bank={draft.ctsBank}
          accountType={draft.ctsAccountType}
          number={draft.ctsAccountNumber}
          onChange={(patch) =>
            set({
              ctsPaymentMethod: patch.method ?? draft.ctsPaymentMethod,
              ctsBank: patch.bank ?? draft.ctsBank,
              ctsAccountType: patch.accountType ?? draft.ctsAccountType,
              ctsAccountNumber: patch.number ?? draft.ctsAccountNumber,
            })
          }
        />
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Retención">
            <CatalogSelect
              value={draft.retentionMode}
              onChange={(retentionMode) => set({ retentionMode })}
              options={catalog?.retentionModes}
              placeholder="Retención"
              ariaLabel="Retención"
            />
          </Field>
          <Field label="Monto o porcentaje">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={draft.retentionValue}
              onChange={(event) => set({ retentionValue: event.target.value })}
            />
          </Field>
          <Field label="Beneficiario">
            <Input
              value={draft.retentionBeneficiary}
              onChange={(event) => set({ retentionBeneficiary: event.target.value })}
            />
          </Field>
        </div>
        <Field label="Observaciones">
          <Textarea value={draft.notes} onChange={(event) => set({ notes: event.target.value })} />
        </Field>
        <Button type="submit" disabled={save.isPending || closed}>
          {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Grabar
        </Button>
      </form>

      {status === "ACTIVE" || status === "DRAFT" ? (
        <form
          className="space-y-4 rounded-lg border border-border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            cease.mutate();
          }}
        >
          <h2 className="text-lg font-semibold">Cese</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Fecha de cese">
              <Input type="date" value={draft.cessationOn} onChange={(event) => set({ cessationOn: event.target.value })} required />
            </Field>
            <Field label="Motivo del cese">
              <Input value={draft.cessationReason} onChange={(event) => set({ cessationReason: event.target.value })} required />
            </Field>
          </div>
          <Button type="submit" variant="outline" disabled={cease.isPending}>
            {cease.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Registrar cese
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function AccountFields({
  title,
  catalog,
  method,
  bank,
  accountType,
  number,
  onChange,
}: {
  title: string;
  catalog: HrCatalog | undefined;
  method: string;
  bank: string;
  accountType: string;
  number: string;
  onChange: (patch: Partial<PaymentAccount>) => void;
}) {
  const bankAccount = method === "BANK_ACCOUNT";
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Tipo de pago">
          <CatalogSelect
            value={method}
            onChange={(next) => onChange({ method: next })}
            options={catalog?.paymentMethods}
            placeholder="Tipo de pago"
            ariaLabel={`${title} tipo de pago`}
          />
        </Field>
        {bankAccount ? (
          <>
            <Field label="Banco">
              <CatalogSelect
                value={bank}
                onChange={(next) => onChange({ bank: next })}
                options={catalog?.banks}
                placeholder="Banco"
                ariaLabel={`${title} banco`}
              />
            </Field>
            <Field label="Tipo de cuenta">
              <CatalogSelect
                value={accountType}
                onChange={(next) => onChange({ accountType: next })}
                options={catalog?.accountTypes}
                placeholder="Tipo de cuenta"
                ariaLabel={`${title} tipo de cuenta`}
              />
            </Field>
            <Field label="Número de cuenta">
              <Input value={number} onChange={(event) => onChange({ number: event.target.value })} />
            </Field>
          </>
        ) : null}
      </div>
    </div>
  );
}
