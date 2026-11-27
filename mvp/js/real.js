/* Greenboard · app del MVP (/mvp/) · real
   Datos reales: entrar con correo de U-tad, grupos, horario, aulas libres, Blackboard e instalar como app. */

/* ---------- Datos reales: entrar con correo de U-tad y leerlos del Worker ----------
   Sin sesión no hay nada real en esta página: todo llega de /app/* con el token de la sesión.
   #demo (o «Ver la demo») enseña el prototipo con los datos de ejemplo de siempre. */
const API_PUB = 'https://greenboard-mvp.utad-study-connector.workers.dev';
const API = (() => {   // ?api=http://127.0.0.1:8787 solo para probar en local; nunca otro servidor
  try { const q = new URLSearchParams(location.search).get('api');
        if (q && /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(q)) sessionStorage.setItem('gb-api', q);
        return sessionStorage.getItem('gb-api') || API_PUB; } catch(e){ return API_PUB; }
})();
const CLASSLIFE_AULAS = 'https://u-tad.classlife.education/booking';
let TOKEN = null; try { TOKEN = localStorage.getItem('gb-token'); } catch(e){}
let DEMO = /(^|[#&?/])demo\b/.test(location.hash + location.search); try { if (sessionStorage.getItem('gb-demo')) DEMO = true; } catch(e){}
let REAL = null, CARGA = null, PUERTA = {};   // REAL: datos de la sesión; CARGA: 'cargando' | 'error'

async function api(ruta, opc = {}){
  const r = await fetch(API + '/app' + ruta, {method: opc.method || 'GET',
    headers: {'Content-Type':'application/json', ...(TOKEN ? {Authorization:'Bearer ' + TOKEN} : {})},
    body: opc.body ? JSON.stringify(opc.body) : undefined});
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && j.error === 'sesion'){ salir(true); throw new Error('sesion'); }
  if (!r.ok) { const e = new Error(j.error || 'http'); e.datos = j; throw e; }
  return j;
}
function salir(solo){
  if (!solo && TOKEN) fetch(API + '/app/salir', {method:'POST', headers:{Authorization:'Bearer ' + TOKEN}}).catch(() => {});
  TOKEN = null; REAL = null; CARGA = null; try { localStorage.removeItem('gb-token'); } catch(e){}
  location.hash = '#/inicio'; pintar();
}
function verDemo(){ DEMO = true; try { sessionStorage.setItem('gb-demo','1'); } catch(e){} location.hash = '#/inicio'; pintar(); }
function dejarDemo(){ DEMO = false; try { sessionStorage.removeItem('gb-demo'); } catch(e){} location.replace(location.pathname + location.search + '#/inicio'); location.reload(); }

/* De las sesiones de WebUntis a las estructuras que ya pinta el prototipo */
const slug = t => norm(t).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40) || 'x';
const cortoAula = x => x.aula ? x.aula + (x.edif && x.edif !== 'Otros' ? ' · ' + x.edif.replace('Edificio ','') : '') : 'Sin aula';
const diaDe = iso => new Date(iso + 'T12:00');
function cambioFrase(c, cuando){
  const a = `<b>${esc(c.asig)}</b>`;
  if (c.tipo === 'aula') return `${a} cambia ${c.antes ? 'del ' + esc(c.antes) + ' ' : ''}al <b>${esc(c.ahora || 'aula por confirmar')}</b> el ${cuando}`;
  if (c.tipo === 'hora') return `${a} pasa de ${esc(c.antes)} a <b>${esc(c.ahora)}</b> el ${fmtDia.format(diaDe(c.d))}`;
  if (c.tipo === 'cancelada') return `${a} del ${cuando} está <b>cancelada</b>`;
  if (c.tipo === 'adicional') return `Clase de recuperación de ${a}: ${cuando} (${esc(c.ahora)})`;
  return `Clase nueva de ${a}: ${cuando} (${esc(c.ahora)})`;
}
function cambiosHTML(){
  if (!REAL.cambios.length) return '';
  return `<div class="lbl" style="margin-top:10px">Cambios en tus clases</div>` + REAL.cambios.slice(0,6).map(c =>
    `<div class="fila cambio"><time>${fmt.format(diaDe(c.d))}<br><span class="note">${c.h}</span></time><div><small>${cambioFrase(c, fmtDia.format(diaDe(c.d)) + ' a las ' + c.h)}</small></div><span></span></div>`).join('');
}
const isoDia = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function proximas(id){
  const hoy = isoDia(new Date());
  const l = REAL.sesiones.filter(x => slug(x.asig) === id && x.d >= hoy).slice(0,3);
  if (!l.length) return '<p class="note" style="margin:0">No hay más clases en las próximas semanas.</p>';
  return l.map(x => `<div class="fila ${x.estado==='cancelada'?'cancelada':''}"><time>${fmtDia.format(diaDe(x.d))}<br><span class="note">${x.h}–${x.f}</span></time><div><b>${esc(x.prof || '')}</b><small>${esc(x.g.join(' · '))}</small></div><span class="aula">${ic('pin')}${esc(cortoAula(x))}</span></div>`).join('');
}
function aplicar(h, bb){
  const cambioDe = {}; for (const c of h.cambios) (cambioDe[c.k] ||= []).push(c);
  // Asignaturas: las que salen en tu horario (profesor = el que más clases da)
  const por = {};
  for (const x of h.sesiones){ if (!x.asig) continue; const id = slug(x.asig);
    const a = por[id] ||= {id, n:x.asig, c:x.cod, g:new Set(), prof:{}}; x.g.forEach(g => a.g.add(g)); if (x.prof) a.prof[x.prof] = (a.prof[x.prof]||0) + 1; }
  // Lo que llega de WebUntis y Blackboard se escapa aquí: el resto del prototipo lo pinta tal cual.
  SUBJECTS = Object.values(por).map(a => ({id:a.id, n:esc(a.n), c:esc(`${a.c} · ${[...a.g].filter(g => h.grupos.includes(g)).join(' + ') || [...a.g][0]}`),
    p:esc(Object.entries(a.prof).sort((x,y) => y[1]-x[1])[0]?.[0] || '')})).sort((x,y) => x.n.localeCompare(y.n,'es'));
  // La barra (Ctrl+K) busca en tus asignaturas, no en las de la demo
  for (let i = ACCIONES.length - 1; i >= 0; i--) if (ACCIONES[i].id.startsWith('asig-')) ACCIONES.splice(i, 1);
  ACCIONES.push(...SUBJECTS.map(s => ({id:'asig-'+s.id, tipo:'Asignatura', t:s.n, s:s.c, ico:'libro', k:s.n + ' asignatura'})));
  // Día que enseña el horario: hoy si aún queda clase; si no, el siguiente día con clases
  const ya = new Date(), hoy = isoDia(ya), hm = String(ya.getHours()).padStart(2,'0') + ':' + String(ya.getMinutes()).padStart(2,'0');
  const quedan = h.sesiones.filter(x => x.d > hoy || (x.d === hoy && x.f > hm));
  const dia = quedan[0]?.d || hoy;
  diaClase = diaDe(dia); finde = dia !== hoy; cuandoClase = dia === hoy ? 'hoy' : 'el ' + fmtDia.format(diaClase);
  minutosAhora = dia === hoy ? ya.getHours()*60 + ya.getMinutes() : -1;
  TODAY = h.sesiones.filter(x => x.d === dia && x.asig).map(x => {
    const cs = cambioDe[x.k] || [], aula = cs.find(c => c.tipo === 'aula');
    return {h:x.h, f:x.f, s:slug(x.asig), a:esc(cortoAula(x)), sub:esc([x.prof, x.g.join(' + ')].filter(Boolean).join(' · ')),
      cancelada:x.estado === 'cancelada', changed:cs.length > 0 || ['aula','adicional','movida','sustitucion'].includes(x.estado),
      cambioTxt: aula ? 'Aula nueva' + (aula.antes ? ' (antes ' + esc(aula.antes) + ')' : '') : x.estado === 'adicional' ? 'Recuperación' : cs[0]?.tipo === 'hora' ? 'Hora nueva' : 'Cambio'};
  });
  // Entregas de Blackboard: el feed no dice la asignatura; se adivina si su nombre sale en el título
  const desde = isoDia(new Date(Date.now() - 14*864e5));
  DUE = (bb?.entregas || []).filter(x => x.d >= desde).map(x => {
    const t = norm(x.t), s = SUBJECTS.find(a => t.includes(norm(a.n)));
    return {t:esc(x.t), s:s ? s.id : '', d:x.d};
  });
  SUBJECTS.forEach(x => { if (!CHATS.some(c => c.id===x.id)) CHATS.push({id:x.id, s:x.id, t:corto(x)+' · clase', n:30, sinLeer:0,
    msgs:[{de:'Delegación de clase', h:'lun', txt:`Chat de la clase de ${corto(x)}: dudas, avisos y material.`}]}); });
  ASIS_ID = SUBJECTS[0]?.id || 'x'; ASIS = {[ASIS_ID]: [{dias:1,v:0},{dias:3,v:1},{dias:8,v:1},{dias:10,v:1},{dias:15,v:1}]};
  REAL = {...REAL, generado: new Date(h.generado).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}),
          sesiones:h.sesiones, cambios:h.cambios.filter(c => c.d >= hoy), grupos:h.grupos, bb: !!bb};
}
async function cargar(){
  CARGA = 'cargando'; pintar();
  try {
    const yo = await api('/yo');
    NOMBRE = yo.correo.split('@')[0].split(/[._-]/)[0].replace(/^./, c => c.toUpperCase());
    REAL = {correo:yo.correo, grupos:yo.grupos, bb:yo.blackboard, sesiones:[], cambios:[], bbError:null};
    if (!yo.grupos.length){ CARGA = null; location.hash = '#/grupos'; pintar(); return; }
    const [h, bb] = await Promise.all([api('/horario'),
      yo.blackboard ? api('/entregas').catch(e => { REAL.bbError = e.datos?.motivo || e.message; return null; }) : null]);
    aplicar(h, bb);
    S.guia = false; CARGA = null;
  } catch(e){ if (e.message !== 'sesion') CARGA = 'error'; }
  pintar();
}

