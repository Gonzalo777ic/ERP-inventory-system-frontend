function readApiBase(name: "VITE_INVENTORY_API_URL" | "VITE_STORE_API_URL" | "VITE_IDENTITY_API_URL"): string {
  const value = import.meta.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`${name} no configurada.`);
  }
  return value.trim().replace(/\/$/, "");
}

export function inventoryApiBase(): string {
  return readApiBase("VITE_INVENTORY_API_URL");
}

export function storeApiBase(): string {
  return readApiBase("VITE_STORE_API_URL");
}

export function identityApiBase(): string {
  return readApiBase("VITE_IDENTITY_API_URL");
}
