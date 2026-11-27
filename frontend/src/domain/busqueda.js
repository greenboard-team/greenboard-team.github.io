import { norm } from './texto.js';

/** Palabras que no ayudan a decidir qué acción quiere el usuario. */
export const VACIAS = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'a', 'al', 'un', 'una', 'para', 'me', 'mi', 'quiero', 'en', 'y', 'por',
  'favor', 'reservar', 'reserva', 'ver', 'hoy', 'manana', 'viernes', 'lunes', 'martes', 'miercoles', 'jueves', 'sabado', 'domingo', 'tarde']);

const limpia = (s) => norm(s).replace(/[·:]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Puntúa cada acción del catálogo con lo escrito en la barra.
 * Entiende frases como «reservar pádel viernes a las 19».
 * @param {{id:string,tipo:string,t:string,k:string,prio?:number}[]} acciones
 * @param {string} q
 * @param {number} max
 */
export function buscar(acciones, q, max = 6) {
  const nq = limpia(q);
  if (!nq) return [];
  const palabras = nq.split(/\s+/).filter((w) => w && !VACIAS.has(w) && !/^\d/.test(w));
  return acciones
    .map((a) => {
      const nt = limpia(a.t);
      const nk = norm(a.k + ' ' + a.t);
      let p = 0;
      if (nt.startsWith(nq)) p += 6;
      if (nt.includes(nq)) p += 3;
      const toks = nk.split(/[\s:·]+/);
      for (const w of palabras) {
        if (toks.some((t) => t.startsWith(w))) p += 4;
        else if (nk.includes(w)) p += 2;
      }
      if (!palabras.length && /reserv/.test(nq) && a.tipo === 'Reserva') p += 3;
      return { a, p: p > 0 ? p + (palabras.length <= 1 ? a.prio || 0 : 0) : 0 };
    })
    .filter((x) => x.p > 0)
    .sort((x, y) => y.p - x.p)
    .slice(0, max)
    .map((x) => x.a);
}

/** Día y hora que vienen en la frase («pádel viernes a las 19» → {dia:'viernes', hora:'19:00'}). */
export function parametros(q) {
  const n = norm(q);
  const r = {};
  if (/\bviernes\b/.test(n)) r.dia = 'viernes';
  else if (/\bmanana\b/.test(n)) r.dia = 'manana';
  else if (/\bhoy\b|\besta tarde\b/.test(n)) r.dia = 'hoy';
  const h = n.match(/\b(?:a las\s*)?(\d{1,2})(?::(\d{2}))?\s*(?:h\b)?/);
  if (h && +h[1] >= 7 && +h[1] <= 22) r.hora = String(h[1]).padStart(2, '0') + ':' + (h[2] || '00');
  return r;
}

/** Trozos de texto con la parte buscada marcada, para pintarlos con <mark>. */
export function resaltar(t, q) {
  const w = norm(q).trim().split(/\s+/).filter((x) => x.length > 1 && !VACIAS.has(x))[0];
  if (!w) return [{ t, m: false }];
  const i = norm(t).indexOf(w);
  if (i < 0) return [{ t, m: false }];
  return [{ t: t.slice(0, i), m: false }, { t: t.slice(i, i + w.length), m: true }, { t: t.slice(i + w.length), m: false }];
}
