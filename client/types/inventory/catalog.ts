/**
 * Catalog DTOs for Admin ERP UI.
 * Aligns with inventory ProductView + Odoo-style type/variant fields
 * (prompts 23–30). Quantity / stock never appear here.
 */

export const CATALOG_CURRENCY = "PEN" as const;

export type CatalogProductType = "STORABLE" | "CONSUMABLE" | "SERVICE";

export type CatalogCostingMethod = "STANDARD" | "AVERAGE";

export type CatalogMoneyDto = {
  amount: number;
  currency: typeof CATALOG_CURRENCY;
};

export type CatalogAttributeValueDto = {
  attributeName: string;
  value: string;
};

export type CatalogVariantDto = {
  id: number;
  productId: number;
  sku: string;
  barcode: string | null;
  listPrice: CatalogMoneyDto;
  attributes: CatalogAttributeValueDto[];
  deletedAt: string | null;
};

export type CatalogProductSummaryDto = {
  id: number;
  sku: string;
  name: string;
  productType: CatalogProductType;
  brandId: number;
  brandName: string;
  categoryId: number;
  categoryName: string;
  unitOfMeasureId: number;
  unitOfMeasureName: string;
  listPrice: CatalogMoneyDto;
  imageUrl: string | null;
  variantCount: number;
  deletedAt: string | null;
};

export type CatalogProductDetailDto = CatalogProductSummaryDto & {
  barcode: string | null;
  costingMethod: CatalogCostingMethod;
  description: string | null;
  variants: CatalogVariantDto[];
};

/** Wire shape from GET /api/inventory/products (ProductView). */
export type InventoryProductViewDto = {
  id: number;
  sku: string;
  name: string;
  brandId: number;
  price: number;
  minStockThreshold: number;
  categoryId: number;
  unitOfMeasureId: number;
  imageUrl: string | null;
  brandName: string | null;
  categoryName: string | null;
  unitOfMeasureName: string | null;
  supplierName: string | null;
};

export type CatalogListFilters = {
  search: string;
  productType: CatalogProductType | "ALL";
  brandId: number | "ALL";
  categoryId: number | "ALL";
  variants: "ALL" | "WITH" | "WITHOUT";
  includeRetired: boolean;
};

export type CatalogFilterOption = {
  id: number;
  name: string;
};
