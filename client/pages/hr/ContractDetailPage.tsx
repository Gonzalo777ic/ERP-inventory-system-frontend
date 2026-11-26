import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ContractService, readContractError } from "@/api/services/contractService";
import {
  AffiliationBook,
  AnnexBook,
  RenewalBook,
  RoleBook,
  ShiftBook,
  StatementBook,
  WageBook,
} from "@/pages/hr/ContractBooks";
import ContractTermsPanel from "@/pages/hr/ContractTermsPanel";
import { ContractStatusBadge, formatDate, formatMoney, optionLabel } from "@/pages/hr/contractUi";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ContractDetailPage() {
  const { id } = useParams();
  const contractId = Number(id);
  const queryClient = useQueryClient();
  const detailQuery = useQuery({
    queryKey: ["hr-contract", contractId],
    queryFn: () => ContractService.detail(contractId),
    enabled: Number.isFinite(contractId),
  });
  const catalogQuery = useQuery({
    queryKey: ["hr-catalog"],
    queryFn: ContractService.catalog,
  });

  const activate = useMutation({
    mutationFn: () => ContractService.activate(contractId),
    onSuccess: () => {
      toast.success("Contrato activado.");
      queryClient.invalidateQueries({ queryKey: ["hr-contract", contractId] });
      queryClient.invalidateQueries({ queryKey: ["hr-contracts"] });
    },
    onError: (error: unknown) => toast.error(readContractError(error, "No se pudo activar el contrato.")),
  });

  if (detailQuery.isLoading) {
    return (
      <div className="flex justify-center p-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const detail = detailQuery.data;
  if (!detail) {
    return <p className="p-6 text-muted-foreground">Contrato no encontrado.</p>;
  }

  const summary = detail.summary;
  const catalog = catalogQuery.data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Link to="/hr/contracts" className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            <ArrowLeft className="h-4 w-4" />
            Volver al listado
          </Link>
          <h1 className="text-3xl font-bold">{summary.displayName}</h1>
          <p className="text-muted-foreground">
            {summary.documentNumber} · {optionLabel(catalog?.contractTypes, summary.contractType)} ·{" "}
            {formatDate(summary.startsOn)}
            {summary.endsOn ? ` – ${formatDate(summary.endsOn)}` : ""} · {formatMoney(detail.wage)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ContractStatusBadge status={summary.status} catalog={catalog?.contractStatuses} />
          {summary.status === "DRAFT" && (
            <Button onClick={() => activate.mutate()} disabled={activate.isPending}>
              {activate.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Activar
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="terms" className="space-y-4">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="terms">Datos generales</TabsTrigger>
          <TabsTrigger value="wages">Sueldo</TabsTrigger>
          <TabsTrigger value="roles">Cargo</TabsTrigger>
          <TabsTrigger value="shifts">Horario</TabsTrigger>
          <TabsTrigger value="affiliations">Afiliaciones</TabsTrigger>
          <TabsTrigger value="renewals">Renovaciones</TabsTrigger>
          <TabsTrigger value="statements">Constancias</TabsTrigger>
          <TabsTrigger value="annexes">Anexos</TabsTrigger>
        </TabsList>
        <TabsContent value="terms" className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <ContractTermsPanel contractId={contractId} terms={detail.terms} catalog={catalog} status={summary.status} />
        </TabsContent>
        <TabsContent value="wages" className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <WageBook contractId={contractId} detail={detail} catalog={catalog} />
        </TabsContent>
        <TabsContent value="roles" className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <RoleBook contractId={contractId} detail={detail} />
        </TabsContent>
        <TabsContent value="shifts" className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <ShiftBook contractId={contractId} detail={detail} />
        </TabsContent>
        <TabsContent value="affiliations" className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <AffiliationBook contractId={contractId} detail={detail} catalog={catalog} />
        </TabsContent>
        <TabsContent value="renewals" className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <RenewalBook contractId={contractId} detail={detail} />
        </TabsContent>
        <TabsContent value="statements" className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <StatementBook contractId={contractId} />
        </TabsContent>
        <TabsContent value="annexes" className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <AnnexBook contractId={contractId} detail={detail} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
