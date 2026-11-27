import { aMin, deMin } from './fechas.js';

/**
 * Horario semanal: { [dia 1–7]: [{h:'09:00', f:'10:30', s:'aiii', a:'Aula 201'}] }
 * Una franja: { dia, desde:'13:00', hasta:'14:30' }.
 */

export const DIA_INICIO = '08:00';
export const DIA_FIN = '22:00';

const ordenar = (clases) => [...clases].sort((x, y) => aMin(x.h) - aMin(y.h));

/** ¿Se pisan dos intervalos [a1, a2) y [b1, b2)? */
export const solapan = (a1, a2, b1, b2) => aMin(a1) < aMin(b2) && aMin(b1) < aMin(a2);

/**
 * Semana con solo las clases de las asignaturas elegidas (ids de `s`). Sin ids, devuelve la semana tal cual.
 * No muta la original: sirve para dejar fuera asignaturas de un título anterior y calcular huecos sobre lo que queda.
 */
export function filtrarSemana(semana, ids = []) {
  if (!ids.length) return semana;
  const elegidas = new Set(ids);
  return Object.fromEntries(Object.entries(semana).map(([dia, clases]) => [dia, clases.filter((c) => elegidas.has(c.s))]));
}

/** Clases de ese día que coinciden con la franja. */
export function clasesQueSolapan(semana, { dia, desde, hasta }) {
  return (semana[dia] || []).filter((c) => !c.cancelada && solapan(c.h, c.f, desde, hasta));
}

/** ¿Tengo clase en esa franja? */
export const tengoClase = (semana, franja) => clasesQueSolapan(semana, franja).length > 0;

/**
 * Huecos libres de un día entre `desde` y `hasta`, de al menos `minimo` minutos.
 * @returns {{desde:string, hasta:string, minutos:number}[]}
 */
export function huecosDelDia(clases = [], { desde = DIA_INICIO, hasta = DIA_FIN, minimo = 60 } = {}) {
  const out = [];
  let cursor = aMin(desde);
  for (const c of ordenar(clases.filter((x) => !x.cancelada))) {
    const ini = aMin(c.h);
    if (ini - cursor >= minimo) out.push({ desde: deMin(cursor), hasta: deMin(ini), minutos: ini - cursor });
    cursor = Math.max(cursor, aMin(c.f));
  }
  const fin = aMin(hasta);
  if (fin - cursor >= minimo) out.push({ desde: deMin(cursor), hasta: deMin(fin), minutos: fin - cursor });
  return out;
}

/** Franjas de `duracion` minutos cada `paso` minutos, marcadas si chocan con clase. */
export function franjasDelDia(clases = [], { desde = '09:00', hasta = '21:00', duracion = 60, paso = 30 } = {}) {
  const out = [];
  for (let m = aMin(desde); m + duracion <= aMin(hasta); m += paso) {
    const f = { desde: deMin(m), hasta: deMin(m + duracion) };
    out.push({ ...f, conClase: clases.filter((c) => !c.cancelada && solapan(c.h, c.f, f.desde, f.hasta)) });
  }
  return out;
}

/** ¿El hueco libre contiene la franja entera? */
export const cabeEnHueco = (hueco, desde, hasta) => aMin(hueco.desde) <= aMin(desde) && aMin(hasta) <= aMin(hueco.hasta);

/**
 * Del horario de clases de un día de WebUntis (sesiones con fecha) a la semana de la app.
 * @param {{d:string,h:string,f:string,asig:string,estado?:string}[]} sesiones
 * @param {(iso:string)=>number} diaDeISO lunes=1…domingo=7
 * @param {(asig:string)=>string} idDe
 */
export function semanaDesdeSesiones(sesiones, diasISO, diaDeISO, idDe) {
  const semana = {};
  for (const x of sesiones) {
    if (!diasISO.includes(x.d) || !x.asig) continue;
    (semana[diaDeISO(x.d)] ||= []).push({ h: x.h, f: x.f, s: idDe(x.asig), a: x.aula || '', cancelada: x.estado === 'cancelada' });
  }
  return semana;
}
