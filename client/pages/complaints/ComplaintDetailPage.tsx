import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ComplaintBookService,
  complaintErrorMessage,
  type ComplaintAction,
  type ComplaintSheet,
} from "@/api/services/complaintBookService";
import { complaintStatusTone, formatComplaintAmount, formatComplaintWhen } from "./complaintPresentation";

const COMPLAINT_DETAIL_STALE_MS = 15_000;

export default function ComplaintDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const validId = Number.isInteger(id) && id > 0;
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<ComplaintAction | null>(null);
  const [text, setText] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["complaint-book", id],
    queryFn: () => ComplaintBookService.get(id),
    enabled: validId,
    staleTime: COMPLAINT_DETAIL_STALE_MS,
  });

  const mutation = useMutation({
    mutationFn: (action: ComplaintAction) => ComplaintBookService.apply(id, action, text),
    onSuccess: async (sheet) => {
      toast.success(sheet.statusLabel);
      setPending(null);
      setText("");
      await queryClient.invalidateQueries({ queryKey: ["complaint-book"] });
    },
    onError: (error) => {
      toast.error(complaintErrorMessage(error, "No se pudo actualizar la hoja."));
    },
  });

  const run = (action: ComplaintAction) => {
    if (action.textField) {
      setText("");
      setPending(action);
      return;
    }
    mutation.mutate(action);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <BookOpen className="h-6 w-6 text-primary" />
            {data ? `Hoja ${data.sheetNumber}` : "Hoja de reclamación"}
          </h1>
          {data && (
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
              <span>{formatComplaintWhen(data.filedAt)}</span>
              <Badge variant={complaintStatusTone(data.status)}>{data.statusLabel}</Badge>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link to="/complaints">
              <ArrowLeft className="h-5 w-5" />
              Bandeja
            </Link>
          </Button>
          {data?.actions.map((action) => (
            <Button
              key={action.code}
              variant={actionVariant(action.textField)}
              disabled={mutation.isPending}
              onClick={() => run(action)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {!validId && <p className="text-destructive">La hoja indicada no es válida.</p>}
      {isLoading && (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-3">Abriendo la hoja...</span>
        </div>
      )}
      {isError && <p className="text-center text-destructive">No se encontró la hoja en el libro.</p>}
      {data && <ComplaintReading sheet={data} />}

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent className="rounded-xl sm:rounded-xl">
          <DialogHeader>
            <DialogTitle>{pending?.textLabel || pending?.label}</DialogTitle>
            <DialogDescription>La hoja permanece en el libro. Esta nota queda registrada con el estado.</DialogDescription>
          </DialogHeader>
          <Textarea value={text} onChange={(event) => setText(event.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cerrar
            </Button>
            <Button
              variant={actionVariant(pending?.textField)}
              disabled={mutation.isPending || text.trim() === ""}
              onClick={() => pending && mutation.mutate(pending)}
            >
              {pending?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ComplaintReading({ sheet }: { sheet: ComplaintSheet }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-xl">
        <h2 className="text-2xl font-bold">Consumidor</h2>
        <dl className="space-y-3 text-sm">
          <Fact label="Nombre" value={sheet.consumerName} />
          <Fact label="Documento" value={`${sheet.documentTypeLabel} ${sheet.documentNumber}`} />
          <Fact label="Domicilio" value={sheet.address} />
          <Fact label="Teléfono" value={sheet.phone} />
          <Fact label="Correo" value={sheet.email} />
          <Fact label="Id de cliente" value={sheet.customerId ? String(sheet.customerId) : null} />
          {sheet.minor && (
            <>
              <Fact label="Apoderado" value={sheet.guardianName} />
              <Fact
                label="Documento del apoderado"
                value={
                  sheet.guardianDocumentTypeLabel
                    ? `${sheet.guardianDocumentTypeLabel} ${sheet.guardianDocumentNumber ?? ""}`
                    : null
                }
              />
            </>
          )}
        </dl>
      </section>
      <section className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-xl">
        <h2 className="text-2xl font-bold">Reclamo</h2>
        <dl className="space-y-3 text-sm">
          <Fact label="Tipo" value={sheet.kindLabel} />
          <Fact label="Bien o servicio" value={sheet.subjectKindLabel} />
          <Fact label="Descripción" value={sheet.subjectDescription} />
          <Fact label="Monto" value={formatComplaintAmount(sheet.claimedAmount, sheet.currency)} />
          <Fact label="Pedido o comprobante" value={sheet.orderReference} />
          <Fact label="Detalle" value={sheet.detail} />
          <Fact label="Pedido del consumidor" value={sheet.consumerRequest} />
          <Fact label="Respuesta del proveedor" value={sheet.providerResponse} />
          <Fact label="Motivo de anulación" value={sheet.voidReason} />
        </dl>
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid gap-1 border-b border-border pb-3 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value && value.trim() ? value : "—"}</dd>
    </div>
  );
}

function actionVariant(textField: string | null | undefined): "default" | "outline" | "destructive" {
  if (textField === "reason") return "destructive";
  if (textField) return "default";
  return "outline";
}
