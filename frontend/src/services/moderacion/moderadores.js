import config from '../../data/moderacion.json';
import { analizar, combinar } from '../../domain/moderacion/reglas.js';
import { sesion } from '../storage/almacen.js';
import modeloJson from '../../data/modeloModeracion.json';
import { cargarModelo, clasificar } from '../../domain/moderacion/modelo.js';

/**
 * Moderación por capas (patrón Strategy + Composite):
 *   1. Reglas locales: instantáneas, siempre activas, bloquean lo evidente.
 *   2. Modelo propio entrenado por el equipo (n-gramas + regresión logística): entiende frases, no solo palabras.
 *   (Opcional) un LLM en un servidor de la universidad (Ollama + Qwen) para lo que se escape.
 *   3. Lo dudoso va a revisión humana (Vida universitaria); el resto se publica solo.
 * Si el modelo no responde, se sigue solo con las reglas: publicar nunca se queda colgado.
 */

export class ModeradorReglas {
  nombre = 'reglas';
  async moderar(texto) {
    return analizar(texto, config);
  }
}

const INSTRUCCIONES = `Eres el moderador de Green Community, el tablón donde alumnos de una universidad española (U-tad) publican planes.
Decide si un anuncio se puede publicar en un ámbito académico. Ten en cuenta que pueden escribir con trucos: números por letras (m4tar, f0llar), letras separadas o repetidas.
Responde SOLO con JSON: {"veredicto":"ok"|"revisar"|"bloquear","motivo":"<máx. 10 palabras>"}.
- bloquear: contenido sexual, acoso o burla hacia una persona concreta, insultos, odio, drogas, amenazas o violencia real.
- revisar: apuestas con dinero, alcohol, venta de cosas, datos personales, o si dudas.
- ok: deporte, videojuegos (aunque el juego sea violento: matar zombis, atracos en GTA), arte, estudio, quedadas normales.
Ejemplos:
«Pachanga a mediodía, faltan 3» → {"veredicto":"ok","motivo":""}
«Golpes y tiroteos en GTA VI online» → {"veredicto":"ok","motivo":""}
«Vamos a reírnos de Hugo en la cafetería» → {"veredicto":"bloquear","motivo":"burla hacia una persona concreta"}
«Voy a m4tar a Pablo cuando lo vea» → {"veredicto":"bloquear","motivo":"amenaza a una persona"}
«Quien quiera f0llar que me escriba» → {"veredicto":"bloquear","motivo":"contenido sexual"}
«Apostamos 20 € al FIFA» → {"veredicto":"revisar","motivo":"apuesta con dinero"}`;

/** Lee la respuesta del modelo y la convierte en un resultado de moderación (o null si no es válida). */
export function leerRespuesta(contenido, fuente) {
  try {
    const bruto = String(contenido).slice(0, 200);
    const salida = JSON.parse(String(contenido).match(/\{[\s\S]*\}/)?.[0] || '{}');
    if (!['ok', 'revisar', 'bloquear'].includes(salida.veredicto)) return null;
    const motivos = salida.veredicto === 'ok' ? [] : [{ categoria: 'modelo', nombre: salida.motivo || 'contenido dudoso', termino: '', accion: salida.veredicto }];
    return { veredicto: salida.veredicto, motivos, fuente, bruto };
  } catch {
    return null;
  }
}

/** Modelo local servido por Ollama (https://ollama.com): `ollama run qwen2.5:1.5b`. */
export class ModeradorOllama {
  constructor({ url, modelo, timeoutMs = 6000 }) {
    this.url = url.replace(/\/$/, '');
    this.modelo = modelo;
    this.timeoutMs = timeoutMs;
    this.nombre = `${modelo} (local)`;
  }

  async moderar(texto) {
    const control = new AbortController();
    const reloj = setTimeout(() => control.abort(), this.timeoutMs);
    try {
      const r = await fetch(this.url + '/api/chat', {
        method: 'POST',
        signal: control.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelo,
          stream: false,
          format: 'json',
          options: { temperature: 0 },
          messages: [{ role: 'system', content: INSTRUCCIONES }, { role: 'user', content: texto }],
        }),
      });
      if (!r.ok) return null;
      const j = await r.json();
      return leerRespuesta(j.message?.content, this.nombre);
    } catch {
      return null; // sin modelo, sin red o sin respuesta a tiempo: decide la capa de reglas
    } finally {
      clearTimeout(reloj);
    }
  }
}

/* ---------- Modelo propio (entrenado por el equipo, vive en el repo) ----------
   frontend/modelo/entrenar.py → src/data/modeloModeracion.json. Sin servidor, sin descargas, instantáneo. */
const MODELO = cargarModelo(modeloJson);
export const infoModelo = { ...modeloJson.metricas, ngramas: modeloJson.vocabulario.length };

export class ModeradorModelo {
  nombre = 'modelo propio';
  async moderar(texto) {
    return clasificar(MODELO, texto);
  }
}

/** Revisión instantánea (reglas + modelo propio) para avisar mientras se escribe. */
export function revisarAlMomento(texto) {
  return combinar(analizar(texto, config), clasificar(MODELO, texto));
}

export class ModeradorPorCapas {
  constructor(capas) {
    this.capas = capas;
  }

  get nombre() {
    return this.capas.map((c) => c.nombre).join(' + ');
  }

  async moderar(texto) {
    const resultados = [];
    for (const capa of this.capas) {
      const r = await capa.moderar(texto);
      resultados.push(r);
      if (r?.veredicto === 'bloquear') break; // lo evidente no necesita al modelo
    }
    return combinar(...resultados);
  }
}

/**
 * Configuración: data/moderacion.json, o para probar en local con Ollama:
 *   ?moderador=ollama&modelo=qwen2.5:1.5b   (y arrancar Ollama con OLLAMA_ORIGINS=*)
 */
export function crearModerador() {
  let llm = { ...config.llm };
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('moderador') === 'ollama') sesion.guardar('gb-moderador', { activo: true, modelo: q.get('modelo') || llm.modelo });
    llm = { ...llm, ...sesion.leer('gb-moderador', {}) };
  } catch {
    /* sin URL ni almacenamiento: configuración por defecto */
  }
  const capas = [new ModeradorReglas(), new ModeradorModelo()];
  if (llm.activo) capas.push(new ModeradorOllama(llm)); // opcional: un LLM en un servidor de la universidad
  const m = new ModeradorPorCapas(capas);
  // Para probar desde la consola del navegador: await __greenboardModerar('texto')
  if (typeof window !== 'undefined') window.__greenboardModerar = (t) => m.moderar(t);
  return m;
}

export const configModeracion = config;
