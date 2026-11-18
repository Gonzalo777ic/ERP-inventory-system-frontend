import { http } from '../http';
import { uploadProductPhoto } from '../cloudinary';
import { ProductImage } from '../../types';

const API_BASE_URL = '/inventory/product-images';

type ImageWire = {
    id: number;
    productId: number;
    imageUrl: string;
    main?: boolean;
    isDefault?: boolean;
    sortOrder?: number;
};

function toProductImage(raw: ImageWire): ProductImage {
    return {
        id: raw.id,
        productId: raw.productId,
        imageUrl: raw.imageUrl,
        isDefault: raw.isDefault ?? Boolean(raw.main),
        sortOrder: raw.sortOrder ?? 0,
    };
}

export const getProductImages = async (productId: number): Promise<ProductImage[]> => {
    const response = await http.get<ImageWire[]>(`${API_BASE_URL}/product/${productId}`);
    return response.data.map(toProductImage);
};

export const uploadProductImage = async (productId: number, file: File): Promise<ProductImage> => {
    const stored = await uploadProductPhoto(file);
    const response = await http.post<ImageWire>(API_BASE_URL, {
        productId,
        imageUrl: stored.imageUrl,
        storagePath: stored.storagePath,
        contentType: stored.contentType,
        sizeBytes: stored.sizeBytes,
        fileName: stored.fileName,
    });
    return toProductImage(response.data);
};

export const deleteProductImage = async (imageId: number): Promise<void> => {
    await http.delete(`${API_BASE_URL}/${imageId}`);
};

export const setDefaultProductImage = async (imageId: number): Promise<ProductImage> => {
    const response = await http.patch<ImageWire>(`${API_BASE_URL}/${imageId}/main`);
    return toProductImage(response.data);
};

export const addProductImageFromUrl = async (productId: number, imageUrl: string): Promise<ProductImage> => {
    const response = await http.post<ImageWire>(`${API_BASE_URL}/add-url`, {
        productId,
        imageUrl,
    });
    return toProductImage(response.data);
};
