import { http } from '../http';
import { Product, ProductListItem } from '../../types';

type ProductWire = {
    id: number;
    sku: string;
    name: string;
    brandId: number;
    categoryId: number;
    unitOfMeasureId: number;
    price?: number;
    listPrice?: { amount?: number | string | null } | null;
    minStockThreshold?: number;
    imageUrl?: string;
    brandName?: string;
    supplierName?: string;
    categoryName?: string;
    unitOfMeasureName?: string;
};

function listedPrice(raw: ProductWire): number {
    const amount = raw.listPrice?.amount ?? raw.price;
    const price = amount == null || amount === "" ? Number.NaN : Number(amount);
    return Number.isFinite(price) ? price : 0;
}

function toListItem(raw: ProductWire): ProductListItem {
    return {
        id: raw.id,
        sku: raw.sku,
        name: raw.name,
        imageUrl: raw.imageUrl,
        brandId: raw.brandId,
        categoryId: raw.categoryId,
        unitOfMeasureId: raw.unitOfMeasureId,
        price: listedPrice(raw),
        minStockThreshold: raw.minStockThreshold ?? 0,
        brandName: raw.brandName ?? "",
        supplierName: raw.supplierName ?? "",
        categoryName: raw.categoryName ?? "",
        unitOfMeasureName: raw.unitOfMeasureName ?? "",
    };
}

const API_BASE_URL = '/inventory/products';

/**
 * Servicio de API para gestionar las operaciones CRUD de la entidad Product.
 * * NOTA: La entidad Product ahora se define únicamente por sus datos maestros (incluyendo FKs).
 * La información de Stock (InventoryItem) se gestiona a través de otro servicio.
 */


export const getProducts = async (): Promise<ProductListItem[]> => {
    try {
        const response = await http.get<ProductWire[]>(API_BASE_URL);
        return response.data.map(toListItem);
    } catch (error) {
        console.error("[Products API]  Error al obtener productos:", error);
        throw error;
    }
};



export const createProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {

    const response = await http.post<Product>(API_BASE_URL, productData);
    return response.data;
};



export const updateProduct = async (id: number, productData: Omit<Product, 'id'>): Promise<Product> => {

    const response = await http.put<Product>(`${API_BASE_URL}/${id}`, productData);
    return response.data;
};


export const deleteProduct = async (id: number): Promise<void> => {
    await http.delete(`${API_BASE_URL}/${id}`);
};


export const getProductById = async (id: number): Promise<Product> => {
    const response = await http.get<Product>(`${API_BASE_URL}/${id}`);
    return response.data;
};