/* Pantallas sin menú: entrar y elegir grupos */
V.entrar = () => `<div class="puerta"><span class="brand"><i>G</i>Greenboard</span>
  <h2>Entra con tu correo de U-tad</h2>
  <p class="note">El prototipo con tus datos reales (horario de WebUntis, aulas libres y tus entregas de Blackboard) es solo para alumnos de U-tad.</p>
  <form onsubmit="entrar(event)">
    <div class="campo"><label for="correo">Correo de alumno</label><input id="correo" type="email" autocomplete="email" inputmode="email" required placeholder="nombre.apellido@live.u-tad.com" value="${esc(PUERTA.correo || '')}"></div>
    <div class="campo"><label for="codigo">Código de invitación</label><input id="codigo" autocomplete="off" placeholder="Te lo da el equipo Greenboard"></div>
    ${PUERTA.error ? `<p class="error" role="alert">${PUERTA.error}</p>` : ''}${PUERTA.ok ? `<div class="hecho" style="margin-top:12px">${ic('check')}<span>${PUERTA.ok}</span></div>` : ''}
    <p style="margin:16px 0 0"><button class="btn" id="btn-entrar" ${PUERTA.enviando?'disabled':''}>${PUERTA.enviando ? 'Entrando…' : 'Entrar'}</button></p>
  </form>
  <p class="note" style="margin-top:18px">Nunca te pediremos tu contraseña de U-tad ni la de Blackboard. <a href="#" onclick="verDemo();return false">Ver la demo con datos de ejemplo</a></p></div>`;
