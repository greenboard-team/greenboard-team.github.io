import { sesion, CLAVES } from '../services/storage/almacen.js';

export const API_PUBLICA = 'https://greenboard-mvp.utad-study-connector.workers.dev';
export const CLASSLIFE_AULAS = 'https://u-tad.classlife.education/booking';

/** ?api=http://127.0.0.1:8787 solo para probar el Worker en local; nunca otro servidor. */
export function urlApi() {
  try {
    const q = new URLSearchParams(location.search).get('api');
    if (q && /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(q)) sesion.guardar(CLAVES.api, q);
    return sesion.leerTexto(CLAVES.api)?.replace(/^"|"$/g, '') || API_PUBLICA;
  } catch {
    return API_PUBLICA;
  }
}
