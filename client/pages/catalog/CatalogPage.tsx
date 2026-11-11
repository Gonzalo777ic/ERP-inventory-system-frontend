import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Eye, Loader2, Package } from "lucide-react";
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
import type { CatalogListFilters } from "../../types/inventory/catalog";
import { CATALOG_CURRENCY } from "../../types/inventory/catalog";
import { CatalogFilters } from "./CatalogFilters";
import { CatalogRetireDialog } from "./CatalogRetireDialog";
import { PRODUCT_TYPE_BADGE, PRODUCT_TYPE_LABELS } from "./catalogLabels";

const FILTERS_STALE_MS = 60_000;
const LIST_STALE_MS = 30_000;

const DEFAULT_FILTERS: CatalogListFilters = {
  search: "",
  productType: "ALL",
  brandId: "ALL",
  categoryId: "ALL",
  variants: "ALL",
  includeRetired: false,
};

export default function CatalogPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<CatalogListFilters>(DEFAULT_FILTERS);
  const [retireTarget, setRetireTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const brandsQuery = useQuery({
    queryKey: ["catalog", "brands"],
    queryFn: () => CatalogService.brandOptions(),
    staleTime: FILTERS_STALE_MS,
  });

  const categoriesQuery = useQuery({
    queryKey: ["catalog", "categories"],
    queryFn: () => CatalogService.categoryOptions(),
    staleTime: FILTERS_STALE_MS,
  });

  const listQuery = useQuery({
    queryKey: ["catalog", "products", filters],
    queryFn: () => CatalogService.list(filters),
    staleTime: LIST_STALE_MS,
  });

  const retireMutation = useMutation({
    mutationFn: (id: number) => CatalogService.retire(id),
    onSuccess: () => {
      toast.success("Producto dado de baja. El histórico se conserva.");
      setRetireTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
    onError: () => {
      toast.error("No se pudo dar de baja el producto.");
    },
  });

  const products = listQuery.data ?? [];
  const brands = brandsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const emptyMessage = useMemo(() => {
    if (filters.search.trim()) {
      return `No hay productos que coincidan con «${filters.search.trim()}».`;
    }
    return "No hay productos en el catálogo con estos filtros.";
  }, [filters.search]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Catálogo</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Productos, tipos y variantes. Sin cantidades de inventario.
            {CatalogService.isMockMode()
              ? " Datos locales de demo (mock)."
              : null}
          </p>
        </div>
      </div>

      <CatalogFilters
        filters={filters}
        brands={brands}
        categories={categories}
        onChange={setFilters}
      />

      <div className="rounded-lg bg-card shadow-xl overflow-hidden">
        {listQuery.isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-3">Cargando catálogo…</span>
          </div>
        ) : listQuery.isError ? (
          <p className="text-center py-10 text-destructive">
            No se pudo cargar el catálogo.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead>SKU</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-center">Variantes</TableHead>
                <TableHead className="text-right">Precio lista</TableHead>
                <TableHead className="text-center w-[120px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-10 text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const retired = product.deletedAt != null;
                  return (
                    <TableRow
                      key={product.id}
                      className="transition-colors duration-150"
                    >
                      <TableCell className="font-medium">{product.sku}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{product.name}</span>
                          {retired ? (
                            <Badge variant="danger" className="w-fit">
                              Dado de baja
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={PRODUCT_TYPE_BADGE[product.productType]}>
                          {PRODUCT_TYPE_LABELS[product.productType]}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.brandName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.categoryName}
                      </TableCell>
                      <TableCell className="text-center">
                        {product.variantCount > 0 ? (
                          <Badge variant="secondary">
                            {product.variantCount}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(
                          product.listPrice.amount,
                          product.listPrice.currency || CATALOG_CURRENCY,
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" asChild title="Ver">
                            <Link to={`/catalog/${product.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Dar de baja"
                            disabled={retired || retireMutation.isPending}
                            onClick={() =>
                              setRetireTarget({
                                id: product.id,
                                name: product.name,
                              })
                            }
                          >
                            <Archive className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <CatalogRetireDialog
        open={retireTarget != null}
        onOpenChange={(open) => {
          if (!open) setRetireTarget(null);
        }}
        title="Dar de baja producto"
        description={
          retireTarget
            ? `¿Confirmas la baja de «${retireTarget.name}»? Deja de ofrecerse; el histórico se conserva. Las variantes vigentes también se dan de baja.`
            : ""
        }
        pending={retireMutation.isPending}
        onConfirm={() => {
          if (retireTarget) retireMutation.mutate(retireTarget.id);
        }}
      />
    </div>
  );
}