const ERR_ENTRAR = {correo:'Tiene que ser tu correo de alumno de U-tad (@live.u-tad.com).', codigo:'Ese código de invitación no es válido.',
  'codigo-usado':'Ese código ya lo está usando otra persona.', espera:'Demasiados intentos. Prueba dentro de un rato.',
  'sin-correo':'Para entrar hace falta el código de invitación que te ha dado el equipo.', envio:'No hemos podido mandarte el correo. Prueba otra vez.'};
async function entrar(ev){
  ev.preventDefault();
  const correo = document.getElementById('correo').value.trim(), codigo = document.getElementById('codigo').value.trim();
  PUERTA = {correo, enviando:true}; pintar();
  try {
    const r = await api('/entrar', {method:'POST', body:{correo, codigo}});
    if (r.token){ TOKEN = r.token; try { localStorage.setItem('gb-token', TOKEN); } catch(e){} PUERTA = {}; location.hash = '#/inicio'; cargar(); return; }
    PUERTA = {correo, ok:'Te hemos mandado un enlace a ' + esc(correo) + '. Ábrelo en este dispositivo (vale 15 minutos).'};
  } catch(e){ PUERTA = {correo, error: ERR_ENTRAR[e.message] || 'No se ha podido entrar. Prueba otra vez.'}; }
  pintar();
}
let FILTRO = '', ELEGIDOS = null, LISTA_GRUPOS = null;
const filtrados = () => { const f = norm(FILTRO); return Object.entries(LISTA_GRUPOS).filter(([g,n]) => !f || norm(g + ' ' + n).includes(f)); };
V.grupos = () => {
  if (!LISTA_GRUPOS){ api('/grupos').then(r => { LISTA_GRUPOS = r.grupos; pintar(); }).catch(() => { LISTA_GRUPOS = {}; pintar(); }); return '<div class="puerta"><p class="cargando">Cargando los grupos de WebUntis…</p></div>'; }
  ELEGIDOS ||= [...(REAL?.grupos || [])];
  return `<div class="puerta" style="max-width:720px;margin-top:2vh"><span class="brand"><i>G</i>Greenboard</span><h2>¿En qué grupo estás?</h2>
  <p class="note">Tu horario sale de tu grupo de WebUntis. Si haces doble grado, elige los dos (por ejemplo <b>FIIS4A</b> y <b>MAIS4A</b>) y se juntan en uno. Hasta 3.</p>
  <div class="campo"><label for="fg">Buscar grupo</label><input id="fg" type="search" placeholder="MAIS4, Física, Animación…" value="${esc(FILTRO)}" oninput="FILTRO=this.value;pintarGrupos()"></div>
  <div id="lista-grupos">${gruposHTML(filtrados())}</div>
  <p style="margin:16px 0 0;display:flex;gap:10px;flex-wrap:wrap;align-items:center"><button class="btn" id="btn-grupos" ${ELEGIDOS.length?'':'disabled'} onclick="guardarGrupos()">${ELEGIDOS.length ? 'Ver mi horario · ' + ELEGIDOS.join(' + ') : 'Elige tu grupo'}</button>
  ${REAL?.grupos?.length ? '<a href="#/inicio" class="note">Cancelar</a>' : ''}</p></div>`;
};
const gruposHTML = lista => lista.length ? `<div class="grupos">${lista.map(([g,n]) => `<button class="grupo" aria-pressed="${ELEGIDOS.includes(g)}" onclick="elegirGrupo('${esc(g)}')"><b>${esc(g)}</b><small>${esc(n)}</small></button>`).join('')}</div>` : '<p class="note">Ningún grupo con ese nombre.</p>';
function pintarGrupos(){ document.getElementById('lista-grupos').innerHTML = gruposHTML(filtrados()); }
function elegirGrupo(g){
  ELEGIDOS = ELEGIDOS.includes(g) ? ELEGIDOS.filter(x => x !== g) : [...ELEGIDOS, g].slice(-3);
  pintarGrupos(); const b = document.getElementById('btn-grupos'); b.disabled = !ELEGIDOS.length;
  b.textContent = ELEGIDOS.length ? 'Ver mi horario · ' + ELEGIDOS.join(' + ') : 'Elige tu grupo';
}
async function guardarGrupos(){
  try { await api('/grupos', {method:'PUT', body:{grupos:ELEGIDOS}}); ELEGIDOS = null; FILTRO = ''; location.hash = '#/inicio'; cargar(); }
  catch(e){ toast('No se han podido guardar los grupos'); }
}

