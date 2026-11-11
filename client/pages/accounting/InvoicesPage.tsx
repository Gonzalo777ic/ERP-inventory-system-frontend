import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, FileText, Loader2, Search } from "lucide-react";
import { AccountingService } from "@/api/services/accountingService";
import { ContabilidadSubNav } from "@/components/accounting/ContabilidadSubNav";
import {
  buildAccountLookup,
  resolveAccountLabel,
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
  INVOICE_KIND_LABELS,
  INVOICE_STATUS_BADGE,
  INVOICE_STATUS_LABELS,
} from "@/data/accountingLabels";
import { formatCurrency, formatDate } from "@/utils/format";
import {
  ACCOUNTING_DISPLAY_CURRENCY,
  type AccountingInvoice,
  type AccountingInvoiceKind,
} from "@/types/accounting";

const ALL_KINDS = "ALL";

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [kindFilter, setKindFilter] = useState<string>(ALL_KINDS);
  const [selected, setSelected] = useState<AccountingInvoice | null>(null);

  const accountsQuery = useQuery({
    queryKey: ["accounting-accounts"],
    queryFn: () => AccountingService.listAccounts(),
  });

  const journalsQuery = useQuery({
    queryKey: ["accounting-journals"],
    queryFn: () => AccountingService.listJournals(),
  });

  const invoicesQuery = useQuery({
    queryKey: ["accounting-invoices"],
    queryFn: () => AccountingService.listInvoices(),
  });

  const accountLookup = useMemo(
    () => buildAccountLookup(accountsQuery.data ?? []),
    [accountsQuery.data],
  );

  const journals = journalsQuery.data ?? [];
  const invoices = useMemo(() => {
    const rows = invoicesQuery.data ?? [];
    const q = searchTerm.trim().toLowerCase();
    return rows.filter((inv) => {
      if (kindFilter !== ALL_KINDS && inv.kind !== kindFilter) return false;
      if (!q) return true;
      return [
        inv.number,
        inv.partnerName,
        inv.partnerDocument,
        INVOICE_KIND_LABELS[inv.kind],
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [invoicesQuery.data, searchTerm, kindFilter]);

  const money = (n: number) =>
    formatCurrency(n, ACCOUNTING_DISPLAY_CURRENCY);

  const isLoading =
    accountsQuery.isLoading ||
    journalsQuery.isLoading ||
    invoicesQuery.isLoading;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Facturas</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Documentos cliente/proveedor. Cuentas de línea desde el plan
            cargado.
            {AccountingService.isMockMode() ? " (demo local)" : null}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar número, partner…"
              className="pl-9"
              aria-label="Buscar facturas"
            />
          </div>
          <Select value={kindFilter} onValueChange={setKindFilter}>
            <SelectTrigger className="w-[180px]" aria-label="Tipo de factura">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_KINDS}>Todas</SelectItem>
              {(
                Object.keys(INVOICE_KIND_LABELS) as AccountingInvoiceKind[]
              ).map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {INVOICE_KIND_LABELS[kind]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ContabilidadSubNav />

      <div className="rounded-lg bg-card shadow-xl overflow-hidden border border-border">
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">
              Cargando facturas…
            </span>
          </div>
        ) : invoicesQuery.isError ? (
          <p className="text-center py-10 text-destructive">
            No se pudieron cargar las facturas.
          </p>
        ) : invoices.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">
            No hay facturas para los filtros actuales.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Número</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Emisión</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Diario</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => {
                const journal = journals.find((j) => j.id === inv.journalId);
                return (
                  <TableRow
                    key={inv.id}
                    className="transition-colors duration-150"
                  >
                    <TableCell className="font-medium font-mono">
                      {inv.number}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral" className="border-0">
                        {INVOICE_KIND_LABELS[inv.kind]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{inv.partnerName}</span>
                      <span className="block text-xs font-mono text-muted-foreground">
                        {inv.partnerDocument}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(inv.issueDate)}</TableCell>
                    <TableCell>{formatDate(inv.dueDate)}</TableCell>
                    <TableCell className="text-sm">
                      {journal ? journal.code : `#{inv.journalId}`}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {money(inv.total)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={INVOICE_STATUS_BADGE[inv.status]}
                        className="border-0"
                      >
                        {INVOICE_STATUS_LABELS[inv.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Ver factura ${inv.number}`}
                        onClick={() => setSelected(inv)}
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

      <InvoiceDetailDialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        invoice={selected}
        journalLabel={
          selected
            ? journals.find((j) => j.id === selected.journalId)?.name ?? null
            : null
        }
        accountLookup={accountLookup}
      />
    </div>
  );
}

function InvoiceDetailDialog({
  open,
  onOpenChange,
  invoice,
  journalLabel,
  accountLookup,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: AccountingInvoice | null;
  journalLabel: string | null;
  accountLookup: ReturnType<typeof buildAccountLookup>;
}) {
  if (!invoice) return null;
  const money = (n: number) =>
    formatCurrency(n, ACCOUNTING_DISPLAY_CURRENCY);
  const balance = Math.max(0, invoice.total - invoice.paidAmount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Factura {invoice.number}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm rounded-lg border border-border bg-muted/40 p-4">
            <div>
              <span className="text-xs uppercase text-muted-foreground">
                Partner
              </span>
              <p className="font-medium">{invoice.partnerName}</p>
            </div>
            <div>
              <span className="text-xs uppercase text-muted-foreground">
                Estado
              </span>
              <p>
                <Badge
                  variant={INVOICE_STATUS_BADGE[invoice.status]}
                  className="border-0"
                >
                  {INVOICE_STATUS_LABELS[invoice.status]}
                </Badge>
              </p>
            </div>
            <div>
              <span className="text-xs uppercase text-muted-foreground">
                Diario
              </span>
              <p>{journalLabel ?? `Diario #${invoice.journalId}`}</p>
            </div>
            <div>
              <span className="text-xs uppercase text-muted-foreground">
                Asiento
              </span>
              <p className="font-mono">
                {invoice.journalEntryId != null
                  ? `#${invoice.journalEntryId}`
                  : "Sin asiento aún"}
              </p>
            </div>
            <div>
              <span className="text-xs uppercase text-muted-foreground">
                Total / Pagado
              </span>
              <p className="font-bold">
                {money(invoice.total)} / {money(invoice.paidAmount)}
              </p>
            </div>
            <div>
              <span className="text-xs uppercase text-muted-foreground">
                Saldo
              </span>
              <p className="font-bold">{money(balance)}</p>
            </div>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Descripción</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead className="text-right">Total línea</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.lines.map((line) => {
                  const account = resolveAccountLabel(
                    accountLookup,
                    line.accountId,
                  );
                  return (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">
                        {line.description}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {account.code} — {account.name}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {money(line.lineTotal)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
