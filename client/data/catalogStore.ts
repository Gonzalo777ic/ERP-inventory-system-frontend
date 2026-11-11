import {
  CATALOG_BRAND_OPTIONS,
  CATALOG_CATEGORY_OPTIONS,
  CATALOG_SEED,
} from "./catalogMock";
import type {
  CatalogFilterOption,
  CatalogListFilters,
  CatalogProductDetailDto,
  CatalogProductSummaryDto,
  CatalogVariantDto,
} from "../types/inventory/catalog";

/** In-memory catalog for local demos; soft-delete only (deletedAt). */
let products: CatalogProductDetailDto[] = structuredClone(CATALOG_SEED);

function activeVariantCount(variants: CatalogVariantDto[]): number {
  return variants.filter((v) => v.deletedAt == null).length;
}

function toSummary(product: CatalogProductDetailDto): CatalogProductSummaryDto {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    productType: product.productType,
    brandId: product.brandId,
    brandName: product.brandName,
    categoryId: product.categoryId,
    categoryName: product.categoryName,
    unitOfMeasureId: product.unitOfMeasureId,
    unitOfMeasureName: product.unitOfMeasureName,
    listPrice: product.listPrice,
    imageUrl: product.imageUrl,
    variantCount: activeVariantCount(product.variants),
    deletedAt: product.deletedAt,
  };
}

function matchesFilters(
  product: CatalogProductDetailDto,
  filters: CatalogListFilters,
): boolean {
  if (!filters.includeRetired && product.deletedAt != null) {
    return false;
  }

  const term = filters.search.trim().toLowerCase();
  if (term) {
    const inName = product.name.toLowerCase().includes(term);
    const inSku = product.sku.toLowerCase().includes(term);
    const inVariantSku = product.variants.some((v) =>
      v.sku.toLowerCase().includes(term),
    );
    if (!inName && !inSku && !inVariantSku) {
      return false;
    }
  }

  if (filters.productType !== "ALL" && product.productType !== filters.productType) {
    return false;
  }
  if (filters.brandId !== "ALL" && product.brandId !== filters.brandId) {
    return false;
  }
  if (filters.categoryId !== "ALL" && product.categoryId !== filters.categoryId) {
    return false;
  }

  const variants = activeVariantCount(product.variants);
  if (filters.variants === "WITH" && variants === 0) {
    return false;
  }
  if (filters.variants === "WITHOUT" && variants > 0) {
    return false;
  }

  return true;
}

export function listMockCatalog(
  filters: CatalogListFilters,
): CatalogProductSummaryDto[] {
  return products.filter((p) => matchesFilters(p, filters)).map(toSummary);
}

export function getMockCatalogProduct(
  id: number,
): CatalogProductDetailDto | undefined {
  const product = products.find((p) => p.id === id);
  if (!product) return undefined;
  return {
    ...product,
    variantCount: activeVariantCount(product.variants),
    variants: product.variants.map((v) => ({ ...v })),
  };
}

export function retireMockCatalogProduct(
  id: number,
  when: string = new Date().toISOString(),
): boolean {
  const product = products.find((p) => p.id === id);
  if (!product || product.deletedAt != null) {
    return false;
  }
  product.deletedAt = when;
  product.variants = product.variants.map((v) =>
    v.deletedAt == null ? { ...v, deletedAt: when } : v,
  );
  return true;
}

export function retireMockCatalogVariant(
  productId: number,
  variantId: number,
  when: string = new Date().toISOString(),
): boolean {
  const product = products.find((p) => p.id === productId);
  if (!product || product.deletedAt != null) {
    return false;
  }
  const variant = product.variants.find((v) => v.id === variantId);
  if (!variant || variant.deletedAt != null) {
    return false;
  }
  variant.deletedAt = when;
  product.variantCount = activeVariantCount(product.variants);
  return true;
}

export function getMockBrandOptions(): CatalogFilterOption[] {
  return [...CATALOG_BRAND_OPTIONS];
}

export function getMockCategoryOptions(): CatalogFilterOption[] {
  return [...CATALOG_CATEGORY_OPTIONS];
}

/** Test helper — restore seed between isolated checks if needed. */
export function resetMockCatalog(): void {
  products = structuredClone(CATALOG_SEED);
}
