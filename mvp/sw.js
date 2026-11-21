// Greenboard · service worker de la app (/mvp/).
// Guarda solo la «carcasa» de la app (página, estilos, scripts, datos de ejemplo, manifest e iconos) para que se
// abra rápido y sin conexión. Todo lo demás va directo a la red sin tocarse: la API (/app/* del Worker, en otro
// dominio), y también lo que comparte /mvp/ con la app (apuntarse/, pantalla.html, presentacion.html, foto.html,
// deck/, qr…). El token de la sesión vive en localStorage.
// Primero la red (así un cambio se ve al momento y la página y sus scripts nunca se mezclan de versiones distintas);
// sin red, la última copia guardada.
const VERSION = "gb-app-v3";
const CARCASA = ["./", "./css/styles.css",
  "./js/arranque.js", "./js/datos.js", "./js/buscador.js", "./js/ui.js", "./js/real.js", "./js/app.js",
  "./data/asignaturas.json", "./data/comunidad.json", "./data/reservas.json",
  "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"];
const BASE = new URL("./", self.location).pathname;                       // "/mvp/"
const RUTAS = new Set(CARCASA.map((p) => new URL(p, self.location).pathname));

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
  // Solo GET de este mismo sitio, dentro de /mvp/ y sin credenciales. La API, las fuentes y lo demás, sin tocar.
  if (req.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  if (req.headers.has("Authorization")) return;
  // Solo la página de la app (/mvp/ o /mvp/index.html) y sus ficheros. Cualquier otra página de /mvp/, fuera.
  const navegar = req.mode === "navigate" && (url.pathname === BASE || url.pathname === BASE + "index.html");
  if (!navegar && !RUTAS.has(url.pathname)) return;
  const clave = navegar ? "./" : url.pathname;                           // la página, con o sin ?api=… o #ruta
  e.respondWith(fetch(req).then((res) => {
    if (res.ok) { const copia = res.clone(); caches.open(VERSION).then((c) => c.put(clave, copia)); }
    return res;
  }).catch(() => caches.match(clave)));
});