/* Migrar desde Blackboard: el alumno pega su enlace de calendario; el Worker lo lee y lo guarda solo para él */
function migrarHTML(){
  return `<p style="margin:0 0 8px"><b>Migrar desde Blackboard.</b> Pega el enlace de tu calendario de Blackboard y aquí salen todas tus entregas, con su fecha.</p>
  <ol class="pasos"><li>En Blackboard, abre <b>Calendario</b> (menú de la izquierda).</li>
  <li>Toca el engranaje <b>⚙</b> (ajustes del calendario) y, abajo, <b>Compartir calendario</b>.</li>
  <li>Genera el enlace y cópialo. Empieza por <span class="code">https://u-tad.blackboard.com/webapps/calendar/calendarFeed/</span></li></ol>
  <div class="campo"><label for="bb-url">Enlace de tu calendario</label><input id="bb-url" type="url" autocomplete="off" spellcheck="false" placeholder="https://u-tad.blackboard.com/webapps/calendar/calendarFeed/…/learn.ics"></div>
  ${REAL?.bbError ? `<p class="error">Blackboard no ha devuelto tu calendario (${esc(REAL.bbError)}). Si lo regeneraste, pega el enlace nuevo.</p>` : ''}
  <p style="margin:12px 0 0"><button class="btn" id="btn-bb" onclick="conectarBB()">Importar mis entregas</button></p>
  <p class="note" style="margin:10px 0 0">Ese enlace es personal, como una contraseña de solo lectura: se guarda solo en tu cuenta y no se enseña a nadie. Nunca te pediremos tu contraseña de Blackboard. Lo puedes quitar en Ajustes.</p>`;
}
const ERR_BB = {enlace:'Ese no es el enlace del calendario de Blackboard de U-tad (acaba en /learn.ics).', 'no-responde':'Blackboard no ha devuelto un calendario con ese enlace.'};
async function conectarBB(){
  const url = document.getElementById('bb-url').value.trim(), b = document.getElementById('btn-bb');
  b.disabled = true; b.textContent = 'Leyendo tu calendario…';
  try { const r = await api('/blackboard', {method:'PUT', body:{url}}); toast(`Importadas ${r.entregas} entregas de Blackboard`); cargar(); }
  catch(e){ b.disabled = false; b.textContent = 'Importar mis entregas'; toast(ERR_BB[e.message] || 'No se ha podido importar'); }
}
async function quitarBB(){ await api('/blackboard', {method:'DELETE'}).catch(() => {}); toast('Enlace de Blackboard borrado'); cargar(); }

