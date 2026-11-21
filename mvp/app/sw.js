// Greenboard · service worker del prototipo (/mvp/app/).
// Guarda solo la «carcasa» de la app (esta página, el manifest y los iconos) para que arranque rápido y se abra sin
// conexión. NUNCA guarda datos: las peticiones a la API (/app/* del Worker, en otro dominio) y cualquier otra cosa
// de fuera de /mvp/app/ pasan de largo sin tocarse. El token de la sesión vive en localStorage, no aquí.
const VERSION = "gb-app-v1";
const CARCASA = ["./", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png",
  "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png"];
const BASE = new URL("./", self.location).pathname;          // "/mvp/app/"

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CARCASA)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k.startsWith("gb-app-") && k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  // Solo GET de este mismo sitio y dentro de /mvp/app/. La API, las fuentes y todo lo demás, sin tocar.
  if (req.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  if (req.headers.has("Authorization")) return;               // por si acaso: nada con credenciales

  if (req.mode === "navigate") {
    // La página: primero la red (así se ven los cambios al momento); sin red, la última guardada.
    e.respondWith(fetch(req).then((res) => {
      if (res.ok) { const copia = res.clone(); caches.open(VERSION).then((c) => c.put("./", copia)); }
      return res;
    }).catch(() => caches.match("./")));
    return;
  }
  // Manifest e iconos: lo guardado al instante y se refresca por detrás.
  if (!CARCASA.some((p) => url.pathname === new URL(p, self.location).pathname)) return;
  e.respondWith(caches.open(VERSION).then((c) => c.match(req).then((hit) => {
    const red = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || red;
  })));
});
