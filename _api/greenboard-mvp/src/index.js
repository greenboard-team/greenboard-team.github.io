// Lista de apuntados para probar el MVP de Greenboard.
// Un único Durable Object ("sprint2") guarda la lista en orden de llegada; los 5 primeros tienen plaza.
//
//   GET  /lista                 -> { plazas, total, personas:[{n, nombre, avatar, ts}] }   (sin correos)
//   POST /apuntarse             -> body {nombre, avatar, correo?} -> { ok, n, plaza, id }
//   GET  /lista?completo=1      -> igual que /lista pero con correos. Cabecera Authorization: Bearer <ADMIN_TOKEN>
//   POST /reset                 -> vacía la lista. Misma cabecera.
//   POST /foto                  -> cuerpo: la imagen (image/jpeg|png|webp, máx. 4 MB). Cabecera X-Equipo: <EQUIPO_CODE>.
//   GET  /foto                  -> la imagen tal cual (o 404). GET /foto/meta -> { hay, ts, tipo, bytes }
//   DELETE /foto                -> la quita. Authorization: Bearer <ADMIN_TOKEN>.

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
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Equipo",
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

    // --- Foto del equipo para la diapositiva 9: guardada en trozos de 100 KiB en el almacenamiento del objeto.
    const TROZO = 100 * 1024, MAX_FOTO = 4 * 1024 * 1024;
    if (url.pathname === "/foto/meta" && req.method === "GET") {
      const meta = await this.ctx.storage.get("foto:meta");
      return json(meta ? { hay: true, ...meta } : { hay: false });
    }
    if (url.pathname === "/foto" && req.method === "GET") {
      const meta = await this.ctx.storage.get("foto:meta");
      if (!meta) return new Response("sin foto", { status: 404, headers: { "Cache-Control": "no-store" } });
      const trozos = await this.ctx.storage.get([...Array(meta.n).keys()].map((i) => "foto:" + i));
      const partes = []; for (let i = 0; i < meta.n; i++) partes.push(trozos.get("foto:" + i));
      return new Response(new Blob(partes), { headers: { "Content-Type": meta.tipo, "Cache-Control": "no-store", "X-Foto-Ts": String(meta.ts) } });
    }
    if (url.pathname === "/foto" && req.method === "POST") {
      if (!this.env.EQUIPO_CODE || req.headers.get("X-Equipo") !== this.env.EQUIPO_CODE) return json({ ok: false, error: "codigo" }, 401);
      const tipo = (req.headers.get("Content-Type") || "").split(";")[0].trim();
      if (!["image/jpeg", "image/png", "image/webp"].includes(tipo)) return json({ ok: false, error: "tipo" }, 415);
      const buf = new Uint8Array(await req.arrayBuffer());
      if (buf.byteLength < 1000) return json({ ok: false, error: "vacia" }, 400);
      if (buf.byteLength > MAX_FOTO) return json({ ok: false, error: "grande" }, 413);
      const n = Math.ceil(buf.byteLength / TROZO);
      const viejo = await this.ctx.storage.get("foto:meta");
      const entradas = {};
      for (let i = 0; i < n; i++) entradas["foto:" + i] = buf.slice(i * TROZO, (i + 1) * TROZO);
      await this.ctx.storage.put(entradas);
      if (viejo && viejo.n > n) await this.ctx.storage.delete([...Array(viejo.n - n).keys()].map((i) => "foto:" + (n + i)));
      const meta = { ts: Date.now(), tipo, bytes: buf.byteLength, n };
      await this.ctx.storage.put("foto:meta", meta);
      return json({ ok: true, ...meta });
    }
    if (url.pathname === "/foto" && req.method === "DELETE") {
      if (!admin) return json({ ok: false, error: "token" }, 401);
      const meta = await this.ctx.storage.get("foto:meta");
      if (meta) { await this.ctx.storage.delete([...Array(meta.n).keys()].map((i) => "foto:" + i)); await this.ctx.storage.delete("foto:meta"); }
      return json({ ok: true });
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
      return new Response("greenboard-mvp: GET /lista · POST /apuntarse · GET/POST /foto", { headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" } });
    }
    const stub = env.LISTA.get(env.LISTA.idFromName("sprint2"));
    const res = await stub.fetch(req);
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(headers)) out.headers.set(k, v);
    return out;
  },
};
