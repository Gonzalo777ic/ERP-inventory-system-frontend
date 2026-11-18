


interface ImportMetaEnv {
  readonly VITE_AUTH0_DOMAIN: string;
  readonly VITE_AUTH0_CLIENT_ID: string;
  readonly VITE_AUTH0_AUDIENCE: string;
  /** Commercial API base ending in `/api`. Partners uses `${url}/partners`. */
  readonly VITE_STORE_API_URL?: string;
  /** Force Partners mock fixtures (`true`) or HTTP (`false` when store URL is set) */
  readonly VITE_PARTNERS_USE_MOCK?: string;
  /** Contabilidad mock fixtures (`true`) or HTTP (`false` when store URL is set) */
  readonly VITE_ACCOUNTING_USE_MOCK?: string;
  /** Optional accounting API base ending in `/api/accounting`. */
  readonly VITE_ACCOUNTING_API_URL?: string;
  /** Base inventory API. Stock ops uses `${url}/stock/...`. */
  readonly VITE_INVENTORY_API_URL?: string;
  /** Base identity API, the auth service `/api`. */
  readonly VITE_IDENTITY_API_URL?: string;
  /** Cloudinary cloud name for product photos. */
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string;
  /** Unsigned upload preset that receives product photos. */
  readonly VITE_CLOUDINARY_UPLOAD_PRESET?: string;
  /** Force stock ops mock fixtures (`true`) or HTTP (`false` when inventory URL is set) */
  readonly VITE_STOCK_USE_MOCK?: string;
  /** Force Purchases RFQ/OC/receipt mock store (`true`) */
  readonly VITE_PURCHASES_USE_MOCK?: string;
  /** Alias of VITE_PURCHASES_USE_MOCK */
  readonly VITE_PURCHASING_USE_MOCK?: string;
  /** Force CRM mock fixtures (`true`) or HTTP (`false` when store URL is set) */
  readonly VITE_CRM_USE_MOCK?: string;
  /** Force sales commercial mock fixtures (`true`) or HTTP (`false` when store URL is set) */
  readonly VITE_SALES_COMMERCIAL_USE_MOCK?: string;
  /** Force MRP mock fixtures (`true`) or HTTP (`false` when inventory URL is set) */
  readonly VITE_MRP_USE_MOCK?: string;
  /** Force Reports mock fixtures (`true`) or HTTP (`false` when API base is set) */
  readonly VITE_REPORTS_USE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
