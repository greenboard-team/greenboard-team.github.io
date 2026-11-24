// Greenboard · service worker de la app (/mvp/).
// Guarda solo la «carcasa» de la app (la página, los ficheros que genera Vite en assets/, el manifest y los iconos)
// para que se abra rápido y sin conexión. Primero la red; sin red, la última copia guardada.
// Lo que comparte /mvp/ con la app (apuntarse/, pantalla.html, presentacion.html, foto.html, deck/, qr…) y la API
// del Worker (otro dominio) no se tocan.
const VERSION = 'gb-app-v4-react';
const BASE = new URL('./', self.location).pathname; // "/mvp/"
const FIJOS = ['manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png']
  .map((p) => BASE + p);

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k.startsWith('gb-app-') && k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  if (req.headers.has('Authorization')) return;
  const navegar = req.mode === 'navigate' && (url.pathname === BASE || url.pathname === BASE + 'index.html');
  const deLaApp = url.pathname.startsWith(BASE + 'assets/') || FIJOS.includes(url.pathname);
  if (!navegar && !deLaApp) return;
  const clave = navegar ? BASE : url.pathname;
  e.respondWith(fetch(req).then((res) => {
    if (res.ok) {
      const copia = res.clone();
      caches.open(VERSION).then((c) => c.put(clave, copia));
    }
    return res;
  }).catch(() => caches.match(clave)));
});
