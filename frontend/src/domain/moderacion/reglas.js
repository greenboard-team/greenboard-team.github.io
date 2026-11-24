/**
 * Filtro local de moderación: instantáneo, sin red y sin modelo.
 * Normaliza los trucos habituales para colarlo («F0LLA», «fooolla», «f o l l a», «fóllá»)
 * y compara con la lista de data/moderacion.json.
 *
 * Resultado: { veredicto: 'ok'|'revisar'|'bloquear', motivos: [{categoria, nombre, termino}], fuente: 'reglas' }
 */

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's', '€': 'e' };
export const GRAVEDAD = { ok: 0, revisar: 1, bloquear: 2 };

/** Minúsculas, sin tildes, sin «leetspeak» y solo letras/números separados por un espacio. */
export function normalizar(texto) {
  const base = String(texto ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[013457@$€]/g, (c) => LEET[c])
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  // «f o l l a» → «folla»: tres o más letras sueltas seguidas se juntan
  return base.replace(/\b(?:[a-z] ){2,}[a-z]\b/g, (m) => m.replace(/ /g, ''));
}

/**
 * Quita letras alargadas («fooolla» → «folla», «follllaa» → «folla») sin romper las dobles del español
 * («folleto», «perro» siguen igual): vocales repetidas → una; tres o más consonantes iguales → dos.
 */
export const sinRepetidas = (s) => s.replace(/([aeiou])\1+/g, '$1').replace(/([^aeiou\s])\1{2,}/g, '$1$1');

function coincide(tokens, frase, termino) {
  const t = sinRepetidas(termino.t);
  if (termino.t.includes(' ')) return (' ' + sinRepetidas(frase) + ' ').includes(' ' + t + ' ');
  return tokens.some((tok) => (termino.prefijo ? tok.startsWith(t) : tok === t));
}

const TELEFONO = /(?:^|\D)(?:\+?34[\s.-]?)?[6789](?:[\s.-]?\d){8}(?!\d)/;
const CORREO = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;

/**
 * @param {string} texto
 * @param {{categorias: {id,nombre,accion,terminos:{t,prefijo?}[]}[]}} config
 */
export function analizar(texto, config) {
  const frase = normalizar(texto);
  const tokens = frase.split(' ').filter(Boolean).map(sinRepetidas);
  const motivos = [];
  for (const c of config.categorias) {
    const t = c.terminos.find((x) => coincide(tokens, frase, x));
    if (t) motivos.push({ categoria: c.id, nombre: c.nombre, termino: t.t, accion: c.accion });
  }
  // Datos personales: mejor por chat de Greenboard que en un anuncio público
  if (TELEFONO.test(String(texto))) motivos.push({ categoria: 'datos', nombre: 'un teléfono', termino: 'teléfono', accion: 'revisar' });
  if (CORREO.test(String(texto))) motivos.push({ categoria: 'datos', nombre: 'un correo', termino: 'correo', accion: 'revisar' });

  const veredicto = motivos.reduce((v, m) => (GRAVEDAD[m.accion] > GRAVEDAD[v] ? m.accion : v), 'ok');
  return { veredicto, motivos, fuente: 'reglas' };
}

/** El peor de varios resultados (si uno bloquea, se bloquea). */
export function combinar(...resultados) {
  const validos = resultados.filter(Boolean);
  const peor = validos.reduce((a, b) => (GRAVEDAD[b.veredicto] > GRAVEDAD[a.veredicto] ? b : a), { veredicto: 'ok', motivos: [], fuente: 'reglas' });
  // Quién ha revisado de verdad (para el registro): «reglas + Qwen 2.5 1.5B (en tu navegador)»
  const fuente = [...new Set(validos.map((r) => r.fuente))].join(' + ') || 'reglas';
  return { ...peor, fuente, motivos: validos.flatMap((r) => r.motivos), ...(validos.find((r) => r.bruto) && { bruto: validos.find((r) => r.bruto).bruto }) };
}

/** Frase para el usuario: «No se puede publicar: contenido sexual e insultos.» */
export function explicar(r) {
  const nombres = [...new Set(r.motivos.filter((m) => m.accion === r.veredicto || r.veredicto === 'bloquear').map((m) => m.nombre))];
  const lista = nombres.length > 1 ? nombres.slice(0, -1).join(', ') + ' y ' + nombres.at(-1) : nombres[0] || 'contenido no permitido';
  if (r.veredicto === 'bloquear') return `No se puede publicar: tiene ${lista}. Green Community es para planes con gente de la uni; cámbialo y vuelve a intentarlo.`;
  if (r.veredicto === 'revisar') return `Se publicará cuando lo revise Vida universitaria (menciona ${lista}).`;
  return '';
}
