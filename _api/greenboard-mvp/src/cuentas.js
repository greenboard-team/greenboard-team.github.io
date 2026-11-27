// Datos reales de la app (/mvp/), solo para alumnos de U-tad. Todo cuelga de /app/ y pide sesión,
// salvo entrar. Nada real se puede leer desde la página pública de github.io sin haber entrado.
//
//   POST   /app/entrar       {correo, codigo?}  -> con código de invitación: {ok, token}. Con enlace: {ok, modo:"enlace"}
//   POST   /app/verificar    {enlace}           -> {ok, token}   (el enlace mágico del correo, de un solo uso, 15 min)
//   POST   /app/salir                           -> cierra la sesión
//   GET    /app/yo                              -> {correo, grupos, blackboard: bool}
//   GET    /app/grupos                          -> {grupos: {MAIS4A: "MATEMÁTICAS + …"}, generado}
//   PUT    /app/grupos       {grupos: [..]}     -> guarda los grupos elegidos (1-3)
//   GET    /app/horario                         -> {generado, sesiones, cambios} de tus grupos
//   GET    /app/aulas?dia=&desde=&hasta=        -> aulas sin clase en ese hueco, según el horario de WebUntis
//   PUT    /app/blackboard   {url}              -> guarda tu enlace de calendario de Blackboard (lo prueba antes)
//   DELETE /app/blackboard                      -> lo olvida
//   GET    /app/entregas                        -> {entregas, eventos} leídos de tu calendario de Blackboard
//   GET    /app/admin/codigos                   -> (ADMIN_TOKEN) cada código vigente y el correo que lo usa
//   DELETE /app/admin/usuario?correo=           -> (ADMIN_TOKEN) borra los datos y sesiones de esa persona
//
// Sesión: cabecera Authorization: Bearer <token>. El token no se guarda en claro (solo su SHA-256).
// El enlace de Blackboard es un secreto de cada alumno: no se escribe nunca en los logs ni se devuelve.
//
// Entrar: el correo tiene que ser de alumno (DOMINIOS, por defecto live.u-tad.com). Dos modos:
//   - código de invitación (INVITE_CODES, secreto "codigo1,codigo2,…"): uno por persona; cada código queda ligado al
//     primer correo que lo usa. Quitar un código de INVITE_CODES le quita el acceso a esa persona en su siguiente
//     petición (las sesiones abiertas con él dejan de valer). Sirve ya, sin cuentas nuevas, para la prueba.
//   - enlace mágico por correo, si hay RESEND_API_KEY y MAIL_FROM (necesita una cuenta de envío: decide Dmitrii).
//
// Datos: los genera el pipeline de Dmitrii a diario y los publica en su gist secreto (DATA_BASE, secreto):
// groups.json (horario de todos los grupos de WebUntis + cambios) y rooms.json (ocupación de las aulas).

const SESION_DIAS = 30;
const ENLACE_MIN = 15;
// Un alumno puede tener clase en varios grupos (optativas, asignaturas de otro curso o cambio de titulación).
const MAX_GRUPOS = 8;
const APP_URL = "https://greenboard-team.github.io/mvp/";

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});

