import { Search } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import type {
  CatalogFilterOption,
  CatalogListFilters,
  CatalogProductType,
} from "../../types/inventory/catalog";
import { PRODUCT_TYPE_LABELS } from "./catalogLabels";

const FILTER_ALL = "ALL";

type CatalogFiltersProps = {
  filters: CatalogListFilters;
  brands: CatalogFilterOption[];
  categories: CatalogFilterOption[];
  onChange: (next: CatalogListFilters) => void;
};

export function CatalogFilters({
  filters,
  brands,
  categories,
  onChange,
}: CatalogFiltersProps) {
  const patch = (partial: Partial<CatalogListFilters>) =>
    onChange({ ...filters, ...partial });

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="space-y-2 xl:col-span-2">
          <Label htmlFor="catalog-search">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="catalog-search"
              value={filters.search}
              onChange={(e) => patch({ search: e.target.value })}
              placeholder="Nombre, SKU o variante…"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={filters.productType}
            onValueChange={(value) =>
              patch({
                productType: value as CatalogProductType | typeof FILTER_ALL,
              })
            }
          >
            <SelectTrigger aria-label="Filtrar por tipo">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL}>Todos</SelectItem>
              {(Object.keys(PRODUCT_TYPE_LABELS) as CatalogProductType[]).map(
                (type) => (
                  <SelectItem key={type} value={type}>
                    {PRODUCT_TYPE_LABELS[type]}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Marca</Label>
          <Select
            value={String(filters.brandId)}
            onValueChange={(value) =>
              patch({
                brandId: value === FILTER_ALL ? FILTER_ALL : Number(value),
              })
            }
          >
            <SelectTrigger aria-label="Filtrar por marca">
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL}>Todas</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={String(brand.id)}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Categoría</Label>
          <Select
            value={String(filters.categoryId)}
            onValueChange={(value) =>
              patch({
                categoryId: value === FILTER_ALL ? FILTER_ALL : Number(value),
              })
            }
          >
            <SelectTrigger aria-label="Filtrar por categoría">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL}>Todas</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Variantes</Label>
          <Select
            value={filters.variants}
            onValueChange={(value) =>
              patch({
                variants: value as CatalogListFilters["variants"],
              })
            }
          >
            <SelectTrigger aria-label="Filtrar por variantes">
              <SelectValue placeholder="Variantes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL}>Todas</SelectItem>
              <SelectItem value="WITH">Con variantes</SelectItem>
              <SelectItem value="WITHOUT">Sin variantes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="catalog-include-retired"
          checked={filters.includeRetired}
          onCheckedChange={(checked) =>
            patch({ includeRetired: checked === true })
          }
        />
        <Label
          htmlFor="catalog-include-retired"
          className="text-sm font-normal text-muted-foreground"
        >
          Incluir dados de baja
        </Label>
      </div>
    </div>
  );
}
