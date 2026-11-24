import config from '../../data/moderacion.json';
import { analizar, combinar } from '../../domain/moderacion/reglas.js';
import { local, sesion } from '../storage/almacen.js';

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

/* ---------- Modelo en el navegador (WebLLM + WebGPU) ----------
   Se descarga una vez (≈1 GB) a la caché del navegador y después funciona sin servidor y sin conexión.
   La librería solo se carga si se activa: no pesa en la app normal. */
const NAV = config.navegador;
const CLAVE_IA = 'gb-moderador-ia';
let motor = null;
let estadoIA = { fase: 'apagado', progreso: 0, texto: '' }; // apagado | cargando | listo | error | sin-webgpu
const oyentes = new Set();
const emitir = (cambios) => { estadoIA = { ...estadoIA, ...cambios }; oyentes.forEach((f) => f(estadoIA)); };

export const webgpuDisponible = () => typeof navigator !== 'undefined' && 'gpu' in navigator;
export const iaActivada = () => local.leerTexto(CLAVE_IA) === '1';
export function suscribirIA(f) { oyentes.add(f); f(estadoIA); return () => oyentes.delete(f); }

/** Descarga (la primera vez) y arranca Qwen en el navegador. */
export function activarIA() {
  local.guardar(CLAVE_IA, '1');
  if (motor) return motor;
  if (!webgpuDisponible()) { emitir({ fase: 'sin-webgpu' }); return Promise.resolve(null); }
  emitir({ fase: 'cargando', progreso: 0, texto: 'Preparando…' });
  motor = import('@mlc-ai/web-llm')
    .then(({ CreateMLCEngine }) => CreateMLCEngine(NAV.modelo, {
      initProgressCallback: (p) => emitir({ fase: 'cargando', progreso: p.progress, texto: p.text }),
    }))
    .then((e) => { emitir({ fase: 'listo', progreso: 1, texto: '' }); return e; })
    .catch((err) => { motor = null; emitir({ fase: 'error', texto: String(err?.message || err) }); return null; });
  return motor;
}

export function desactivarIA() {
  local.borrar(CLAVE_IA);
  motor?.then((e) => e?.unload?.());
  motor = null;
  emitir({ fase: 'apagado', progreso: 0, texto: '' });
}

export class ModeradorNavegador {
  nombre = `${NAV.nombre} (en tu navegador)`;

  async moderar(texto) {
    if (estadoIA.fase !== 'listo' || !motor) return null; // sin modelo cargado, deciden las reglas
    const e = await motor;
    if (!e) return null;
    const respuesta = e.chat.completions.create({
      messages: [{ role: 'system', content: INSTRUCCIONES }, { role: 'user', content: `Anuncio: «${texto}»` }],
      temperature: 0,
      max_tokens: 60,
      response_format: { type: 'json_object' },
    });
    const limite = new Promise((ok) => setTimeout(() => ok(null), NAV.timeoutMs));
    const r = await Promise.race([respuesta, limite]).catch(() => null);
    return r ? leerRespuesta(r.choices?.[0]?.message?.content, this.nombre) : null;
  }
}

export class ModeradorPorCapas {
  constructor(capas) {
    this.capas = capas;
  }

  get nombre() {
    return this.capas.filter((c) => !(c instanceof ModeradorNavegador) || estadoIA.fase === 'listo').map((c) => c.nombre).join(' + ');
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
  const capas = [new ModeradorReglas(), new ModeradorNavegador()];
  if (llm.activo) capas.push(new ModeradorOllama(llm));
  if (iaActivada()) activarIA(); // si ya se activó en este navegador, se carga desde la caché
  const m = new ModeradorPorCapas(capas);
  // Para probar desde la consola del navegador: await __greenboardModerar('texto')
  if (typeof window !== 'undefined') window.__greenboardModerar = (t) => m.moderar(t);
  return m;
}

export const configModeracion = config;