/* Aulas libres de verdad (según el horario de WebUntis); reservar sigue siendo en Classlife */
const AULAS = {};
function aulaReal(){
  const a = S.aula, d = (dias().find(x => x.k === a.dia) || dias()[0]).d, dia = isoDia(d);
  const hasta = String(+a.hora.slice(0,2) + 2).padStart(2,'0') + a.hora.slice(2), clave = `${dia}|${a.hora}|${hasta}`;
  if (!AULAS[clave]) { AULAS[clave] = 'cargando'; api(`/aulas?dia=${dia}&desde=${a.hora}&hasta=${hasta}`).then(r => { AULAS[clave] = r; pintar(); }).catch(() => { AULAS[clave] = 'error'; pintar(); }); }
  const r = AULAS[clave], ddmm = `${String(d.getDate()).padStart(2,'0')}%2F${String(d.getMonth()+1).padStart(2,'0')}%2F${d.getFullYear()}`;
  let cuerpo;
  if (r === 'cargando') cuerpo = '<p class="cargando">Buscando aulas libres…</p>';
  else if (r === 'error') cuerpo = '<p class="error">No se han podido leer las aulas. Prueba otra vez.</p>';
  else if (!r.conDatos) cuerpo = '<p class="note">Aún no hay horario de aulas de ese día (se lee la semana actual y la siguiente).</p>';
  else if (!r.libres.length) cuerpo = '<p class="note">Todas las aulas tienen clase en ese hueco.</p>';
  else cuerpo = r.libres.slice(0, S.aulaTodas ? 99 : 6).map(x => `<div class="fila"><span>${ic('aula')}</span><div><b>${esc(x.aula)}</b><small>${esc(x.edificio)} · ${x.hastaLas ? 'libre hasta las ' + x.hastaLas : 'libre el resto del día'}</small></div><a class="btn sm" target="_blank" rel="noopener" href="${CLASSLIFE_AULAS}?from=${ddmm}">Reservar</a></div>`).join('') +
    (r.libres.length > 6 && !S.aulaTodas ? `<p style="margin:8px 0 0"><button class="linkbtn" onclick="S.aulaTodas=true;pintar()">Ver las ${r.libres.length} aulas libres</button></p>` : '');
  return cab('aula','aula','Aulas libres','Según el horario de clases de WebUntis · se reserva en Classlife') +
    `<div class="lbl">Día</div><div class="seg">${dias().map(x => `<button aria-pressed="${a.dia===x.k}" onclick="S.aula.dia='${x.k}';S.aulaTodas=false;guardar();pintar()">${x.t} <span class="note">${fmt.format(x.d)}</span></button>`).join('')}</div>
     <div class="lbl">Desde · 2 h</div><div class="seg">${AULA_HORAS.map(h => `<button aria-pressed="${a.hora===h}" onclick="S.aula.hora='${h}';S.aulaTodas=false;guardar();pintar()">${h}</button>`).join('')}</div>
     <div class="lbl">${r && r.libres ? r.libres.length + ' aulas sin clase de ' + a.hora + ' a ' + hasta : 'Aulas sin clase'}</div>${cuerpo}
     <p class="note" style="margin:10px 0 0">«Reservar» abre «Reserva de Aulas» de Classlife en ese día. Las reservas de otros alumnos solo las ve Classlife.</p>`;
}

