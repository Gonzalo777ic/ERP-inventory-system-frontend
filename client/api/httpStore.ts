import axios from "axios";

/**
 * Cliente Axios del servicio comercial (ventas, caja, contabilidad e impuestos).
 * La URL sale de VITE_STORE_API_URL en cada llamada.
 */
export const httpStore = axios.create({});

