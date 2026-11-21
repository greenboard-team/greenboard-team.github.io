/* Greenboard · app del MVP (/mvp/) · datos
   Iconos, datos de ejemplo (de data/*.json, en DATOS), estado de la demo y fechas. */

/* ---------- Iconos ---------- */
const P = {
  buscar:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', cerrar:'<path d="M6 6l12 12M18 6L6 18"/>',
  aviso:'<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM16 8a5 5 0 0 1 0 8"/>',
  cal:'<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  doc:'<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  pin:'<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  check:'<path d="M5 12l5 5 9-10"/>', asis:'<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>',
  uni:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c3 0 6 1.8 6 5.5"/>',
  padel:'<ellipse cx="10" cy="9" rx="6" ry="7"/><path d="M14 14l6 6"/><circle cx="19" cy="5" r="1.5"/>',
  aula:'<path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-6h6v6"/>', libro:'<path d="M4 4h10a4 4 0 0 1 4 4v13H8a4 4 0 0 1-4-4z"/><path d="M4 17a4 4 0 0 1 4-4h10"/>',
  reloj:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', chispa:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>'
};
const ic = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
/* ---------- Datos ----------
   Los de ejemplo viven en data/*.json (arranque.js los carga en DATOS antes que este fichero).
   Con sesión, asignaturas, horario y entregas se sustituyen por los reales (real.js). */
let SUBJECTS = DATOS.asignaturas;
let DUE = DATOS.entregas;
let TODAY = DATOS.hoy;
let ASIS = DATOS.asistencia;
const ASIS_DEF = DATOS.asistenciaPorDefecto;
const COMUNIDAD = DATOS.comunidad;
const PADEL_HORAS = DATOS.padel.horas, PADEL_OCUPADAS = DATOS.padel.ocupadas;
const AULA_HORAS = DATOS.aulas.horas;
const AULAS_LIBRES = DATOS.aulas.libres;
const CONTENIDO = DATOS.contenido;
const NOTAS = DATOS.notas;
const CHATS = DATOS.chats;
const subj = id => SUBJECTS.find(s => s.id===id) || {id:'', n:'Blackboard', c:''};
/* Asignatura con la asistencia de ejemplo y nombre que saluda (los reales llegan al entrar) */
let ASIS_ID = 'aiii', NOMBRE = 'Gonzalo';
const corto = s => s.n.split(':')[0];
/* Toda asignatura tiene su chat de clase (id = id de la asignatura); los que no tienen mensajes de ejemplo arrancan con uno de bienvenida */
SUBJECTS.forEach(s => { if (!CHATS.some(c => c.id===s.id)) CHATS.push({id:s.id, s:s.id, t:corto(s)+' · clase', n:30, sinLeer:0,
  msgs:[{de:'Delegación de clase', h:'lun', txt:`Chat de la clase de ${corto(s)}: dudas, avisos y material.`}]}); });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* Media de lo ya publicado (ponderada) y nota acumulada sobre 10 */
function media(id){
  const l = NOTAS[id] || [], hechas = l.filter(x => x.n!=null), peso = hechas.reduce((a,x) => a+x.p, 0);
  return {media: peso ? hechas.reduce((a,x) => a+x.n*x.p, 0)/peso : null, evaluado: peso, acumulada: hechas.reduce((a,x) => a+x.n*x.p, 0)/100};
}
const num = n => n==null ? '–' : n.toLocaleString('es-ES',{minimumFractionDigits:1, maximumFractionDigits:1});
const sinLeer = () => CHATS.reduce((a,c) => a + (S.leidos[c.id] ? 0 : c.sinLeer), 0);

/* ---------- Estado de la demo (sesión del navegador, si se puede) ---------- */
const INI = {archivo:null, justificado:false, com:{}, mat:false, guia:true, avisoCerrado:false,
             abiertas:[], padel:{dia:null, hora:null, hecho:null}, aula:{dia:'hoy', hora:'16:00', hecho:null},
             chats:{}, leidos:{}};
let S = JSON.parse(JSON.stringify(INI));
try{ Object.assign(S, JSON.parse(sessionStorage.getItem('gb-mvp2')||'{}')); }catch(e){}
const guardar = () => { try{ sessionStorage.setItem('gb-mvp2', JSON.stringify(S)); }catch(e){} };
function reiniciar(){ S = JSON.parse(JSON.stringify(INI)); guardar(); location.hash = '#/inicio'; pintar(); }

