/* Greenboard · app del MVP (/mvp/) · app
   Pintar la pantalla, rutas y arranque. */

/* ---------- Pintar ---------- */
let toastT;
function toast(m){ const t = document.getElementById('toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2600); }
function pintar(){
  const [r, arg, sub] = ruta().split('/');
  // Sin sesión (y fuera de la demo) solo se puede entrar; con sesión y sin grupos, elegirlos.
  const puerta = !DEMO && (!TOKEN || CARGA || r === 'grupos' || (REAL && !REAL.grupos.length));
  document.body.classList.toggle('sin-menu', puerta);
  if (puerta){
    document.getElementById('tabs').innerHTML = ''; document.getElementById('guia').innerHTML = '';
    document.getElementById('view').innerHTML = !TOKEN ? V.entrar() : CARGA === 'cargando' ? '<div class="puerta"><p class="cargando">Cargando tu horario…</p></div>'
      : CARGA === 'error' ? `<div class="puerta"><p class="error">No se han podido leer tus datos.</p><p><button class="btn" onclick="cargar()">Reintentar</button> <button class="linkbtn" onclick="salir()">Cerrar sesión</button></p></div>` : V.grupos();
    return;
  }
  if (REAL){ document.getElementById('who').innerHTML = `<span class="avatar">${esc(NOMBRE.slice(0,2).toUpperCase())}</span><span>${esc(NOMBRE)}<small>${esc(REAL.grupos.join(' + '))} · U-tad</small></span>`; }
  const act = Object.prototype.hasOwnProperty.call(V, r) && !['entrar','grupos'].includes(r) && (r !== 'ajustes' || REAL) ? r : 'inicio';
  const vivas = DUE.filter(x => new Date(x.d) > new Date()).length;
  document.getElementById('tabs').innerHTML = [
    ['inicio','Inicio',''],
    ['asig','Asignaturas', S.justificado ? `<span class="count">${SUBJECTS.length}</span>` : '<span class="count rojo" title="Faltas sin justificar">1</span>'],
    ['notas','Calificaciones',''],
    ['ent','Entregas', `<span class="count">${vivas}</span>`],
    ['msg','Mensajes', sinLeer() ? `<span class="count rojo" title="Sin leer">${sinLeer()}</span>` : ''],
    ['tram','Trámites',''], ['com','Comunidad',''], ...(REAL ? [['ajustes','Ajustes','']] : [])
  ].map(([k,t,c]) => `<a class="tab" id="tab-${k}" href="#/${k}" ${act===k?'aria-current="page"':''}>${t} ${c}</a>`).join('');
  const vista = V[act](arg, sub);   // la vista primero: abrir un chat lo marca como leído
  document.getElementById('tabs').querySelectorAll('#tab-msg .count').forEach(e => { if (!sinLeer()) e.remove(); else e.textContent = sinLeer(); });
  document.getElementById('view').innerHTML = vista + (REAL
    ? `<p class="note pie">Prototipo del MVP con tus datos: horario y cambios de WebUntis (${esc(REAL.generado)}), aulas libres según ese horario${REAL.bb ? ', entregas de tu Blackboard' : ''} · asistencia, contenido, notas, chats, comunidad, pádel y matrícula de ejemplo · <a href="#/ajustes">Ajustes</a> · <a href="#" onclick="salir();return false">Cerrar sesión</a></p>`
    : `<p class="note pie">Demo del MVP · asignaturas y entregas reales de Blackboard (26/10/2026); horario, aulas, asistencia, contenido, notas, chats, compañeros y reservas de ejemplo · no se conecta a ningún portal · <a href="#" onclick="reiniciar();return false">Reiniciar demo</a> · <a href="#" onclick="dejarDemo();return false">Entrar con mi correo de U-tad</a></p>`);
  document.getElementById('guia').innerHTML = guiaHTML();
  if (S.guia){ const p = paso(); if (p.obj){ const el = document.querySelector(p.obj); if (el) el.classList.add('spot'); } }
  document.querySelectorAll('.j-file').forEach(jf => jf.addEventListener('change', () => { const f = jf.files[0]; if (f){ S.archivo = f.name; guardar(); pintar(); } }));
  enlazarBarra();
}
const render = pintar;
window.addEventListener('hashchange', () => {
  if (/entrar=/.test(location.hash)) arrancar();
  else if (!DEMO && /^#\/?demo\b/.test(location.hash)) verDemo();
  else { pintar(); window.scrollTo(0,0); }
});
arrancar();
