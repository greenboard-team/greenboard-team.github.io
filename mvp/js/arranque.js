/* Greenboard · app del MVP (/mvp/) · arranque
   Lo primero que corre: registra el service worker, guarda el aviso de instalar de Android
   si llega pronto, carga los datos de ejemplo (data/*.json) y después los módulos en orden. Los módulos
   son scripts clásicos que comparten el ámbito global, así que los onclick del HTML siguen funcionando. */

window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); window.__avisoInstalar = e; }, {once: true});
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')){
  navigator.serviceWorker.register('sw.js').catch(e => console.warn('service worker:', e.message));
}

const MODULOS = ["datos.js", "buscador.js", "ui.js", "real.js", "app.js"];
(async () => {
  try {
    const partes = await Promise.all(['asignaturas', 'comunidad', 'reservas'].map(n =>
      fetch('data/' + n + '.json').then(r => { if (!r.ok) throw new Error(n + ': HTTP ' + r.status); return r.json(); })));
    window.DATOS = Object.assign({}, ...partes);
    for (const m of MODULOS) await new Promise((ok, ko) => {
      const s = document.createElement('script');
      s.src = 'js/' + m; s.async = false; s.onload = ok; s.onerror = () => ko(new Error(m));
      document.body.appendChild(s);
    });
  } catch (e) {
    console.error('arranque:', e.message);
    document.getElementById('view').innerHTML = '<p style="padding:24px">No se ha podido cargar Greenboard. Recarga la página.</p>';
  }
})();
