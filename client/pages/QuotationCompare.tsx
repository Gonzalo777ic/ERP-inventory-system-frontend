import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  GitCompareArrows,
  Loader2,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  COMPARE_QUERY_STALE_MS,
  listQuotationsForCompare,
  quotationCompareQueryKeys,
} from "@/api/services/quotationCompare";
import {
  buildQuotationCompareMatrix,
  type CompareCell,
  type CompareProductRow,
  type CompareSupplierColumn,
} from "@/lib/quotationCompare";
import { ComprasSubNav } from "@/components/compras/ComprasSubNav";
import { CATALOG_CURRENCY } from "@/types/inventory/catalog";
import { formatCurrency } from "@/utils/format";
import type { QuotationStatus } from "@/types/inventory/quotations";

const SEARCH_DEBOUNCE_MS = 250;

function money(amount: number, currency: string = CATALOG_CURRENCY): string {
  return formatCurrency(amount, currency);
}

function statusVariant(
  status: QuotationStatus,
): "success" | "warning" | "info" | "neutral" {
  switch (status) {
    case "RESPONDIDO":
    case "APROBADO":
      return "success";
    case "ENVIADO":
      return "info";
    default:
      return "neutral";
  }
}

function CompareCellView({
  cell,
  isBest,
}: {
  cell: CompareCell | undefined;
  isBest: boolean;
}) {
  if (!cell) {
    return (
      <span className="text-sm text-muted-foreground">—</span>
    );
  }

  return (
    <div className="space-y-1 text-right">
      <div className="flex items-center justify-end gap-2">
        {isBest ? <Badge variant="success">Mejor</Badge> : null}
        <span className="font-bold">{money(cell.unitPrice, cell.currency)}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Cant. {cell.quantity} · Línea {money(cell.lineTotal, cell.currency)}
      </p>
    </div>
  );
}

