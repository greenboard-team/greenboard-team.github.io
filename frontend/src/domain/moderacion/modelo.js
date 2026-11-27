import { normalizar, sinRepetidas } from './reglas.js';

/**
 * Inferencia del modelo propio de moderación (entrenado con frontend/modelo/entrenar.py).
 * Replica exactamente lo que hace scikit-learn: n-gramas de caracteres → TF-IDF (L2) → regresión logística (softmax).
 * Es síncrono e instantáneo: sirve también para avisar mientras se escribe.
 */

/** Mismo texto que ve el modelo al entrenar. */
export const paraModelo = (texto) => sinRepetidas(normalizar(texto));

function ngramas(texto, [min, max]) {
  const out = new Map();
  for (let n = min; n <= Math.min(max, texto.length); n++) {
    for (let i = 0; i + n <= texto.length; i++) {
      const g = texto.slice(i, i + n);
      out.set(g, (out.get(g) || 0) + 1);
    }
  }
  return out;
}

/** Prepara el modelo una vez (índice del vocabulario). */
export function cargarModelo(json) {
  return { ...json, indice: new Map(json.vocabulario.map((g, i) => [g, i])) };
}

/** Probabilidades [ok, revisar, bloquear]. */
export function probabilidades(modelo, texto) {
  const x = new Map();
  for (const [g, c] of ngramas(paraModelo(texto), modelo.ngramas)) {
    const i = modelo.indice.get(g);
    if (i !== undefined) x.set(i, c * modelo.idf[i]);
  }
  const norma = Math.sqrt([...x.values()].reduce((a, v) => a + v * v, 0)) || 1;
  const logits = modelo.pesos.map((fila, k) => [...x].reduce((a, [i, v]) => a + fila[i] * (v / norma), modelo.sesgo[k]));
  const maximo = Math.max(...logits);
  const e = logits.map((l) => Math.exp(l - maximo));
  const suma = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / suma);
}

/** Veredicto con los mismos umbrales que al evaluar en Python. */
export function clasificar(modelo, texto) {
  const p = probabilidades(modelo, texto);
  const { bloquear, revisar } = modelo.umbrales;
  const veredicto = p[2] >= bloquear ? 'bloquear' : p[1] + p[2] >= revisar ? 'revisar' : 'ok';
  const nombre = veredicto === 'bloquear' ? 'contenido no apropiado para un ámbito académico' : 'contenido dudoso';
  return {
    veredicto,
    probabilidades: p,
    motivos: veredicto === 'ok' ? [] : [{ categoria: 'modelo', nombre, termino: '', accion: veredicto, confianza: Math.round((veredicto === 'bloquear' ? p[2] : p[1] + p[2]) * 100) }],
    fuente: 'modelo propio',
  };
}
