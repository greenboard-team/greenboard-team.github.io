import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUi } from '../store/UiContext.jsx';
import { useAcademico } from '../store/SesionContext.jsx';
import { parametros } from '../domain/busqueda.js';
import { diasReserva } from '../domain/fechas.js';

/** Lo que ya está en el panel de Inicio no se duplica: se lleva hasta su tarjeta y se resalta. */
const EN_PANEL = { horario: 't-horario', justificante: 't-asis', entregas: 't-entregas' };

const resaltar = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el.classList.add('accion');
  setTimeout(() => el.classList.remove('accion'), 1800);
};

/**
 * Abre una acción del catálogo: una ruta, una tarjeta ya presente en Inicio, o una tarjeta nueva arriba del panel.
 * @returns {(accion: {id:string, ruta?:string}, q?:string) => void}
 */
export function useAbrir() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { ui, dispatch } = useUi();
  const m = useAcademico();

  return useCallback((accion, q) => {
    const { id, ruta } = typeof accion === 'string' ? { id: accion } : accion;
    if (ruta) { navigate(ruta); return; }
    if (EN_PANEL[id]) {
      if (pathname !== '/inicio') { navigate('/inicio'); setTimeout(() => resaltar(EN_PANEL[id]), 80); } else resaltar(EN_PANEL[id]);
      return;
    }
    const extra = {};
    if (q) {
      const p = parametros(q);
      if (id === 'padel') extra.padel = { ...ui.padel, ...(p.dia && { dia: p.dia }), ...(p.hora && m.padel.horas.includes(p.hora) && { hora: p.hora }) };
      if (id === 'aula') extra.aula = { ...ui.aula, ...(p.dia && { dia: p.dia }), ...(p.hora && m.aulas.horas.includes(p.hora) && { hora: p.hora }) };
    }
    if (id === 'padel' && !(extra.padel || ui.padel).dia) {
      extra.padel = { ...(extra.padel || ui.padel), dia: diasReserva().some((d) => d.k === 'viernes') ? 'viernes' : 'hoy' };
    }
    dispatch({ type: 'abrir', id, extra });
    if (pathname !== '/inicio') navigate('/inicio');
    requestAnimationFrame(() => document.getElementById('a-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }, [navigate, pathname, ui.padel, ui.aula, dispatch, m.padel.horas, m.aulas.horas]);
}