/* ---------- Fechas (con la fecha real, como el mock-up) ---------- */
const fmt = new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short'});
const fmtH = new Intl.DateTimeFormat('es-ES',{hour:'2-digit',minute:'2-digit'});
const fmtDia = new Intl.DateTimeFormat('es-ES',{weekday:'short',day:'numeric',month:'short'});
const fmtLargo = new Intl.DateTimeFormat('es-ES',{weekday:'long',day:'numeric',month:'long'});
const haceDias = n => { const d = new Date(); d.setDate(d.getDate()-n); return d; };
const ahora = new Date();
/* Día de clase que enseña el horario: hoy entre semana; el sábado y el domingo, el lunes siguiente */
let finde = [0,6].includes(ahora.getDay());
let diaClase = (() => { const d = new Date(); if (finde) d.setDate(d.getDate() + (d.getDay()===6 ? 2 : 1)); return d; })();
let cuandoClase = finde ? 'el lunes' : 'hoy';
let minutosAhora = finde ? -1 : ahora.getHours()*60 + ahora.getMinutes();
const tituloHorario = () => REAL ? (esHoy(diaClase) ? 'Horario de hoy' : 'Próximas clases') : (finde ? 'Horario del lunes' : 'Horario de hoy');
const esHoy = d => d.toDateString() === new Date().toDateString();
function avisoHTML(){
  if (!REAL) return `<b>Aviso:</b> Proyectos III cambia al <b>aula 112</b> ${cuandoClase} a las 11:00. Ya está actualizado en tu horario.`;
  const c = REAL.cambios[0]; if (!c) return '';
  const cuando = `${fmtDia.format(new Date(c.d+'T12:00'))} a las ${c.h}`, n = REAL.cambios.length;
  const otro = n > 1 ? ` <a href="#" onclick="abrir('horario');return false">y ${n-1} cambio${n>2?'s':''} más</a>` : '';
  return `<b>Aviso:</b> ${cambioFrase(c, cuando)}${otro}. Sale de WebUntis y ya está en tu horario.`;
}
const aMin = h => { const [a,b] = h.split(':').map(Number); return a*60+b; };
function pill(iso){
  if (new Date(iso) < new Date()) return '<span class="pill late">vencida</span>';
  const d0 = new Date(); d0.setHours(0,0,0,0); const dd = new Date(iso); dd.setHours(0,0,0,0);
  const d = Math.round((dd - d0)/864e5);   // días de calendario, no horas
  if (d <= 2) return `<span class="pill soon">${ic('cal')}${['hoy','mañana','en 2 días'][d]}</span>`;
  return `<span class="pill ok">${ic('cal')}${fmt.format(new Date(iso))}</span>`;
}
/* Días para reservar: hoy, mañana y el próximo viernes (si no es hoy ni mañana) */
const hastaViernes = () => (5 - new Date().getDay() + 7) % 7;   // 0 si hoy es viernes
function dias(){
  const h0 = new Date(); h0.setHours(0,0,0,0);
  const en = n => { const d = new Date(h0); d.setDate(d.getDate()+n); return d; };
  const out = [{k:'hoy', t:'Hoy', d:en(0)}, {k:'manana', t:'Mañana', d:en(1)}];
  if (hastaViernes() >= 2) out.push({k:'viernes', t:'Viernes', d:en(hastaViernes())});
  return out;
}
/* «viernes» puede ser hoy o mañana: se traduce al botón que existe */
function diaValido(k){
  if (dias().some(d => d.k===k)) return k;
  if (k==='viernes') return hastaViernes()===1 ? 'manana' : 'hoy';
  return 'hoy';
}
const yaPasada = (dia, h) => dia==='hoy' && aMin(h) <= new Date().getHours()*60 + new Date().getMinutes();
const padelOcupada = (dia, h) => (PADEL_OCUPADAS.includes(h) && dia!=='hoy') || yaPasada(dia, h);
const diaTxt = k => { const d = dias().find(x => x.k===k) || dias()[0]; return d.t + ', ' + fmt.format(d.d); };
const ses = id => ASIS[id] || ASIS_DEF;
