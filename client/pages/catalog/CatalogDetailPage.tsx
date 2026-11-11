import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ArrowLeft, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { CatalogService } from "../../api/services/catalog";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { formatCurrency } from "../../utils/format";
import { CATALOG_CURRENCY } from "../../types/inventory/catalog";
import { CatalogRetireDialog } from "./CatalogRetireDialog";
import {
  COSTING_METHOD_LABELS,
  PRODUCT_TYPE_BADGE,
  PRODUCT_TYPE_LABELS,
  formatAttributeLine,
} from "./catalogLabels";

const DETAIL_STALE_MS = 30_000;

export default function CatalogDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const productId = Number(idParam);
  const queryClient = useQueryClient();

  const [retireProductOpen, setRetireProductOpen] = useState(false);
  const [retireVariant, setRetireVariant] = useState<{
    id: number;
    sku: string;
  } | null>(null);

  const detailQuery = useQuery({
    queryKey: ["catalog", "product", productId],
    queryFn: () => CatalogService.getById(productId),
    enabled: Number.isFinite(productId) && productId > 0,
    staleTime: DETAIL_STALE_MS,
  });

  const retireProductMutation = useMutation({
    mutationFn: () => CatalogService.retire(productId),
    onSuccess: () => {
      toast.success("Producto dado de baja. El histórico se conserva.");
      setRetireProductOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
    onError: () => toast.error("No se pudo dar de baja el producto."),
  });

  const retireVariantMutation = useMutation({
    mutationFn: (variantId: number) =>
      CatalogService.retireVariant(productId, variantId),
    onSuccess: () => {
      toast.success("Variante dada de baja.");
      setRetireVariant(null);
      void queryClient.invalidateQueries({
        queryKey: ["catalog", "product", productId],
      });
      void queryClient.invalidateQueries({ queryKey: ["catalog", "products"] });
    },
    onError: () => toast.error("No se pudo dar de baja la variante."),
  });

  if (!Number.isFinite(productId) || productId <= 0) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-destructive">Identificador de producto inválido.</p>
        <Button variant="outline" asChild>
          <Link to="/catalog">Volver al catálogo</Link>
        </Button>
      </div>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <div className="p-6 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-3">Cargando ficha…</span>
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-destructive">Producto no encontrado en el catálogo.</p>
        <Button variant="outline" asChild>
          <Link to="/catalog">Volver al catálogo</Link>
        </Button>
      </div>
    );
  }

  const product = detailQuery.data;
  const retired = product.deletedAt != null;
  const variants = product.variants;
  const activeVariants = variants.filter((v) => v.deletedAt == null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Button variant="outline" size="sm" asChild>
            <Link to="/catalog" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Catálogo
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">{product.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-muted-foreground">
              {product.sku}
            </span>
            <Badge variant={PRODUCT_TYPE_BADGE[product.productType]}>
              {PRODUCT_TYPE_LABELS[product.productType]}
            </Badge>
            {retired ? <Badge variant="danger">Dado de baja</Badge> : null}
          </div>
          {product.description ? (
            <p className="text-sm text-muted-foreground max-w-2xl">
              {product.description}
            </p>
          ) : null}
        </div>

        <Button
          variant="destructive"
          className="shadow-md"
          disabled={retired || retireProductMutation.isPending}
          onClick={() => setRetireProductOpen(true)}
        >
          <Archive className="mr-2 h-5 w-5" />
          Dar de baja
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DetailField label="Marca" value={product.brandName} />
        <DetailField label="Categoría" value={product.categoryName} />
        <DetailField label="Unidad" value={product.unitOfMeasureName} />
        <DetailField
          label="Precio lista"
          value={formatCurrency(
            product.listPrice.amount,
            product.listPrice.currency || CATALOG_CURRENCY,
          )}
          emphasize
        />
        <DetailField
          label="Código de barras"
          value={product.barcode ?? "—"}
        />
        <DetailField
          label="Costeo"
          value={COSTING_METHOD_LABELS[product.costingMethod]}
        />
        <DetailField
          label="Variantes vigentes"
          value={String(activeVariants.length)}
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Variantes</h2>
        </div>
        <div className="rounded-lg bg-card shadow-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead>SKU</TableHead>
                <TableHead>Atributos</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Este producto no tiene variantes.
                  </TableCell>
                </TableRow>
              ) : (
                variants.map((variant) => {
                  const variantRetired = variant.deletedAt != null;
                  return (
                    <TableRow
                      key={variant.id}
                      className="transition-colors duration-150"
                    >
                      <TableCell className="font-medium">{variant.sku}</TableCell>
                      <TableCell>
                        {formatAttributeLine(variant.attributes)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {variant.barcode ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(
                          variant.listPrice.amount,
                          variant.listPrice.currency || CATALOG_CURRENCY,
                        )}
                      </TableCell>
                      <TableCell>
                        {variantRetired ? (
                          <Badge variant="danger">Dado de baja</Badge>
                        ) : (
                          <Badge variant="success">Vigente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Dar de baja"
                          disabled={
                            retired ||
                            variantRetired ||
                            retireVariantMutation.isPending
                          }
                          onClick={() =>
                            setRetireVariant({
                              id: variant.id,
                              sku: variant.sku,
                            })
                          }
                        >
                          <Archive className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <CatalogRetireDialog
        open={retireProductOpen}
        onOpenChange={setRetireProductOpen}
        title="Dar de baja producto"
        description={`¿Confirmas la baja de «${product.name}»? Deja de ofrecerse; el histórico se conserva.`}
        pending={retireProductMutation.isPending}
        onConfirm={() => retireProductMutation.mutate()}
      />

      <CatalogRetireDialog
        open={retireVariant != null}
        onOpenChange={(open) => {
          if (!open) setRetireVariant(null);
        }}
        title="Dar de baja variante"
        description={
          retireVariant
            ? `¿Confirmas la baja de la variante ${retireVariant.sku}? El SKU queda libre tras la baja lógica.`
            : ""
        }
        pending={retireVariantMutation.isPending}
        onConfirm={() => {
          if (retireVariant) retireVariantMutation.mutate(retireVariant.id);
        }}
      />
    </div>
  );
}

function DetailField({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-xl space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={emphasize ? "text-lg font-bold" : "font-medium"}>{value}</p>
    </div>
  );
}
