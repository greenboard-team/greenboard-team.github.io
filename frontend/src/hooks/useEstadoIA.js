import { useEffect, useState } from 'react';
import { suscribirIA } from '../services/moderacion/moderadores.js';

/** Estado del modelo de moderación en el navegador: apagado, cargando (con %), listo, error o sin WebGPU. */
export function useEstadoIA() {
  const [estado, setEstado] = useState({ fase: 'apagado', progreso: 0, texto: '' });
  useEffect(() => suscribirIA(setEstado), []);
  return estado;
}