async function sha256(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
const aleatorio = () => {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const iguales = (a, b) => {           // comparación en tiempo constante para los códigos
  if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};

export function correoValido(correo, dominios) {
  const c = String(correo || "").trim().toLowerCase();
  const m = c.match(/^[a-z0-9._%+-]{1,64}@([a-z0-9.-]+)$/);
  return m && dominios.includes(m[1]) ? c : null;
}

/** ¿Esta sesión entra en el horario del alumno? Si eligió grupo para la asignatura, manda esa elección. */
export function tocaSesion(x, grupos, materias = {}) {
  const clave = x.cod || x.asig;
  const elegido = clave && materias[clave];
  if (elegido) return (x.g || []).includes(elegido);
  return (x.g || []).some((g) => grupos.includes(g));
}

/**
 * Asignaturas que varios de los grupos elegidos dan en franjas distintas (p. ej. PRO3 a las 15:00 en
 * FIIS4A y a las 09:00 en INSO3D). El alumno elige con qué grupo cursa cada una.
 */
export function conflictosDeGrupos(datos, grupos) {
  const sel = new Set(grupos);
  const por = new Map();
  for (const x of datos?.sessions || []) {
    const clave = x.cod || x.asig;
    if (!clave) continue;
    const suyos = (x.g || []).filter((g) => sel.has(g));
    if (!suyos.length) continue;
    const e = por.get(clave) || { cod: x.cod || "", asig: x.asig || clave, franjas: new Map() };
    for (const g of suyos) {
      const f = e.franjas.get(g) || new Map();
      f.set(`${x.d}|${x.h}|${x.f}`, { d: x.d, h: x.h, f: x.f, aula: x.aula || "" });
      e.franjas.set(g, f);
    }
    por.set(clave, e);
  }
  const out = [];
  for (const [clave, e] of por) {
    if (e.franjas.size < 2) continue;
    const patrones = new Set([...e.franjas.values()].map((f) =>
      [...new Set([...f.values()].map((m) => `${m.h}-${m.f}`))].sort().join("|")));
    if (patrones.size < 2) continue;   // mismo horario en ambos grupos: no hay nada que elegir
    out.push({
      clave, cod: e.cod, asig: e.asig,
      opciones: grupos.filter((g) => e.franjas.has(g)).map((g) => {
        const ms = [...e.franjas.get(g).values()].sort((a, b) => a.d.localeCompare(b.d) || a.h.localeCompare(b.h));
        return { grupo: g, muestras: ms.slice(0, 2) };
      }),
    });
  }
  return out;
}

// --- Datos del pipeline (gist), con copia en memoria 5 min y la última buena si el gist no contesta ---
const cache = new Map();
async function dato(env, nombre) {
  const hit = cache.get(nombre);
  if (hit && Date.now() - hit.at < 5 * 60e3) return hit.data;
  try {
    const r = await fetch(`${env.DATA_BASE}/${nombre}`, { cf: { cacheTtl: 300 } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    cache.set(nombre, { at: Date.now(), data });
    return data;
  } catch (e) {
    console.error(`datos: ${nombre} no responde (${e.message})`);   // sin URL: DATA_BASE es secreta
    if (hit) return hit.data;
    throw new Error("datos");
  }
}

// --- Aulas libres: una aula está libre en [desde, hasta) si ninguna reserva de WebUntis la pisa ---
export function aulasLibres(rooms, dia, desde, hasta) {
  const a = `${dia}T${desde}`, b = `${dia}T${hasta}`;
  const cubiertos = new Set();
  for (const r of rooms.rooms || []) for (const x of r.bookings || []) cubiertos.add(x.start.slice(0, 10));
  const libres = [];
  for (const r of rooms.rooms || []) {
    const ese = (r.bookings || []).filter((x) => x.start.slice(0, 10) === dia);
    const pisa = ese.some((x) => x.start.slice(0, 16) < b && x.end.slice(0, 16) > a);
    if (pisa) continue;
    // Hasta cuándo sigue libre ese día (la siguiente clase que empieza después del hueco).
    const sig = ese.map((x) => x.start.slice(11, 16)).filter((h) => h >= hasta).sort()[0] || null;
    libres.push({ codigo: r.code, aula: r.name, edificio: r.building, hastaLas: sig, clasesHoy: ese.length });
  }
  // Primero las que se usan para clase ese día (son aulas de verdad, no despachos) y luego por edificio y nombre.
  libres.sort((x, y) => (y.clasesHoy > 0) - (x.clasesHoy > 0) || x.edificio.localeCompare(y.edificio, "es") ||
    x.aula.localeCompare(y.aula, "es", { numeric: true }));
  return { dia, desde, hasta, conDatos: cubiertos.has(dia), generado: rooms.generated, libres };
}

// --- Calendario de Blackboard (.ics) ---
export function enlaceBlackboard(url, hosts) {
  let u; try { u = new URL(String(url || "").trim()); } catch { return null; }
  if (!hosts.includes(u.host)) return null;
  if (u.protocol !== "https:" && !u.host.startsWith("127.0.0.1")) return null;
  if (!/^\/webapps\/calendar\/calendarFeed\/[A-Za-z0-9_-]{8,}\/learn\.ics$/.test(u.pathname)) return null;
  return u.origin + u.pathname;
}

// La hora de Madrid de un instante UTC, como "AAAA-MM-DDTHH:MM" (los alumnos están aquí; el cliente lo lee local).
function madrid(utc) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric",
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(utc).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
function fechaIcs(valor, params) {
  const m = String(valor).match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, , z] = m;
  if (!h) return `${y}-${mo}-${d}T23:59`;                                  // día entero: vence al final del día
  if (z) return madrid(new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi)));
  return `${y}-${mo}-${d}T${h}:${mi}`;                                     // TZID=Europe/Madrid u hora flotante
}
const textoIcs = (s) => String(s || "").replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1").trim();

export function parseIcs(texto) {
  const lineas = String(texto).replace(/\r\n?/g, "\n").replace(/\n[ \t]/g, "").split("\n");
  const eventos = []; let ev = null;
  for (const l of lineas) {
    if (l === "BEGIN:VEVENT") { ev = {}; continue; }
    if (l === "END:VEVENT") { if (ev) eventos.push(ev); ev = null; continue; }
    if (!ev) continue;
    const i = l.indexOf(":"); if (i < 0) continue;
    const [nombre, ...params] = l.slice(0, i).split(";");
    ev[nombre.toUpperCase()] = { v: l.slice(i + 1), p: params };
  }
  const entregas = [], otros = [];
  for (const e of eventos) {
    const uid = e.UID?.v || "";
    const titulo = textoIcs(e.SUMMARY?.v) || "Entrega";
    const ini = e.DTSTART ? fechaIcs(e.DTSTART.v, e.DTSTART.p) : null;
    const fin = e.DTEND ? fechaIcs(e.DTEND.v, e.DTEND.p) : ini;
    if (!ini) continue;
    const id = (uid.match(/(_\d+_\d+)\s*$/) || [])[1] || uid.slice(-40);
    // Igual que el pipeline (utad/blackboard.py): GradableItem = algo que entregar; CalendarEntry = evento.
    const calificable = /gradebook2\.GradableItem/i.test(uid) || (!/data\.calendar\.CalendarEntry/i.test(uid) && fin <= ini);
    if (calificable) {
      const soloNota = /\b(nota|notas|calificaci[oó]n|calificaciones|revisi[oó]n|acta|final grade)\b/i.test(titulo) &&
        !/\b(entrega|entregable|examen|pr[aá]ctica|actividad|tarea|trabajo|proyecto|memoria|informe)\b/i.test(titulo);
      if (!soloNota) entregas.push({ id, t: titulo, d: fin > ini ? fin : ini });
    } else {
      otros.push({ id, t: titulo, ini, fin, lugar: textoIcs(e.LOCATION?.v) || null });
    }
  }
  entregas.sort((a, b) => a.d.localeCompare(b.d)); otros.sort((a, b) => a.ini.localeCompare(b.ini));
  return { entregas, eventos: otros };
}

const MOTIVOS = new Set(["no existe", "no es un calendario"]);
const motivo = (e) => (MOTIVOS.has(e.message) || /^HTTP \d+$/.test(e.message) ? e.message : "sin respuesta");

async function leerBlackboard(url) {
  const r = await fetch(url, { redirect: "follow", headers: { Accept: "text/calendar" } });
  if (!r.ok) throw new Error(r.status === 404 ? "no existe" : `HTTP ${r.status}`);
  const t = await r.text();
  if (!t.slice(0, 400).includes("BEGIN:VCALENDAR")) throw new Error("no es un calendario");
  return parseIcs(t);
}

// --- Envío del enlace mágico (solo si Dmitrii configura un proveedor) ---
async function enviarEnlace(env, correo, enlace) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.MAIL_FROM, to: [correo], subject: "Entra en Greenboard",
      text: `Hola:\n\nPara entrar en el prototipo de Greenboard, abre este enlace (vale ${ENLACE_MIN} minutos y una sola vez):\n\n${APP_URL}#entrar=${enlace}\n\nSi no lo has pedido tú, ignora este correo.\n\nEquipo Greenboard (PRO3, U-tad)`,
    }),
  });
  if (!r.ok) throw new Error(`correo ${r.status}`);
}

