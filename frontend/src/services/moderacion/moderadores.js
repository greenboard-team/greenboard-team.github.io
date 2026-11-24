import config from '../../data/moderacion.json';
import { analizar, combinar } from '../../domain/moderacion/reglas.js';
import { sesion } from '../storage/almacen.js';

/**
 * Moderación por capas (patrón Strategy + Composite):
 *   1. Reglas locales: instantáneas, siempre activas, bloquean lo evidente.
 *   2. Modelo local (Ollama + Qwen u otro): opcional, para lo que las reglas no ven.
 *   3. Lo dudoso va a revisión humana (Vida universitaria); el resto se publica solo.
 * Si el modelo no responde, se sigue solo con las reglas: publicar nunca se queda colgado.
 */

export class ModeradorReglas {
  nombre = 'reglas';
  async moderar(texto) {
    return analizar(texto, config);
  }
}

const INSTRUCCIONES = `Eres el moderador de Green Community, el tablón de planes entre alumnos de una universidad española.
Decide si un anuncio se puede publicar. Responde SOLO con JSON: {"veredicto":"ok"|"revisar"|"bloquear","motivo":"<máx. 12 palabras>"}.
- bloquear: contenido sexual, acoso o burlas sobre una persona concreta, insultos, odio, drogas, violencia real.
- revisar: apuestas con dinero, alcohol, venta de cosas, datos personales, o si dudas.
- ok: deporte, videojuegos (aunque el juego sea violento), arte, estudio, quedadas normales.`;

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
      const salida = JSON.parse(j.message?.content || '{}');
      if (!['ok', 'revisar', 'bloquear'].includes(salida.veredicto)) return null;
      const motivos = salida.veredicto === 'ok' ? [] : [{ categoria: 'modelo', nombre: salida.motivo || 'contenido dudoso', termino: '', accion: salida.veredicto }];
      return { veredicto: salida.veredicto, motivos, fuente: this.nombre };
    } catch {
      return null; // sin modelo, sin red o sin respuesta a tiempo: decide la capa de reglas
    } finally {
      clearTimeout(reloj);
    }
  }
}

export class ModeradorPorCapas {
  constructor(capas) {
    this.capas = capas;
    this.nombre = capas.map((c) => c.nombre).join(' + ');
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
  const capas = [new ModeradorReglas()];
  if (llm.activo) capas.push(new ModeradorOllama(llm));
  return new ModeradorPorCapas(capas);
}

export const configModeracion = config;
