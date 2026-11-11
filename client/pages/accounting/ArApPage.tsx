import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Loader2, Scale, Search } from "lucide-react";
import { AccountingService } from "@/api/services/accountingService";
import { ContabilidadSubNav } from "@/components/accounting/ContabilidadSubNav";
import {
  buildAccountLookup,
  resolveAccountLabel,
  type AccountLookup,
} from "@/components/accounting/accountLookup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  INSTALLMENT_STATUS_BADGE,
  INSTALLMENT_STATUS_LABELS,
  LEDGER_STATUS_BADGE,
  LEDGER_STATUS_LABELS,
} from "@/data/accountingLabels";
import { formatCurrency, formatDate } from "@/utils/format";
import {
  ACCOUNTING_DISPLAY_CURRENCY,
  type AccountsPayableDoc,
  type AccountsReceivableDoc,
  type LedgerInstallment,
} from "@/types/accounting";

type LedgerRow =
  | { side: "AR"; doc: AccountsReceivableDoc }
  | { side: "AP"; doc: AccountsPayableDoc };

export default function ArApPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState<"ar" | "ap">("ar");
  const [selected, setSelected] = useState<LedgerRow | null>(null);

  const accountsQuery = useQuery({
    queryKey: ["accounting-accounts"],
    queryFn: () => AccountingService.listAccounts(),
  });

  const arQuery = useQuery({
    queryKey: ["accounting-ar"],
    queryFn: () => AccountingService.listAccountsReceivable(),
  });

  const apQuery = useQuery({
    queryKey: ["accounting-ap"],
    queryFn: () => AccountingService.listAccountsPayable(),
  });

  const accountLookup = useMemo(
    () => buildAccountLookup(accountsQuery.data ?? []),
    [accountsQuery.data],
  );

  const filterDocs = <T extends { number: string; partnerName: string }>(
    rows: T[],
  ) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.number, r.partnerName].join(" ").toLowerCase().includes(q),
    );
  };

  const arRows = filterDocs(arQuery.data ?? []);
  const apRows = filterDocs(apQuery.data ?? []);
  const money = (n: number) =>
    formatCurrency(n, ACCOUNTING_DISPLAY_CURRENCY);
  const isLoading =
    accountsQuery.isLoading || arQuery.isLoading || apQuery.isLoading;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Scale className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">CxC / CxP</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Cartera por cobrar y por pagar. Cuenta contable desde el plan
            cargado.
            {AccountingService.isMockMode() ? " (demo local)" : null}
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar documento, partner…"
            className="pl-9"
            aria-label="Buscar CxC/CxP"
          />
        </div>
      </div>

      <ContabilidadSubNav />

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "ar" | "ap")}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="ar">Cuentas por cobrar</TabsTrigger>
          <TabsTrigger value="ap">Cuentas por pagar</TabsTrigger>
        </TabsList>

        <TabsContent value="ar" className="mt-0">
          <LedgerTable
            isLoading={isLoading}
            isError={arQuery.isError}
            emptyLabel="No hay documentos por cobrar."
            rows={arRows.map((doc) => ({
              id: doc.id,
              number: doc.number,
              partnerName: doc.partnerName,
              invoiceNumber: doc.invoiceNumber,
              issueDate: doc.issueDate,
              dueDate: doc.dueDate,
              totalAmount: doc.totalAmount,
              paidAmount: doc.paidAmount,
              status: doc.status,
              accountId: doc.receivableAccountId,
              onOpen: () => setSelected({ side: "AR", doc }),
            }))}
            accountLookup={accountLookup}
            money={money}
          />
        </TabsContent>

        <TabsContent value="ap" className="mt-0">
          <LedgerTable
            isLoading={isLoading}
            isError={apQuery.isError}
            emptyLabel="No hay documentos por pagar."
            rows={apRows.map((doc) => ({
              id: doc.id,
              number: doc.number,
              partnerName: doc.partnerName,
              invoiceNumber: doc.invoiceNumber,
              issueDate: doc.issueDate,
              dueDate: doc.dueDate,
              totalAmount: doc.totalAmount,
              paidAmount: doc.paidAmount,
              status: doc.status,
              accountId: doc.payableAccountId,
              onOpen: () => setSelected({ side: "AP", doc }),
            }))}
            accountLookup={accountLookup}
            money={money}
          />
        </TabsContent>
      </Tabs>

      <LedgerDetailDialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        row={selected}
        accountLookup={accountLookup}
      />
    </div>
  );
}

