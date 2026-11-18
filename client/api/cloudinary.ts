export type CloudinaryPhoto = {
  imageUrl: string;
  storagePath: string;
  contentType: string;
  sizeBytes: number;
  fileName: string;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  bytes?: number;
};

function cloudinaryConfig(): { cloudName: string; uploadPreset: string } {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();
  if (!cloudName || !uploadPreset) {
    throw new Error(
      "VITE_CLOUDINARY_CLOUD_NAME o VITE_CLOUDINARY_UPLOAD_PRESET no configuradas.",
    );
  }
  return { cloudName, uploadPreset };
}

export async function uploadProductPhoto(file: File): Promise<CloudinaryPhoto> {
  const { cloudName, uploadPreset } = cloudinaryConfig();
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body },
  );
  if (!response.ok) {
    throw new Error("Cloudinary no aceptó la imagen.");
  }
  const payload = (await response.json()) as CloudinaryUploadResponse;
  if (!payload.secure_url || !payload.public_id) {
    throw new Error("Cloudinary no devolvió la dirección de la imagen.");
  }
  return {
    imageUrl: payload.secure_url,
    storagePath: payload.public_id,
    contentType: file.type,
    sizeBytes: payload.bytes ?? file.size,
    fileName: file.name,
  };
}