/* Ajustes: grupos, Blackboard, salir */
V.ajustes = () => `<div class="row"><h3>Ajustes</h3><span class="note">${esc(REAL.correo)}</span></div>
  <h3 class="sub">Tus grupos</h3><p>${REAL.grupos.map(g => `<span class="pill ok">${esc(g)}</span>`).join(' ')} <a href="#/grupos" style="margin-left:8px">Cambiar</a></p>
  <h3 class="sub">Blackboard</h3>${REAL.bb ? `<p>Tus entregas se leen de tu calendario de Blackboard. <button class="linkbtn" onclick="quitarBB()">Quitar el enlace</button></p>` : `<div class="tarj">${migrarHTML()}</div>`}
  <h3 class="sub">App en el móvil</h3>${instalarHTML(true) || '<p class="note">Greenboard ya está instalada en este dispositivo, o este navegador no permite instalarla.</p>'}
  <h3 class="sub">Sesión</h3><p><button class="btn dark" onclick="salir()">Cerrar sesión</button></p>
  <p class="note">Horario actualizado: ${esc(REAL.generado || '—')}. Asistencia, comunidad, pádel y matrícula siguen siendo de ejemplo.</p>`;

/* Instalar como app. Android y Chrome: el aviso nativo (beforeinstallprompt). iPhone y iPad: no hay aviso, se
   explica el gesto (Compartir -> Añadir a pantalla de inicio). Abierta ya como app, no se enseña nada. */
let AVISO_INSTALAR = window.__avisoInstalar || null;   // capturado en arranque.js
const instalada = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let INSTALAR_CERRADO = false; try { INSTALAR_CERRADO = localStorage.getItem('gb-instalar-cerrado') === '1'; } catch(e){}
function instalarHTML(siempre){
  if (instalada() || (INSTALAR_CERRADO && !siempre)) return '';
  const x = siempre ? '' : `<button class="cerrar" aria-label="No mostrar más" onclick="cerrarInstalar()">${ic('cerrar')}</button>`;
  if (AVISO_INSTALAR) return `<div class="instalar" id="instalar"><img src="icons/icon-192.png" alt=""><p><b>Instala Greenboard</b>Ábrela como una app, desde tu pantalla de inicio.</p><button class="btn sm" onclick="instalar()">Instalar</button>${x}</div>`;
  if (esIOS()) return `<div class="instalar" id="instalar"><img src="icons/icon-192.png" alt=""><p><b>Añadir a pantalla de inicio</b>Toca <span class="compartir" aria-label="Compartir">↑</span> Compartir y luego «Añadir a pantalla de inicio».</p>${x}</div>`;
  return '';
}
function cerrarInstalar(){ INSTALAR_CERRADO = true; try { localStorage.setItem('gb-instalar-cerrado','1'); } catch(e){} pintar(); }
async function instalar(){
  if (!AVISO_INSTALAR) return;
  AVISO_INSTALAR.prompt();
  const r = await AVISO_INSTALAR.userChoice.catch(() => null);
  AVISO_INSTALAR = null; pintar();
  if (r && r.outcome === 'accepted') toast('Greenboard instalada');
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); AVISO_INSTALAR = e; pintar(); });
window.addEventListener('appinstalled', () => { AVISO_INSTALAR = null; pintar(); });

function arrancar(){
  const m = location.hash.match(/entrar=([A-Za-z0-9_-]{20,})/);
  if (m){ history.replaceState(null, '', location.pathname + location.search + '#/inicio');
    api('/verificar', {method:'POST', body:{enlace:m[1]}}).then(r => { TOKEN = r.token; try { localStorage.setItem('gb-token', TOKEN); } catch(e){} cargar(); })
      .catch(() => { PUERTA = {error:'Ese enlace ya no vale (dura 15 minutos y sirve una vez). Pide otro.'}; pintar(); });
    return;
  }
  if (!DEMO && TOKEN) cargar(); else pintar();
}
