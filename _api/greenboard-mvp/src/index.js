// Lista de apuntados para probar el MVP de Greenboard.
// Un único Durable Object ("sprint2") guarda la lista en orden de llegada; los 5 primeros tienen plaza.
//
//   GET  /lista                 -> { plazas, total, personas:[{n, nombre, avatar, ts}] }   (sin correos)
//   POST /apuntarse             -> body {nombre, avatar, correo?} -> { ok, n, plaza, id }
//   GET  /lista?completo=1      -> igual que /lista pero con correos. Cabecera Authorization: Bearer <ADMIN_TOKEN>
//   POST /reset                 -> vacía la lista. Misma cabecera.

const PLAZAS = 5;
const MAX_PERSONAS = 80;
const AVATARES = 10;
const ORIGENES = [
  "https://greenboard-team.github.io",
  "http://localhost:4173", "http://127.0.0.1:4173",
  "http://localhost:8000", "http://127.0.0.1:8000",
  "http://localhost:5500", "http://127.0.0.1:5500",
];

function cors(req) {
  const origin = req.headers.get("Origin") || "";
  const ok = ORIGENES.includes(origin) || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:");
  return {
    "Access-Control-Allow-Origin": ok ? origin : ORIGENES[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra },
  });
}

function limpiaNombre(s) {
  return String(s ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
}

export class Lista {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async personas() {
    return (await this.ctx.storage.get("personas")) || [];
  }

  async fetch(req) {
    const url = new URL(req.url);
    const admin = this.env.ADMIN_TOKEN && req.headers.get("Authorization") === `Bearer ${this.env.ADMIN_TOKEN}`;

    if (req.method === "GET" && url.pathname === "/lista") {
      const personas = await this.personas();
      const completo = admin && url.searchParams.get("completo") === "1";
      return json({
        plazas: PLAZAS,
        total: personas.length,
        personas: personas.map((p, i) => ({
          n: i + 1, id: p.id, nombre: p.nombre, avatar: p.avatar, ts: p.ts, plaza: i < PLAZAS,
          ...(completo ? { correo: p.correo || "" } : {}),
        })),
      });
    }

    if (req.method === "POST" && url.pathname === "/apuntarse") {
      let body;
      try { body = await req.json(); } catch { return json({ ok: false, error: "json" }, 400); }
      const nombre = limpiaNombre(body.nombre);
      const avatar = Number(body.avatar);
      const correo = String(body.correo ?? "").trim().slice(0, 80);
      if (nombre.length < 2) return json({ ok: false, error: "nombre" }, 400);
      if (!Number.isInteger(avatar) || avatar < 1 || avatar > AVATARES) return json({ ok: false, error: "avatar" }, 400);
      if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return json({ ok: false, error: "correo" }, 400);

      // Una persona por dispositivo: el cliente manda un id propio y, si ya está, devolvemos su puesto.
      const id = String(body.id ?? "").replace(/[^a-z0-9-]/gi, "").slice(0, 40);
      const personas = await this.personas();
      const repetido = personas.findIndex((p) => (id && p.id === id) || p.nombre.toLowerCase() === nombre.toLowerCase());
      if (repetido >= 0) {
        return json({ ok: true, n: repetido + 1, plaza: repetido < PLAZAS, id: personas[repetido].id, repetido: true });
      }
      if (personas.length >= MAX_PERSONAS) return json({ ok: false, error: "lleno" }, 409);

      const persona = { id: id || crypto.randomUUID(), nombre, avatar, correo, ts: Date.now() };
      personas.push(persona);
      await this.ctx.storage.put("personas", personas);
      const n = personas.length;
      return json({ ok: true, n, plaza: n <= PLAZAS, id: persona.id });
    }

    if (req.method === "POST" && url.pathname === "/reset") {
      if (!admin) return json({ ok: false, error: "token" }, 401);
      await this.ctx.storage.put("personas", []);
      return json({ ok: true, total: 0 });
    }

    return json({ error: "no" }, 404);
  }
}

export default {
  async fetch(req, env) {
    const headers = cors(req);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
    const url = new URL(req.url);
    if (url.pathname === "/" ) {
      return new Response("greenboard-mvp: GET /lista · POST /apuntarse", { headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" } });
    }
    const stub = env.LISTA.get(env.LISTA.idFromName("sprint2"));
    const res = await stub.fetch(req);
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(headers)) out.headers.set(k, v);
    return out;
  },
};
