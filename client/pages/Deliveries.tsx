import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, Search, Truck } from "lucide-react";
import toast from "react-hot-toast";
import {
  DispatchGuideService,
  dispatchErrorMessage,
  dispatchQueryKeys,
} from "@/api/services/dispatchGuideService";
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
import type { DispatchGuideQuery } from "@/types/dispatch";
import { DeliveryAssignDialog } from "./dispatch/DeliveryAssignDialog";
import {
  ASSIGNMENT_BADGE,
  assigneeLabel,
  badgeVariant,
  documentLabel,
  referenceLabel,
} from "./dispatch/dispatchDisplay";

const ALL_ASSIGNMENTS = "ALL";

export default function Deliveries() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [assignment, setAssignment] = useState(ALL_ASSIGNMENTS);
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const listQuery: DispatchGuideQuery = {
    assignable: true,
    assignmentStatus: assignment === ALL_ASSIGNMENTS ? undefined : assignment,
    q: search.trim() || undefined,
    page,
  };

  const guidesQuery = useQuery({
    queryKey: dispatchQueryKeys.list(listQuery),
    queryFn: () => DispatchGuideService.list(listQuery),
  });

  const assignmentQuery = useQuery({
    queryKey: dispatchQueryKeys.assignmentStatuses(),
    queryFn: () => DispatchGuideService.assignmentStatuses(),
  });

  const guides = guidesQuery.data?.content ?? [];
  const selected = guides.find((guide) => guide.id === selectedId) ?? null;
  const totalPages = guidesQuery.data?.totalPages ?? 0;

  const assignDelivery = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof DispatchGuideService.assignDelivery>[1] }) =>
      DispatchGuideService.assignDelivery(id, payload),
    onSuccess: () => {
      toast.success("Delivery asignado.");
      setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: dispatchQueryKeys.all });
    },
    onError: (error) => toast.error(dispatchErrorMessage(error, "No se pudo asignar el delivery.")),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Asignación de delivery</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Guías ya emitidas. Registre el nombre o la referencia de quien entrega.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              placeholder="Destinatario, guía, repartidor…"
              className="pl-9"
              aria-label="Buscar entregas"
            />
          </div>
          <Select
            value={assignment}
            onValueChange={(value) => {
              setAssignment(value);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[200px]" aria-label="Filtrar asignación">
              <SelectValue placeholder="Asignación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ASSIGNMENTS}>Todas</SelectItem>
              {(assignmentQuery.data ?? []).map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" asChild>
            <Link to="/shipping-guides">
              <FileText className="h-5 w-5" />
              Guías
            </Link>
          </Button>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
        {guidesQuery.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Cargando guías emitidas…</span>
          </div>
        ) : guidesQuery.isError ? (
          <p className="py-10 text-center text-destructive">
            {dispatchErrorMessage(guidesQuery.error, "No se pudieron cargar las guías emitidas.")}
          </p>
        ) : guides.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">No hay guías emitidas para asignar.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Guía</TableHead>
                <TableHead>Destinatario</TableHead>
                <TableHead>Llegada</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead>Repartidor</TableHead>
                <TableHead>Medio</TableHead>
                <TableHead>Asignación</TableHead>
                <TableHead className="w-[140px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {guides.map((guide) => (
                <TableRow key={guide.id} className="transition-colors duration-150">
                  <TableCell className="font-medium">{documentLabel(guide)}</TableCell>
                  <TableCell>{guide.recipientName}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{guide.destinationAddress}</TableCell>
                  <TableCell className="text-muted-foreground">{referenceLabel(guide)}</TableCell>
                  <TableCell>{assigneeLabel(guide)}</TableCell>
                  <TableCell className="text-muted-foreground">{guide.medium || "Sin medio"}</TableCell>
                  <TableCell>
                    <Badge variant={badgeVariant(ASSIGNMENT_BADGE, guide.assignmentStatus)} className="border-0">
                      {guide.assignmentStatusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {guide.canAssignDelivery ? (
                      <Button variant="outline" size="sm" onClick={() => setSelectedId(guide.id)}>
                        <Truck className="h-4 w-4" />
                        Asignar
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {totalPages > 1 ? (
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" disabled={page <= 0} onClick={() => setPage((current) => current - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages}
          </span>
          <Button variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((current) => current + 1)}>
            Siguiente
          </Button>
        </div>
      ) : null}

      <DeliveryAssignDialog
        guide={selected}
        pending={assignDelivery.isPending}
        onClose={() => setSelectedId(null)}
        onAssign={(guideId, payload) => assignDelivery.mutate({ id: guideId, payload })}
      />
    </div>
  );
}
