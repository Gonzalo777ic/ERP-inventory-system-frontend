import { ArrowRightLeft, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ENTRY_STATUS_BADGE,
  ENTRY_STATUS_LABELS,
} from "@/data/accountingLabels";
import { formatCurrency, formatDate } from "@/utils/format";
import {
  ACCOUNTING_DISPLAY_CURRENCY,
  type AccountingJournal,
  type JournalEntry,
} from "@/types/accounting";
import {
  resolveAccountLabel,
  type AccountLookup,
} from "./accountLookup";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: JournalEntry | null;
  journals: readonly AccountingJournal[];
  accounts: AccountLookup;
};

export function JournalEntryDetailDialog({
  open,
  onOpenChange,
  entry,
  journals,
  accounts,
}: Props) {
  if (!entry) return null;

  const journal = journals.find((j) => j.id === entry.journalId);
  const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
  const money = (n: number) =>
    formatCurrency(n, ACCOUNTING_DISPLAY_CURRENCY);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Asiento {entry.number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/40 p-4 text-sm">
            <div>
              <span className="block text-xs font-semibold uppercase text-muted-foreground">
                Concepto
              </span>
              <span className="font-medium">{entry.concept}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase text-muted-foreground">
                Fecha
              </span>
              <span>{formatDate(entry.entryDate)}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase text-muted-foreground">
                Diario
              </span>
              <span>
                {journal
                  ? `${journal.code} — ${journal.name}`
                  : `Diario #${entry.journalId}`}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase text-muted-foreground">
                Estado
              </span>
              <Badge variant={ENTRY_STATUS_BADGE[entry.status]} className="border-0">
                {ENTRY_STATUS_LABELS[entry.status]}
              </Badge>
            </div>
            <div className="col-span-2">
              <span className="block text-xs font-semibold uppercase text-muted-foreground">
                Referencia
              </span>
              <span className="font-mono text-sm">
                {entry.referenceDocument ?? "—"}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[110px]">Cuenta</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right w-[140px]">Debe</TableHead>
                  <TableHead className="text-right w-[140px]">Haber</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entry.lines.map((line) => {
                  const account = resolveAccountLabel(accounts, line.accountId);
                  return (
                    <TableRow key={line.id}>
                      <TableCell className="font-mono font-medium">
                        {account.code}
                      </TableCell>
                      <TableCell>
                        {account.name}
                        {line.memo ? (
                          <span className="block text-xs text-muted-foreground">
                            {line.memo}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {line.debit > 0 ? money(line.debit) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {line.credit > 0 ? money(line.credit) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-muted/40 border-t-2">
                  <TableCell
                    colSpan={2}
                    className="text-right text-xs uppercase text-muted-foreground"
                  >
                    Totales
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {money(totalDebit)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {money(totalCredit)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div
            className={`flex items-center justify-center gap-2 rounded-lg p-2 text-sm ${
              isBalanced
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger"
            }`}
          >
            <ArrowRightLeft className="h-4 w-4" />
            {isBalanced
              ? "Asiento balanceado (debe = haber)"
              : "Asiento descuadrado"}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