function MatrixTable({
  columns,
  rows,
}: {
  columns: CompareSupplierColumn[];
  rows: CompareProductRow[];
}) {
  if (rows.length === 0) {
    return (
      <p className="text-center py-10 text-muted-foreground">
        No hay líneas que coincidan con el filtro.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="min-w-[220px]">Producto</TableHead>
              {columns.map((col) => (
                <TableHead key={col.quotationId} className="min-w-[180px] text-right">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground text-right">
                      {col.supplierName}
                    </p>
                    <p className="text-xs text-muted-foreground font-normal">
                      RFQ #{col.quotationId}
                    </p>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.key}
                className="transition-colors duration-150"
              >
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">{row.productName}</p>
                    {row.sku ? (
                      <p className="text-xs text-muted-foreground">{row.sku}</p>
                    ) : null}
                  </div>
                </TableCell>
                {columns.map((col) => {
                  const cell = row.cellsByQuotationId[col.quotationId];
                  const isBest =
                    !!cell && row.bestQuotationIds.includes(col.quotationId);
                  return (
                    <TableCell key={col.quotationId}>
                      <CompareCellView cell={cell} isBest={isBest} />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SideBySideCards({
  columns,
  rows,
}: {
  columns: CompareSupplierColumn[];
  rows: CompareProductRow[];
}) {
  if (columns.length === 0) {
    return (
      <p className="text-center py-10 text-muted-foreground">
        Selecciona al menos una cotización.
      </p>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {columns.map((col) => (
        <section
          key={col.quotationId}
          className="rounded-lg border border-border bg-card shadow-xl overflow-hidden"
        >
          <header className="border-b border-border bg-muted px-4 py-3 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{col.supplierName}</h2>
                <p className="text-xs text-muted-foreground">
                  RFQ #{col.quotationId} · {col.requestDate}
                </p>
              </div>
              <Badge variant={statusVariant(col.status)}>{col.status}</Badge>
            </div>
            {col.totalEstimated != null ? (
              <p className="text-sm">
                Total RFQ:{" "}
                <span className="font-bold">
                  {money(col.totalEstimated, col.currency)}
                </span>
              </p>
            ) : null}
          </header>
          <ul className="divide-y divide-border">
            {rows.map((row) => {
              const cell = row.cellsByQuotationId[col.quotationId];
              const isBest =
                !!cell && row.bestQuotationIds.includes(col.quotationId);
              return (
                <li
                  key={`${col.quotationId}-${row.key}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors duration-150"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{row.productName}</p>
                    {row.sku ? (
                      <p className="text-xs text-muted-foreground">{row.sku}</p>
                    ) : null}
                  </div>
                  <CompareCellView cell={cell} isBest={isBest} />
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default function QuotationCompare() {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: quotationCompareQueryKeys.list(),
    queryFn: listQuotationsForCompare,
    staleTime: COMPARE_QUERY_STALE_MS,
  });

  const quotations = data?.quotations;
  const source = data?.source;

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!quotations) return;
    setSelectedIds((prev) => {
      if (prev.length > 0) {
        const stillValid = prev.filter((id) =>
          quotations.some((q) => q.id === id),
        );
        return stillValid.length > 0
          ? stillValid
          : quotations.map((q) => q.id);
      }
      return quotations.map((q) => q.id);
    });
  }, [quotations]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearch(searchInput.trim().toLowerCase());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const selectedQuotations = useMemo(() => {
    if (!quotations) return [];
    return quotations.filter((q) => selectedIds.includes(q.id));
  }, [quotations, selectedIds]);

  const matrix = useMemo(
    () => buildQuotationCompareMatrix(selectedQuotations),
    [selectedQuotations],
  );

  const filteredRows = useMemo(() => {
    if (!search) return matrix.rows;
    return matrix.rows.filter((row) => {
      const hay = `${row.productName} ${row.sku ?? ""}`.toLowerCase();
      return hay.includes(search);
    });
  }, [matrix.rows, search]);

  const toggleQuotation = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((x) => x !== id);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[320px] p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">
          Cargando cotizaciones…
        </span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <ComprasSubNav />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/compras">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Compras
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <GitCompareArrows className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Comparativo de cotizaciones</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Compara líneas RFQ por producto y precio unitario. Solo lectura
            local de abastecimiento; sin ventas ni contabilidad.
          </p>
          {source === "fixture" ? (
            <Badge variant="warning">Usando fixtures locales</Badge>
          ) : null}
          {isFetching && !isLoading ? (
            <span className="inline-flex items-center text-xs text-muted-foreground">
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Actualizando…
            </span>
          ) : null}
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Filtrar producto…"
            className="pl-9"
            aria-label="Filtrar productos del comparativo"
          />
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-4 shadow-xl space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Cotizaciones a comparar</h2>
          <Badge variant="neutral">{quotations?.length ?? 0} disponibles</Badge>
        </div>
        {!quotations || quotations.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground">
            No hay RFQ comparables (ENVIADO / RESPONDIDO / APROBADO).
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {quotations.map((q) => {
              const checked = selectedIds.includes(q.id);
              return (
                <li
                  key={q.id}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors duration-150"
                >
                  <Checkbox
                    id={`rfq-${q.id}`}
                    checked={checked}
                    onCheckedChange={(value) =>
                      toggleQuotation(q.id, value === true)
                    }
                    aria-label={`Incluir RFQ ${q.id}`}
                  />
                  <label htmlFor={`rfq-${q.id}`} className="min-w-0 cursor-pointer space-y-1">
                    <span className="block font-medium">{q.supplier.name}</span>
                    <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>RFQ #{q.id}</span>
                      <Badge variant={statusVariant(q.status)}>{q.status}</Badge>
                      <span>{q.details.length} líneas</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">Tabla comparativa</TabsTrigger>
          <TabsTrigger value="cards">Vista lado a lado</TabsTrigger>
        </TabsList>
        <TabsContent value="table" className="space-y-3">
          <MatrixTable columns={matrix.columns} rows={filteredRows} />
        </TabsContent>
        <TabsContent value="cards" className="space-y-3">
          <SideBySideCards columns={matrix.columns} rows={filteredRows} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
