import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Eye, Loader2, Search } from "lucide-react";
import { AccountingService } from "@/api/services/accountingService";
import { ContabilidadSubNav } from "@/components/accounting/ContabilidadSubNav";
import { JournalEntryDetailDialog } from "@/components/accounting/JournalEntryDetailDialog";
import {
  buildAccountLookup,
  resolveAccountLabel,
} from "@/components/accounting/accountLookup";
import { Badge } from "@/components/ui/badge";
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
  ENTRY_STATUS_BADGE,
  ENTRY_STATUS_LABELS,
  JOURNAL_KIND_LABELS,
} from "@/data/accountingLabels";
import { formatCurrency, formatDate } from "@/utils/format";
import {
  ACCOUNTING_DISPLAY_CURRENCY,
  type JournalEntry,
  type JournalEntryStatus,
} from "@/types/accounting";

const SEARCH_DEBOUNCE_MS = 0;
const ALL_JOURNALS = "ALL";
const ALL_STATUSES = "ALL";

export default function JournalEntriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [journalFilter, setJournalFilter] = useState<string>(ALL_JOURNALS);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES);
  const [selected, setSelected] = useState<JournalEntry | null>(null);

  const accountsQuery = useQuery({
    queryKey: ["accounting-accounts"],
    queryFn: () => AccountingService.listAccounts(),
  });

  const journalsQuery = useQuery({
    queryKey: ["accounting-journals"],
    queryFn: () => AccountingService.listJournals(),
  });

  const entriesQuery = useQuery({
    queryKey: ["accounting-entries", journalFilter, statusFilter, searchTerm],
    queryFn: () =>
      AccountingService.listEntries({
        search: searchTerm,
        journalId:
          journalFilter === ALL_JOURNALS
            ? undefined
            : Number(journalFilter),
        status:
          statusFilter === ALL_STATUSES
            ? "ALL"
            : (statusFilter as JournalEntryStatus),
      }),
  });

  const accountLookup = useMemo(
    () => buildAccountLookup(accountsQuery.data ?? []),
    [accountsQuery.data],
  );

  const journals = journalsQuery.data ?? [];
  const entries = entriesQuery.data ?? [];
  const isLoading =
    accountsQuery.isLoading ||
    journalsQuery.isLoading ||
    entriesQuery.isLoading;

  const money = (n: number) =>
    formatCurrency(n, ACCOUNTING_DISPLAY_CURRENCY);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Asientos</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Libro diario. Códigos de cuenta resueltos desde el plan cargado.
            {AccountingService.isMockMode() ? " (demo local)" : null}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar concepto, ref…"
              className="pl-9"
              aria-label="Buscar asientos"
              data-search-debounce-ms={SEARCH_DEBOUNCE_MS}
            />
          </div>
          <Select value={journalFilter} onValueChange={setJournalFilter}>
            <SelectTrigger className="w-[200px]" aria-label="Filtrar diario">
              <SelectValue placeholder="Diario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_JOURNALS}>Todos los diarios</SelectItem>
              {journals.map((j) => (
                <SelectItem key={j.id} value={String(j.id)}>
                  {j.code} — {j.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]" aria-label="Filtrar estado">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUSES}>Todos</SelectItem>
              {(
                Object.keys(ENTRY_STATUS_LABELS) as JournalEntryStatus[]
              ).map((status) => (
                <SelectItem key={status} value={status}>
                  {ENTRY_STATUS_LABELS[status]}
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
              Cargando asientos…
            </span>
          </div>
        ) : entriesQuery.isError ? (
          <p className="text-center py-10 text-destructive">
            No se pudieron cargar los asientos.
          </p>
        ) : entries.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">
            No hay asientos para los filtros actuales.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Número</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Diario</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Cuentas</TableHead>
                <TableHead className="text-right">Debe</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const journal = journals.find((j) => j.id === entry.journalId);
                const debit = entry.lines.reduce((s, l) => s + l.debit, 0);
                const accountHints = entry.lines
                  .slice(0, 2)
                  .map((l) => resolveAccountLabel(accountLookup, l.accountId).code)
                  .join(", ");

                return (
                  <TableRow
                    key={entry.id}
                    className="transition-colors duration-150"
                  >
                    <TableCell className="font-medium font-mono text-sm">
                      {entry.number}
                    </TableCell>
                    <TableCell>{formatDate(entry.entryDate)}</TableCell>
                    <TableCell>
                      {journal ? (
                        <span className="text-sm">
                          <span className="font-medium">{journal.code}</span>
                          <span className="block text-xs text-muted-foreground">
                            {JOURNAL_KIND_LABELS[journal.kind]}
                          </span>
                        </span>
                      ) : (
                        `#{entry.journalId}`
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{entry.concept}</span>
                      {entry.referenceDocument ? (
                        <span className="block text-xs font-mono text-muted-foreground">
                          {entry.referenceDocument}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {accountHints}
                      {entry.lines.length > 2 ? "…" : ""}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {money(debit)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={ENTRY_STATUS_BADGE[entry.status]}
                        className="border-0"
                      >
                        {ENTRY_STATUS_LABELS[entry.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Ver asiento ${entry.number}`}
                        onClick={() => setSelected(entry)}
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

      <JournalEntryDetailDialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        entry={selected}
        journals={journals}
        accounts={accountLookup}
      />
    </div>
  );
}
