import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import * as repo from '../repositories/comunidadRepository.js';
import { crearAnuncio, salirse, unirse } from '../domain/comunidad/anuncios.js';
import { empezar, inscribir, marcarGanador, validarTorneo } from '../domain/comunidad/torneos.js';

/**
 * Estado de Green Community (patrón Observer: los componentes se suscriben con useComunidad
 * y se vuelven a pintar cuando cambia). Toda regla de negocio vive en domain/comunidad;
 * el reducer solo aplica los cambios.
 */
export function comunidadReducer(s, a) {
  const cambiarAnuncio = (id, f) => ({ ...s, anuncios: s.anuncios.map((x) => (x.id === id ? f(x) : x)) });
  const cambiarTorneo = (id, f) => ({ ...s, torneos: s.torneos.map((x) => (x.id === id ? f(x) : x)) });
  switch (a.type) {
    case 'perfil':
      return { ...s, perfil: a.perfil };
    case 'publicar':
      return { ...s, anuncios: [a.anuncio, ...s.anuncios] };
    case 'unirse':
      return cambiarAnuncio(a.id, (x) => unirse(x, a.persona, { aceptaCondiciones: a.acepta }));
    case 'salirse':
      return cambiarAnuncio(a.id, (x) => salirse(x, a.nombre));
    case 'borrar':
      return { ...s, anuncios: s.anuncios.filter((x) => x.id !== a.id) };
    case 'seguir':
      return { ...s, seguidas: s.seguidas.includes(a.id) ? s.seguidas.filter((x) => x !== a.id) : [...s.seguidas, a.id] };
    case 'inscribir':
      return cambiarTorneo(a.id, (t) => inscribir(t, a.equipo));
    case 'crearTorneo': {
      const e = validarTorneo(a.torneo);
      if (e.length) throw new Error(e.join(' '));
      return { ...s, torneos: [a.torneo, ...s.torneos] };
    }
    case 'empezar':
      return cambiarTorneo(a.id, empezar);
    case 'ganador':
      return cambiarTorneo(a.id, (t) => ({ ...t, cuadro: marcarGanador(t.cuadro, a.ronda, a.partido, a.equipo) }));
    case 'reiniciar':
      return repo.reiniciar();
    default:
      throw new Error('Acción desconocida: ' + a.type);
  }
}

const Ctx = createContext(null);

export function ComunidadProvider({ children }) {
  const [estado, dispatch] = useReducer(comunidadReducer, null, repo.cargar);
  useEffect(() => repo.guardar(estado), [estado]);
  const actual = useRef(estado);
  actual.current = estado;

  const acciones = useMemo(() => ({
    /** Ejecuta una acción y devuelve el error (texto) si la regla de negocio la rechaza. */
    hacer(accion) {
      try {
        // El reducer se ejecuta aquí primero para capturar el error de la regla antes de despachar
        comunidadReducer(actual.current, accion);
        dispatch(accion);
        return null;
      } catch (e) {
        return e.message;
      }
    },
    publicar(borrador, semana) {
      try {
        const anuncio = crearAnuncio(borrador, semana);
        dispatch({ type: 'perfil', perfil: borrador.autor });
        dispatch({ type: 'publicar', anuncio });
        return { anuncio };
      } catch (e) {
        return { error: e.message };
      }
    },
  }), []);

  const valor = useMemo(() => ({ ...estado, dispatch, ...acciones }), [estado, acciones]);
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useComunidad() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useComunidad fuera de ComunidadProvider');
  return c;
}
