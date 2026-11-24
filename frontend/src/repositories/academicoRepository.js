import asignaturas from '../data/asignaturas.json';
import comunidad from '../data/comunidad.json';
import reservas from '../data/reservas.json';
import horarioSemana from '../data/horarioSemana.json';
import { corto } from '../domain/texto.js';
import { diaSemana, fmtDia } from '../domain/fechas.js';
import { adaptarHorario } from '../services/adapters/webuntisAdapter.js';

/**
 * Patrón Repository: las pantallas piden «lo académico» y reciben siempre el mismo modelo,
 * venga de los JSON de ejemplo (demo) o del Worker con WebUntis y Blackboard (real).
 *
 * Modelo:
 * { fuente, nombre, subjects, due, today, semana, asis, asisDef, asisId, contenido, notas, chats,
 *   apuntes, padel, aulas, diaClase, finde, cuandoClase, minutosAhora, real? }
 */

/** Cada asignatura tiene su chat de clase; las que no traen mensajes de ejemplo arrancan con uno de bienvenida. */
export function chatsConAsignaturas(chatsBase, subjects) {
  const chats = chatsBase.map((c) => ({ ...c, msgs: [...c.msgs] }));
  subjects.forEach((s) => {
    if (!chats.some((c) => c.id === s.id)) {
      chats.push({
        id: s.id, s: s.id, t: corto(s) + ' · clase', n: 30, sinLeer: 0,
        msgs: [{ de: 'Delegación de clase', h: 'lun', txt: `Chat de la clase de ${corto(s)}: dudas, avisos y material.` }],
      });
    }
  });
  return chats;
}

const comunes = () => ({
  asisDef: asignaturas.asistenciaPorDefecto,
  contenido: asignaturas.contenido,
  notas: asignaturas.notas,
  apuntes: comunidad.comunidad,
  padel: reservas.padel,
  aulas: reservas.aulas,
});

export function academicoDemo(ahora = new Date()) {
  const finde = [0, 6].includes(ahora.getDay());
  const diaClase = new Date(ahora);
  if (finde) diaClase.setDate(diaClase.getDate() + (diaClase.getDay() === 6 ? 2 : 1));
  // La semana de ejemplo, con el día que se enseña en Inicio igual que la tarjeta de horario
  const semana = { ...horarioSemana.semana, [diaSemana(diaClase)]: asignaturas.hoy };
  return {
    ...comunes(),
    fuente: 'demo',
    nombre: 'Gonzalo',
    nombreCompleto: 'Gonzalo Martínez Fernández',
    curso: '4.º MAIS + FIIS',
    subjects: asignaturas.asignaturas,
    due: asignaturas.entregas,
    today: asignaturas.hoy,
    semana,
    asis: asignaturas.asistencia,
    asisId: 'aiii',
    chats: chatsConAsignaturas(comunidad.chats, asignaturas.asignaturas),
    diaClase,
    finde,
    cuandoClase: finde ? 'el lunes' : 'hoy',
    minutosAhora: finde ? -1 : ahora.getHours() * 60 + ahora.getMinutes(),
    real: null,
  };
}

/**
 * @param {{correo:string, grupos:string[], blackboard:boolean}} yo
 * @param {object} horario respuesta de /app/horario
 * @param {object|null} bb respuesta de /app/entregas
 * @param {string|null} bbError
 */
export function academicoReal(yo, horario, bb, bbError = null, ahora = new Date()) {
  const a = adaptarHorario(horario, bb, ahora);
  const nombre = yo.correo.split('@')[0].split(/[._-]/)[0].replace(/^./, (c) => c.toUpperCase());
  const asisId = a.subjects[0]?.id || 'x';
  return {
    ...comunes(),
    fuente: 'real',
    nombre,
    nombreCompleto: nombre,
    curso: a.grupos.join(' + '),
    subjects: a.subjects,
    due: a.due,
    today: a.today,
    semana: a.semana,
    asis: { [asisId]: [{ dias: 1, v: 0 }, { dias: 3, v: 1 }, { dias: 8, v: 1 }, { dias: 10, v: 1 }, { dias: 15, v: 1 }] },
    asisId,
    chats: chatsConAsignaturas(comunidad.chats, a.subjects),
    diaClase: a.diaClase,
    finde: a.finde,
    cuandoClase: a.cuandoClase,
    minutosAhora: a.minutosAhora,
    real: {
      correo: yo.correo,
      grupos: a.grupos,
      bb: !!bb,
      bbError,
      generado: a.generado,
      sesiones: a.sesiones,
      cambios: a.cambios,
    },
  };
}

/* Consultas sobre el modelo (las usan varias pantallas) */
export const asignatura = (m, id) => m.subjects.find((s) => s.id === id) || { id: '', n: 'Blackboard', c: '' };
export const sesionesAsistencia = (m, id) => m.asis[id] || m.asisDef;
export const sinLeer = (m, leidos) => m.chats.reduce((a, c) => a + (leidos[c.id] ? 0 : c.sinLeer), 0);
export const tituloHorario = (m) => (m.real ? (m.finde ? 'Próximas clases' : 'Horario de hoy') : m.finde ? 'Horario del lunes' : 'Horario de hoy');
export const fechaCambio = (c) => fmtDia.format(new Date(c.d + 'T12:00'));