type LedgerTableRow = {
  id: number;
  number: string;
  partnerName: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: AccountsReceivableDoc["status"];
  accountId: number;
  onOpen: () => void;
};

function LedgerTable({
  isLoading,
  isError,
  emptyLabel,
  rows,
  accountLookup,
  money,
}: {
  isLoading: boolean;
  isError: boolean;
  emptyLabel: string;
  rows: LedgerTableRow[];
  accountLookup: AccountLookup;
  money: (n: number) => string;
}) {
  return (
    <div className="rounded-lg bg-card shadow-xl overflow-hidden border border-border">
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Cargando cartera…</span>
        </div>
      ) : isError ? (
        <p className="text-center py-10 text-destructive">
          No se pudo cargar la cartera.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground">{emptyLabel}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Documento</TableHead>
              <TableHead>Partner</TableHead>
              <TableHead>Factura</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead>Vence</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const account = resolveAccountLabel(
                accountLookup,
                row.accountId,
              );
              const balance = Math.max(0, row.totalAmount - row.paidAmount);
              return (
                <TableRow
                  key={row.id}
                  className="transition-colors duration-150"
                >
                  <TableCell className="font-medium font-mono">
                    {row.number}
                  </TableCell>
                  <TableCell className="font-medium">
                    {row.partnerName}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {row.invoiceNumber || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {account.code}
                    <span className="block text-muted-foreground font-sans">
                      {account.name}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(row.dueDate)}</TableCell>
                  <TableCell className="text-right font-bold">
                    {money(balance)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={LEDGER_STATUS_BADGE[row.status]}
                      className="border-0"
                    >
                      {LEDGER_STATUS_LABELS[row.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Ver ${row.number}`}
                      onClick={row.onOpen}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function LedgerDetailDialog({
  open,
  onOpenChange,
  row,
  accountLookup,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: LedgerRow | null;
  accountLookup: AccountLookup;
}) {
  if (!row) return null;
  const doc = row.doc;
  const accountId =
    row.side === "AR" ? row.doc.receivableAccountId : row.doc.payableAccountId;
  const account = resolveAccountLabel(accountLookup, accountId);
  const money = (n: number) =>
    formatCurrency(n, ACCOUNTING_DISPLAY_CURRENCY);
  const installments: LedgerInstallment[] = doc.installments;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-xl">
        <DialogHeader>
          <DialogTitle>
            {row.side === "AR" ? "CxC" : "CxP"} {doc.number}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm rounded-lg border border-border bg-muted/40 p-4">
            <div>
              <span className="text-xs uppercase text-muted-foreground">
                Partner
              </span>
              <p className="font-medium">{doc.partnerName}</p>
            </div>
            <div>
              <span className="text-xs uppercase text-muted-foreground">
                Cuenta contable
              </span>
              <p className="font-mono text-sm">
                {account.code} — {account.name}
              </p>
            </div>
            <div>
              <span className="text-xs uppercase text-muted-foreground">
                Total / Pagado
              </span>
              <p className="font-bold">
                {money(doc.totalAmount)} / {money(doc.paidAmount)}
              </p>
            </div>
            <div>
              <span className="text-xs uppercase text-muted-foreground">
                Estado
              </span>
              <Badge
                variant={LEDGER_STATUS_BADGE[doc.status]}
                className="border-0"
              >
                {LEDGER_STATUS_LABELS[doc.status]}
              </Badge>
            </div>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>#</TableHead>
                  <TableHead>Vence</TableHead>
                  <TableHead className="text-right">Esperado</TableHead>
                  <TableHead className="text-right">Pagado</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installments.map((inst) => (
                  <TableRow key={inst.id}>
                    <TableCell className="font-medium">{inst.number}</TableCell>
                    <TableCell>{formatDate(inst.dueDate)}</TableCell>
                    <TableCell className="text-right font-bold">
                      {money(inst.expectedAmount)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {money(inst.paidAmount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={INSTALLMENT_STATUS_BADGE[inst.status]}
                        className="border-0"
                      >
                        {INSTALLMENT_STATUS_LABELS[inst.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
