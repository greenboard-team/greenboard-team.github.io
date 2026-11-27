import { useCallback, useEffect, useState } from 'react';
import { local, CLAVES } from '../services/storage/almacen.js';

/**
 * Instalar como app (PWA). Android y Chrome: el aviso nativo (beforeinstallprompt).
 * iPhone y iPad: no hay aviso, se explica el gesto. Abierta ya como app, nada.
 */
let avisoTemprano = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); avisoTemprano = e; }, { once: true });
}

const instalada = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function useInstalar() {
  const [aviso, setAviso] = useState(avisoTemprano);
  const [cerrado, setCerrado] = useState(() => local.leerTexto(CLAVES.instalarCerrado) === '1');

  useEffect(() => {
    const antes = (e) => { e.preventDefault(); setAviso(e); };
    const hecho = () => setAviso(null);
    window.addEventListener('beforeinstallprompt', antes);
    window.addEventListener('appinstalled', hecho);
    return () => { window.removeEventListener('beforeinstallprompt', antes); window.removeEventListener('appinstalled', hecho); };
  }, []);

  const instalar = useCallback(async () => {
    if (!aviso) return false;
    aviso.prompt();
    const r = await aviso.userChoice.catch(() => null);
    setAviso(null);
    return r?.outcome === 'accepted';
  }, [aviso]);

  const cerrar = useCallback(() => { local.guardar(CLAVES.instalarCerrado, '1'); setCerrado(true); }, []);

  return { modo: instalada() ? null : aviso ? 'aviso' : esIOS() ? 'ios' : null, cerrado, instalar, cerrar };
}
