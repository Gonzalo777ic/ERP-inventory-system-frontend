import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BookOpen, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ComplaintBookService } from "@/api/services/complaintBookService";
import { complaintStatusTone, formatComplaintWhen } from "./complaintPresentation";

const COMPLAINT_LIST_STALE_MS = 15_000;

export default function ComplaintsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["complaint-book"],
    queryFn: ComplaintBookService.list,
    staleTime: COMPLAINT_LIST_STALE_MS,
  });

  const sheets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const rows = data ?? [];
    if (!normalized) return rows;
    return rows.filter((sheet) =>
      [sheet.sheetNumber, sheet.consumerName, sheet.kindLabel, sheet.statusLabel]
        .some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [data, query]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <BookOpen className="h-6 w-6 text-primary" />
            Libro de reclamaciones
          </h1>
          <p className="text-muted-foreground">Hojas enviadas desde el canal de ventas.</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar hoja, cliente o estado"
            className="pl-9"
            aria-label="Buscar en el libro"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-3">Cargando el libro...</span>
          </div>
        ) : isError ? (
          <p className="py-10 text-center text-destructive">No se pudo cargar el libro de reclamaciones.</p>
        ) : sheets.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">
            {data && data.length > 0 ? "Ninguna hoja coincide con la búsqueda." : "El libro todavía no tiene hojas."}
          </p>
        ) : (
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sheets.map((sheet) => (
                <TableRow
                  key={sheet.id}
                  className="cursor-pointer transition-colors duration-150"
                  onClick={() => navigate(`/complaints/${sheet.id}`)}
                >
                  <TableCell className="font-medium">{sheet.sheetNumber}</TableCell>
                  <TableCell>{formatComplaintWhen(sheet.filedAt)}</TableCell>
                  <TableCell>{sheet.consumerName}</TableCell>
                  <TableCell>{sheet.kindLabel}</TableCell>
                  <TableCell>
                    <Badge variant={complaintStatusTone(sheet.status)}>{sheet.statusLabel}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
