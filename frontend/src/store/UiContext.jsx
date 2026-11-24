import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { sesion, CLAVES } from '../services/storage/almacen.js';

/**
 * Estado de la interfaz de la demo (lo que antes era la variable global S):
 * tarjetas abiertas en Inicio, justificante, reservas de ejemplo, chats y guía.
 * Se guarda en sessionStorage, como antes, para que recargar no pierda la demo.
 */
export const UI_INICIAL = {
  archivo: null,
  justificado: false,
  com: {},
  mat: false,
  guia: true,
  avisoCerrado: false,
  abiertas: [],
  padel: { dia: null, hora: null, hecho: null },
  aula: { dia: 'hoy', hora: '16:00', hecho: null },
  aulaTodas: false,
  usoBarra: false,
  chats: {},
  leidos: {},
};

export function uiReducer(s, a) {
  switch (a.type) {
    case 'cambiar':
      return { ...s, ...(typeof a.cambios === 'function' ? a.cambios(s) : a.cambios) };
    case 'abrir':
      return { ...s, abiertas: [a.id, ...s.abiertas.filter((x) => x !== a.id)], usoBarra: true, ...(a.extra || {}) };
    case 'cerrar':
      return { ...s, abiertas: s.abiertas.filter((x) => x !== a.id) };
    case 'leido':
      return s.leidos[a.id] ? s : { ...s, leidos: { ...s.leidos, [a.id]: true } };
    case 'mensaje':
      return { ...s, leidos: { ...s.leidos, [a.id]: true }, chats: { ...s.chats, [a.id]: [...(s.chats[a.id] || []), a.msg] } };
    case 'apuntarCom':
      return { ...s, com: { ...s.com, [a.id]: true } };
    case 'reiniciar':
      return structuredClone(UI_INICIAL);
    default:
      throw new Error('Acción desconocida: ' + a.type);
  }
}

const Ctx = createContext(null);

export function UiProvider({ children }) {
  const [ui, dispatch] = useReducer(uiReducer, null, () => ({ ...structuredClone(UI_INICIAL), ...sesion.leer(CLAVES.estadoDemo, {}) }));
  useEffect(() => sesion.guardar(CLAVES.estadoDemo, ui), [ui]);

  const [toast, setToast] = useState(null);
  const temporizador = useRef();
  const avisar = useCallback((texto) => {
    setToast(texto);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const valor = useMemo(() => ({ ui, dispatch, toast, avisar }), [ui, toast, avisar]);
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useUi() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useUi fuera de UiProvider');
  return c;
}
