import { norm, slug } from '../../domain/texto.js';
import { diaDe, diaSemana, fechaDeLaSemana, fmtDia, isoDia } from '../../domain/fechas.js';
import { semanaDesdeSesiones } from '../../domain/horario.js';

/**
 * Patrón Adapter: convierte lo que devuelve el Worker (sesiones de WebUntis y entregas de Blackboard)
 * al mismo modelo que usa la demo. Así las pantallas no distinguen si los datos son reales o de ejemplo.
 */

export const cortoAula = (x) => (x.aula ? x.aula + (x.edif && x.edif !== 'Otros' ? ' · ' + x.edif.replace('Edificio ', '') : '') : 'Sin aula');

/** Asignaturas a partir de las sesiones del horario (profesor = el que más clases da). */
export function asignaturasDesdeSesiones(sesiones, grupos) {
  const por = {};
  for (const x of sesiones) {
    if (!x.asig) continue;
    const id = slug(x.asig);
    const a = (por[id] ||= { id, n: x.asig, c: x.cod, g: new Set(), prof: {} });
    x.g.forEach((g) => a.g.add(g));
    if (x.prof) a.prof[x.prof] = (a.prof[x.prof] || 0) + 1;
  }
  return Object.values(por)
    .map((a) => ({
      id: a.id,
      n: a.n,
      c: `${a.c} · ${[...a.g].filter((g) => grupos.includes(g)).join(' + ') || [...a.g][0]}`,
      p: Object.entries(a.prof).sort((x, y) => y[1] - x[1])[0]?.[0] || '',
    }))
    .sort((x, y) => x.n.localeCompare(y.n, 'es'));
}

/**
 * @param {object} h respuesta de /app/horario  {sesiones, cambios, grupos, generado}
 * @param {object|null} bb respuesta de /app/entregas  {entregas}
 * @param {Date} ahora
 */
export function adaptarHorario(h, bb, ahora = new Date()) {
  const cambioDe = {};
  for (const c of h.cambios) (cambioDe[c.k] ||= []).push(c);
  const subjects = asignaturasDesdeSesiones(h.sesiones, h.grupos);

  // Día que enseña el horario: hoy si aún queda clase; si no, el siguiente día con clases
  const hoy = isoDia(ahora);
  const hm = String(ahora.getHours()).padStart(2, '0') + ':' + String(ahora.getMinutes()).padStart(2, '0');
  const quedan = h.sesiones.filter((x) => x.d > hoy || (x.d === hoy && x.f > hm));
  const dia = quedan[0]?.d || hoy;
  const diaClase = diaDe(dia);

  const today = h.sesiones
    .filter((x) => x.d === dia && x.asig)
    .map((x) => {
      const cs = cambioDe[x.k] || [];
      const aula = cs.find((c) => c.tipo === 'aula');
      return {
        h: x.h,
        f: x.f,
        s: slug(x.asig),
        a: cortoAula(x),
        sub: [x.prof, x.g.join(' + ')].filter(Boolean).join(' · '),
        cancelada: x.estado === 'cancelada',
        changed: cs.length > 0 || ['aula', 'adicional', 'movida', 'sustitucion'].includes(x.estado),
        cambioTxt: aula ? 'Aula nueva' + (aula.antes ? ' (antes ' + aula.antes + ')' : '') : x.estado === 'adicional' ? 'Recuperación' : cs[0]?.tipo === 'hora' ? 'Hora nueva' : 'Cambio',
      };
    });

  // Semana del día que se enseña (lunes a domingo)
  const diasISO = [1, 2, 3, 4, 5, 6, 7].map((n) => isoDia(fechaDeLaSemana(n, diaClase)));
  const semana = semanaDesdeSesiones(h.sesiones.map((x) => ({ ...x, aula: cortoAula(x) })), diasISO, (iso) => diaSemana(diaDe(iso)), slug);

  // Entregas de Blackboard: el feed no dice la asignatura; se adivina si su nombre sale en el título
  const desde = isoDia(new Date(ahora.getTime() - 14 * 864e5));
  const due = (bb?.entregas || []).filter((x) => x.d >= desde).map((x) => {
    const t = norm(x.t);
    const s = subjects.find((a) => t.includes(norm(a.n)));
    return { t: x.t, s: s ? s.id : '', d: x.d };
  });

  return {
    subjects,
    today,
    semana,
    due,
    diaClase,
    finde: dia !== hoy,
    cuandoClase: dia === hoy ? 'hoy' : 'el ' + fmtDia.format(diaClase),
    minutosAhora: dia === hoy ? ahora.getHours() * 60 + ahora.getMinutes() : -1,
    generado: new Date(h.generado).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    sesiones: h.sesiones,
    cambios: h.cambios.filter((c) => c.d >= hoy),
    grupos: h.grupos,
  };
}