// Cada entrada es un código suelto (se liga al primer correo que lo usa) o "codigo:correo" (solo vale para ese correo).
export const codigosDe = (env) => String(env.INVITE_CODES || "").split(",").map((x) => {
  const i = x.indexOf(":");
  const codigo = (i === -1 ? x : x.slice(0, i)).trim().toLowerCase();
  const correo = i === -1 ? "" : x.slice(i + 1).trim().toLowerCase();
  return { codigo, correo };
}).filter((x) => x.codigo);
const enmascara = (c) => c.slice(0, 4) + "…";

// --- El objeto que guarda cuentas y sesiones ---
export class Cuentas {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; this.st = ctx.storage; }

  async sesion(token) {
    if (!token) return null;
    const k = "s:" + await sha256(token), s = await this.st.get(k);
    if (!s || s.exp < Date.now()) return null;
    // Entró con un código que ya no está en INVITE_CODES: acceso retirado.
    if (s.codigo && !codigosDe(this.env).some((c) => c.codigo === s.codigo)) { await this.st.delete(k); return null; }
    return s;
  }
  async nuevaSesion(correo, codigo = null) {
    const token = aleatorio();
    await this.st.put("s:" + await sha256(token), { correo, codigo, exp: Date.now() + SESION_DIAS * 864e5 });
    const u = (await this.st.get("u:" + correo)) || { creado: Date.now(), grupos: [] };
    u.ultimo = Date.now(); await this.st.put("u:" + correo, u);
    return token;
  }
  async limite(clave, max, ventanaMs) {
    const k = "l:" + clave, now = Date.now();
    const l = ((await this.st.get(k)) || []).filter((t) => now - t < ventanaMs);
    if (l.length >= max) return false;
    l.push(now); await this.st.put(k, l); return true;
  }

  async fetch(req) {
    const env = this.env, url = new URL(req.url), ruta = url.pathname.replace(/^\/app/, "");
    const body = async () => { try { return await req.json(); } catch { return {}; } };
    const dominios = String(env.DOMINIOS || "live.u-tad.com").split(",").map((x) => x.trim().toLowerCase());

    if (req.method === "POST" && ruta === "/entrar") {
      const b = await body();
      const correo = correoValido(b.correo, dominios);
      if (!correo) return json({ ok: false, error: "correo", dominios }, 400);
      if (!(await this.limite("entrar:" + correo, 8, 3600e3))) return json({ ok: false, error: "espera" }, 429);
      const codigo = String(b.codigo || "").trim().toLowerCase();
      if (codigo) {
        const entrada = codigosDe(env).find((c) => iguales(c.codigo, codigo));
        if (!entrada) {
          // Límite global de códigos fallidos: probar correos distintos no sirve para adivinar códigos.
          if (!(await this.limite("codigo-malo", 30, 3600e3))) return json({ ok: false, error: "espera" }, 429);
          return json({ ok: false, error: "codigo" }, 401);
        }
        // Un código con correo asignado solo vale para ese correo.
        if (entrada.correo && entrada.correo !== correo) return json({ ok: false, error: "codigo-usado" }, 401);
        const dueño = await this.st.get("c:" + entrada.codigo);
        if (dueño && dueño !== correo) return json({ ok: false, error: "codigo-usado" }, 401);
        if (!dueño) await this.st.put("c:" + entrada.codigo, correo);
        return json({ ok: true, token: await this.nuevaSesion(correo, entrada.codigo) });
      }
      if (!env.RESEND_API_KEY || !env.MAIL_FROM) return json({ ok: false, error: "sin-correo", modo: "codigo" }, 400);
      const enlace = aleatorio();
      await this.st.put("e:" + await sha256(enlace), { correo, exp: Date.now() + ENLACE_MIN * 60e3 });
      try { await enviarEnlace(env, correo, enlace); } catch { return json({ ok: false, error: "envio" }, 502); }
      return json({ ok: true, modo: "enlace" });
    }
    if (req.method === "POST" && ruta === "/verificar") {
      const b = await body(), k = "e:" + await sha256(String(b.enlace || ""));
      const e = await this.st.get(k);
      if (!e || e.exp < Date.now()) return json({ ok: false, error: "enlace" }, 401);
      await this.st.delete(k);
      return json({ ok: true, token: await this.nuevaSesion(e.correo) });
    }

    // Administración (el Worker comprueba ADMIN_TOKEN y lo pasa como cabecera interna).
    if (ruta.startsWith("/admin/")) {
      if (req.headers.get("X-Interno-Admin") !== "1") return json({ ok: false, error: "token" }, 401);
      if (req.method === "GET" && ruta === "/admin/codigos") {
        const out = [];
        for (const c of codigosDe(env)) {
          const correo = c.correo || (await this.st.get("c:" + c.codigo)) || null;
          const u = correo ? await this.st.get("u:" + correo) : null;
          out.push({ codigo: enmascara(c.codigo), correo, grupos: u?.grupos || [], blackboard: !!u?.bb, ultimo: u?.ultimo || null });
        }
        return json({ ok: true, codigos: out });
      }
      if (req.method === "DELETE" && ruta === "/admin/usuario") {
        const correo = correoValido(url.searchParams.get("correo"), dominios);
        if (!correo) return json({ ok: false, error: "correo" }, 400);
        const borrar = ["u:" + correo];
        for (const [k, v] of await this.st.list({ prefix: "s:" })) if (v.correo === correo) borrar.push(k);
        for (const [k, v] of await this.st.list({ prefix: "c:" })) if (v === correo) borrar.push(k);
        await this.st.delete(borrar);
        return json({ ok: true, borradas: borrar.length });
      }
      return json({ error: "no" }, 404);
    }

    // A partir de aquí, todo pide sesión.
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const s = await this.sesion(token);
    if (!s) return json({ ok: false, error: "sesion" }, 401);
    const uk = "u:" + s.correo;
    const u = (await this.st.get(uk)) || { grupos: [] };

    if (req.method === "POST" && ruta === "/salir") {
      await this.st.delete("s:" + await sha256(token)); return json({ ok: true });
    }
    if (req.method === "GET" && ruta === "/yo") {
      return json({ correo: s.correo, grupos: u.grupos || [], materias: u.materias || {}, blackboard: !!u.bb });
    }
    try {
      if (req.method === "GET" && ruta === "/grupos") {
        const g = await dato(env, "groups.json");
        return json({ grupos: g.groups, generado: g.generated });
      }
      if (req.method === "GET" && ruta === "/conflictos") {
        const g = await dato(env, "groups.json");
        const pedidos = (url.searchParams.get("grupos") || "").split(",").map((x) => x.trim()).filter(Boolean);
        const grupos = [...new Set(pedidos)].filter((x) => x in g.groups).slice(0, MAX_GRUPOS);
        return json({ conflictos: conflictosDeGrupos(g, grupos) });
      }
      if (req.method === "PUT" && ruta === "/grupos") {
        const g = await dato(env, "groups.json"), b = await body();
        const grupos = [...new Set((Array.isArray(b.grupos) ? b.grupos : []).map(String))].filter((x) => x in g.groups);
        if (grupos.length < 1 || grupos.length > MAX_GRUPOS) return json({ ok: false, error: "grupos" }, 400);
        // Solo se guardan elecciones válidas: un grupo elegido que de verdad dé esa asignatura.
        const materias = {};
        for (const [clave, grupo] of Object.entries(b.materias && typeof b.materias === "object" ? b.materias : {})) {
          if (!grupos.includes(grupo)) continue;
          if ((g.sessions || []).some((x) => (x.cod || x.asig) === clave && (x.g || []).includes(grupo))) materias[clave] = grupo;
        }
        u.grupos = grupos; u.materias = materias; await this.st.put(uk, u);
        return json({ ok: true, grupos, materias });
      }
      if (req.method === "GET" && ruta === "/horario") {
        const g = await dato(env, "groups.json");
        const mios = u.grupos || [], materias = u.materias || {};
        const toca = (x) => tocaSesion(x, mios, materias);
        return json({ generado: g.generated, semanas: g.weeks, grupos: mios, materias,
          sesiones: g.sessions.filter(toca), cambios: (g.cambios || []).filter(toca) });
      }
      if (req.method === "GET" && ruta === "/aulas") {
        const dia = url.searchParams.get("dia") || "", desde = url.searchParams.get("desde") || "",
          hasta = url.searchParams.get("hasta") || "";
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || !/^\d{2}:\d{2}$/.test(desde) || !/^\d{2}:\d{2}$/.test(hasta) || hasta <= desde)
          return json({ ok: false, error: "hueco" }, 400);
        return json(aulasLibres(await dato(env, "rooms.json"), dia, desde, hasta));
      }
    } catch (e) {
      return json({ ok: false, error: "datos" }, 503);
    }
    const hosts = String(env.BB_HOSTS || "u-tad.blackboard.com").split(",").map((x) => x.trim());
    if (req.method === "PUT" && ruta === "/blackboard") {
      const b = await body(), limpio = enlaceBlackboard(b.url, hosts);
      if (!limpio) return json({ ok: false, error: "enlace" }, 400);
      let datos;
      try { datos = await leerBlackboard(limpio); } catch (e) { return json({ ok: false, error: "no-responde", motivo: motivo(e) }, 502); }
      u.bb = limpio; await this.st.put(uk, u);
      return json({ ok: true, entregas: datos.entregas.length, eventos: datos.eventos.length });
    }
    if (req.method === "DELETE" && ruta === "/blackboard") {
      delete u.bb; await this.st.put(uk, u); return json({ ok: true });
    }
    if (req.method === "GET" && ruta === "/entregas") {
      if (!u.bb) return json({ ok: false, error: "sin-blackboard" }, 404);
      try { return json({ ok: true, ...(await leerBlackboard(u.bb)) }); }
      catch (e) { return json({ ok: false, error: "no-responde", motivo: motivo(e) }, 502); }
    }
    return json({ error: "no" }, 404);
  }
}
