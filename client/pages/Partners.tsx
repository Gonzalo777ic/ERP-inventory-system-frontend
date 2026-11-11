import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Building2,
  Contact,
  Loader2,
  Pencil,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PartnerService } from "../api/services/partnerService";
import PartnerForm from "../components/forms/PartnerForm";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  PARTNER_DOCUMENT_TYPE_LABELS,
  PARTNER_TYPE_BADGE_VARIANT,
  PARTNER_TYPE_LABELS,
  type PartnerResponse,
} from "../types/partner";

const SEARCH_DEBOUNCE_MS = 0;

export default function Partners() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] =
    useState<PartnerResponse | null>(null);
  const [partnerToRetire, setPartnerToRetire] =
    useState<PartnerResponse | null>(null);

  const {
    data: partners = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["partners"],
    queryFn: () => PartnerService.list(),
  });

  const retireMutation = useMutation({
    mutationFn: (id: number) => PartnerService.retire(id),
    onSuccess: (_data, id) => {
      const name =
        partnerToRetire?.displayName ??
        partners.find((p) => p.id === id)?.displayName ??
        "Partner";
      toast.success(`«${name}» dado de baja. El histórico se conserva.`);
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      setPartnerToRetire(null);
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "No se pudo dar de baja.";
      toast.error(message);
    },
  });

  const filteredPartners = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return partners;
    return partners.filter((partner) => {
      const haystack = [
        partner.displayName,
        partner.documentNumber,
        partner.email,
        partner.phone,
        partner.primaryAddress,
        ...partner.types.map((t) => PARTNER_TYPE_LABELS[t]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [partners, searchTerm]);

  const openCreate = () => {
    setSelectedPartner(null);
    setIsFormOpen(true);
  };

  const openEdit = (partner: PartnerResponse) => {
    setSelectedPartner(partner);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedPartner(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Contact className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Partners</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Contactos comerciales: clientes, proveedores, empleados y contactos.
            {PartnerService.isMockMode()
              ? " (fixtures locales — sin API)."
              : ""}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar nombre, documento…"
              className="pl-9"
              aria-label="Buscar partners"
              data-search-debounce-ms={SEARCH_DEBOUNCE_MS}
            />
          </div>
          <Button onClick={openCreate} className="shadow-md gap-2">
            <Plus className="h-5 w-5" />
            Nuevo partner
          </Button>
        </div>
      </div>

      <div className="rounded-lg bg-card shadow-xl overflow-hidden border border-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-3">Cargando partners…</span>
          </div>
        ) : isError ? (
          <p className="text-center py-10 text-destructive">
            {error instanceof Error
              ? error.message
              : "Error al cargar partners."}
          </p>
        ) : filteredPartners.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">
            {partners.length === 0
              ? "Aún no hay partners vigentes."
              : "Ningún partner coincide con la búsqueda."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead>Nombre</TableHead>
                <TableHead>Tipos</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead className="w-[100px] text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.map((partner) => (
                <TableRow
                  key={partner.id}
                  className="transition-colors duration-150"
                >
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        {partner.isCompany ? (
                          <Building2 className="h-4 w-4" />
                        ) : (
                          <UserRound className="h-4 w-4" />
                        )}
                      </span>
                      <div className="space-y-0.5">
                        <p className="font-medium">{partner.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {partner.isCompany ? "Empresa" : "Persona"}
                          {partner.primaryAddress
                            ? ` · ${partner.primaryAddress}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {partner.types.map((type) => (
                        <Badge
                          key={type}
                          variant={PARTNER_TYPE_BADGE_VARIANT[type]}
                        >
                          {PARTNER_TYPE_LABELS[type]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {partner.documentType && partner.documentNumber ? (
                      <span className="text-sm">
                        <span className="font-medium">
                          {PARTNER_DOCUMENT_TYPE_LABELS[partner.documentType]}
                        </span>{" "}
                        {partner.documentNumber}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-sm">
                      <p>{partner.email ?? "—"}</p>
                      <p className="text-muted-foreground">
                        {partner.phone ?? "Sin teléfono"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Editar"
                        onClick={() => openEdit(partner)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Dar de baja"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setPartnerToRetire(partner)}
                        disabled={retireMutation.isPending}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPartner ? "Editar partner" : "Nuevo partner"}
            </DialogTitle>
          </DialogHeader>
          <PartnerForm
            key={selectedPartner?.id ?? "new"}
            initialData={selectedPartner}
            onSuccess={closeForm}
            onClose={closeForm}
          />
        </DialogContent>
      </Dialog>

      {partnerToRetire && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="max-w-sm w-full rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-xl font-bold text-destructive">
                Dar de baja
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPartnerToRetire(null)}
                disabled={retireMutation.isPending}
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-sm text-foreground">
              ¿Confirmas la baja de{" "}
              <span className="font-medium">
                {partnerToRetire.displayName}
              </span>
              ? Deja de aparecer en listados vigentes y el histórico se
              conserva.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setPartnerToRetire(null)}
                disabled={retireMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => retireMutation.mutate(partnerToRetire.id)}
                disabled={retireMutation.isPending}
              >
                {retireMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
                {retireMutation.isPending ? "Dando de baja…" : "Dar de baja"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
