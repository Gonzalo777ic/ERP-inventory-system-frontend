import { http } from "../http";
import {
  getMockBrandOptions,
  getMockCatalogProduct,
  getMockCategoryOptions,
  listMockCatalog,
  retireMockCatalogProduct,
  retireMockCatalogVariant,
} from "../../data/catalogStore";
import {
  CATALOG_CURRENCY,
  type CatalogFilterOption,
  type CatalogListFilters,
  type CatalogProductDetailDto,
  type CatalogProductSummaryDto,
  type InventoryProductViewDto,
} from "../../types/inventory/catalog";

const INVENTORY_PRODUCTS_PATH = "/inventory/products";
const MOCK_LATENCY_MS = 120;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Demo default: local mock (variants + types) unless mock is explicitly off.
 * Inventory ProductView has no variants yet — HTTP is opt-in.
 */
export function catalogUseMock(): boolean {
  if (import.meta.env.VITE_CATALOG_USE_MOCK === "false") return false;
  return true;
}

function mapInventoryView(
  view: InventoryProductViewDto,
): CatalogProductSummaryDto {
  return {
    id: view.id,
    sku: view.sku,
    name: view.name,
    productType: "STORABLE",
    brandId: view.brandId,
    brandName: view.brandName ?? "—",
    categoryId: view.categoryId,
    categoryName: view.categoryName ?? "—",
    unitOfMeasureId: view.unitOfMeasureId,
    unitOfMeasureName: view.unitOfMeasureName ?? "—",
    listPrice: { amount: Number(view.price), currency: CATALOG_CURRENCY },
    imageUrl: view.imageUrl,
    variantCount: 0,
    deletedAt: null,
  };
}

function applyClientFilters(
  items: CatalogProductSummaryDto[],
  filters: CatalogListFilters,
): CatalogProductSummaryDto[] {
  const term = filters.search.trim().toLowerCase();
  return items.filter((p) => {
    if (!filters.includeRetired && p.deletedAt != null) return false;
    if (term) {
      const hit =
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term);
      if (!hit) return false;
    }
    if (filters.productType !== "ALL" && p.productType !== filters.productType) {
      return false;
    }
    if (filters.brandId !== "ALL" && p.brandId !== filters.brandId) {
      return false;
    }
    if (filters.categoryId !== "ALL" && p.categoryId !== filters.categoryId) {
      return false;
    }
    if (filters.variants === "WITH" && p.variantCount === 0) return false;
    if (filters.variants === "WITHOUT" && p.variantCount > 0) return false;
    return true;
  });
}

/**
 * Typed catalog client. Mock by default (DTO shapes for UI + variants).
 * Set VITE_CATALOG_USE_MOCK=false to hit inventory product endpoints.
 */
export const CatalogService = {
  isMockMode: (): boolean => catalogUseMock(),

  async list(filters: CatalogListFilters): Promise<CatalogProductSummaryDto[]> {
    if (catalogUseMock()) {
      await delay(MOCK_LATENCY_MS);
      return listMockCatalog(filters);
    }
    const response = await http.get<InventoryProductViewDto[]>(
      INVENTORY_PRODUCTS_PATH,
    );
    return applyClientFilters(response.data.map(mapInventoryView), filters);
  },

  async getById(id: number): Promise<CatalogProductDetailDto> {
    if (catalogUseMock()) {
      await delay(MOCK_LATENCY_MS);
      const mock = getMockCatalogProduct(id);
      if (!mock) {
        throw new Error(`Producto de catálogo ${id} no encontrado`);
      }
      return mock;
    }
    const response = await http.get<InventoryProductViewDto>(
      `${INVENTORY_PRODUCTS_PATH}/${id}`,
    );
    const summary = mapInventoryView(response.data);
    return {
      ...summary,
      barcode: null,
      costingMethod: "STANDARD",
      description: null,
      variants: [],
    };
  },

  async retire(id: number): Promise<void> {
    if (catalogUseMock()) {
      await delay(MOCK_LATENCY_MS);
      if (!retireMockCatalogProduct(id)) {
        throw new Error("No se pudo dar de baja el producto");
      }
      return;
    }
    await http.delete(`${INVENTORY_PRODUCTS_PATH}/${id}`);
  },

  async retireVariant(productId: number, variantId: number): Promise<void> {
    await delay(MOCK_LATENCY_MS);
    if (!retireMockCatalogVariant(productId, variantId)) {
      throw new Error("No se pudo dar de baja la variante");
    }
  },

  async brandOptions(): Promise<CatalogFilterOption[]> {
    if (catalogUseMock()) {
      await delay(MOCK_LATENCY_MS);
      return getMockBrandOptions();
    }
    const response = await http.get<{ id: number; name: string }[]>(
      "/inventory/brands",
    );
    return response.data.map((b) => ({ id: b.id, name: b.name }));
  },

  async categoryOptions(): Promise<CatalogFilterOption[]> {
    if (catalogUseMock()) {
      await delay(MOCK_LATENCY_MS);
      return getMockCategoryOptions();
    }
    const response = await http.get<{ id: number; name: string }[]>(
      "/inventory/categories",
    );
    return response.data.map((c) => ({ id: c.id, name: c.name }));
  },
};
