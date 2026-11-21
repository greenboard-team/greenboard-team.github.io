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
   Asignaturas, códigos y entregas: los reales de Blackboard del mock-up de Gonzalo (26/10/2026).
   Horario, aulas, asistencia, compañeros, huecos de pádel y aulas libres: de ejemplo. Las pistas de pádel de U-tad sí existen (de pago); no sabemos por dónde se reservan hoy. */
let SUBJECTS = [
  {id:'opti', n:"Optimización", c:"2609_MAIS4_OPTI_A"},
  {id:'psdi', n:"Programación de Sistemas Distribuidos", c:"2609_MAIS3_PSDI_A_FIIS3_A"},
  {id:'aaui', n:"Aprendizaje Automático I", c:"2609_MAIS4_AAUI_A_FIIS4_A"},
  {id:'pro3', n:"Proyectos III: Desarrollo Web y Apps", c:"2609_MAIS4_PRO3_A_FIIS4_A", p:"Alberto León Martín"},
  {id:'esal', n:"Estructuras Algebraicas", c:"2609_MAIS4_ESAL_A", last:"Nuevo: Grupos 7 · Homomorfismos.pdf"},
  {id:'aiii', n:"Análisis Matemático III", c:"2609_MAIS4_AIII_A", last:"Calificación publicada: Asistencia"},
  {id:'isof', n:"Ingeniería del Software", c:"2609_MAIS4_ISOF_A_FIIS4_A_INSG_A", last:"Nuevo contenido añadido"}
];
let DUE = [
  {t:"Entregables 1", s:'opti', d:"2026-10-23T10:48"},
  {t:"Práctica 1", s:'psdi', d:"2026-10-28T23:59"},
  {t:"Proyecto I: Gemstone prices", s:'aaui', d:"2026-11-09T23:59"},
  {t:"SPRINT 2 · Presentación de 7 min", s:'pro3', d:"2026-11-10T23:59"},
  {t:"Participación", s:'esal', d:"2026-12-22T11:01"}
];
let TODAY = [
  {h:"09:00", f:"10:30", s:'aiii', a:"Aula 201"},
  {h:"11:00", f:"12:30", s:'pro3', a:"Aula 112", antes:"Aula 003", changed:true},
  {h:"15:00", f:"16:30", s:'opti', a:"Aula 104"}
];
let ASIS = { aiii:[{dias:1,v:0},{dias:3,v:1},{dias:8,v:1},{dias:10,v:1},{dias:15,v:1}] };
const ASIS_DEF = [{dias:2,v:1},{dias:7,v:1},{dias:9,v:1},{dias:14,v:1}];
const COMUNIDAD = [
  {id:'apuntes', t:"Apuntes de Análisis Matemático III", s:"Compartidos por un alumno de 5.º · curso 2025/26", accion:"Pedir acceso", hecho:"Solicitud enviada",
   det:["Tema 1 · Sucesiones y series de funciones","Tema 2 · Integrales de línea","Tema 3 · Integrales de superficie","Exámenes resueltos 2025/26"]},
  {id:'repaso', t:"Repaso de Optimización", s:"Sesión de apoyo en grupo · jueves 18:00", accion:"Apuntarme", hecho:"Apuntado",
   det:["Jueves, 18:00 – 19:30","Lo da un alumno que ya aprobó la asignatura","Grupo pequeño: trae tus dudas de la hoja de ejercicios"]}
];
const PADEL_HORAS = ["17:00","18:00","19:00","20:00"], PADEL_OCUPADAS = ["18:00"];
const AULA_HORAS = ["10:00","12:00","14:00","16:00","18:00"];
const AULAS_LIBRES = [{a:"Aula 104", cap:"30 plazas"},{a:"Aula 201", cap:"40 plazas"},{a:"Aula 003", cap:"12 plazas · con pizarra"}];
/* Contenido de cada asignatura, ordenado por tema como en Blackboard pero limpio.
   Reales: los títulos de Proyectos III (Proyecto Q1) y «Grupos 7 · Homomorfismos.pdf». El resto, de ejemplo.
   La guía docente va siempre primero; su evaluación sale de NOTAS. */
const CONTENIDO = {
  opti:[{u:'Tema 1 · Programación lineal', items:[{t:'Apuntes · Tema 1.pdf'},{t:'Ejercicios · Tema 1.pdf'}]},
        {u:'Tema 2 · Método símplex', items:[{t:'Apuntes · Tema 2.pdf'},{t:'Ejercicios · Tema 2.pdf'},{t:'Entregables 1 · enunciado', tipo:'enunciado'}]},
        {u:'Tema 3 · Dualidad', items:[{t:'Apuntes · Tema 3.pdf', nuevo:true}]}],
  psdi:[{u:'Tema 1 · Introducción a los sistemas distribuidos', items:[{t:'Transparencias · Tema 1.pdf'}]},
        {u:'Tema 2 · Sockets y RPC', items:[{t:'Transparencias · Tema 2.pdf'},{t:'Código de ejemplo', tipo:'enlace'}]},
        {u:'Prácticas', items:[{t:'Práctica 1 · enunciado', tipo:'enunciado'}]}],
  aaui:[{u:'Tema 1 · Regresión', items:[{t:'Apuntes · Regresión.pdf'},{t:'Notebook · Regresión lineal', tipo:'enlace'}]},
        {u:'Tema 2 · Clasificación', items:[{t:'Apuntes · Clasificación.pdf'}]},
        {u:'Proyectos', items:[{t:'Proyecto I: Gemstone prices · enunciado', tipo:'enunciado'}]}],
  pro3:[{u:'Proyecto Q1', items:[{t:'SPRINT 1 - Presentación 10 min', tipo:'enunciado'},{t:'SPRINT 2 - Presentación de 7 min', tipo:'enunciado'}]},
        {u:'Recursos', items:[{t:'Normas de los sprints.pdf'}]}],
  esal:[{u:'Tema 1 · Grupos', items:[{t:'Grupos 6 · Subgrupos normales.pdf'},{t:'Grupos 7 · Homomorfismos.pdf', nuevo:true}]},
        {u:'Tema 2 · Anillos', items:[{t:'Disponible a partir del tema 2', tipo:'pronto'}]}],
  aiii:[{u:'Tema 1 · Sucesiones y series de funciones', items:[{t:'Apuntes · Tema 1.pdf'},{t:'Hoja de problemas 1.pdf'}]},
        {u:'Tema 2 · Integrales de línea', items:[{t:'Apuntes · Tema 2.pdf'},{t:'Hoja de problemas 2.pdf'}]},
        {u:'Tema 3 · Integrales de superficie', items:[{t:'Apuntes · Tema 3.pdf', nuevo:true}]}],
  isof:[{u:'Tema 1 · Procesos de desarrollo', items:[{t:'Transparencias · Tema 1.pdf'}]},
        {u:'Tema 2 · Requisitos', items:[{t:'Transparencias · Tema 2.pdf', nuevo:true},{t:'Plantilla de requisitos.docx'}]}]
};
/* Calificaciones de ejemplo: cada asignatura con sus partes, su peso (%) y la nota si ya está publicada */
const NOTAS = {
  opti:[{t:'Entregables 1', p:20, n:7.8},{t:'Entregables 2', p:20, n:null},{t:'Examen parcial', p:20, n:6.5},{t:'Examen final', p:40, n:null}],
  psdi:[{t:'Práctica 1', p:25, n:8.5},{t:'Práctica 2', p:25, n:null},{t:'Examen', p:50, n:null}],
  aaui:[{t:'Proyecto I: Gemstone prices', p:30, n:9.0},{t:'Proyecto II', p:30, n:null},{t:'Examen', p:40, n:null}],
  pro3:[{t:'SPRINT 1 · Presentación 10 min', p:15, n:8.0},{t:'SPRINT 2 · Presentación de 7 min', p:15, n:null},{t:'SPRINT 3', p:15, n:null},{t:'Proyecto final', p:55, n:null}],
  esal:[{t:'Participación', p:10, n:null},{t:'Examen parcial', p:30, n:5.5},{t:'Examen final', p:60, n:null}],
  aiii:[{t:'Asistencia', p:10, n:8.0, nuevo:true},{t:'Examen parcial', p:30, n:6.8},{t:'Examen final', p:60, n:null}],
  isof:[{t:'Práctica 1', p:30, n:7.0},{t:'Examen', p:70, n:null}]
};
/* Chats de clase (idea del issue #43): uno por asignatura o por grupo. Personas y mensajes de ejemplo */
const CHATS = [
  {id:'pro3', s:'pro3', t:'Proyectos III · clase', n:28, sinLeer:2, msgs:[
    {de:'Marta', h:'10:12', txt:'¿Alguien sabe si el Sprint 3 también es una presentación?'},
    {de:'Álex', h:'10:15', txt:'Creo que sí, lo dijeron en clase el martes.'},
    {de:'Marta', h:'10:16', txt:'Ok, gracias. Y el lunes estamos en el aula 112, no en la 003.'}]},
  {id:'aiii', s:'aiii', t:'Análisis Matemático III · clase', n:41, sinLeer:1, msgs:[
    {de:'Lucía', h:'ayer', txt:'¿Alguien tiene resuelto el ejercicio 4 de la hoja 2?'},
    {de:'Iván', h:'09:40', txt:'Ya han subido los apuntes del tema 3.'}]},
  {id:'psdi-g', s:'psdi', grupo:true, t:'Grupo de prácticas · PSDI', n:3, sinLeer:0, msgs:[
    {de:'Sara', h:'jue', txt:'Yo hago la parte del servidor de la práctica 2.'},
    {de:'Tú', h:'jue', txt:'Perfecto, yo el cliente.', yo:true}]},
  {id:'repaso', t:'Repaso de Optimización', n:9, sinLeer:0, msgs:[
    {de:'Organiza: alumno de 5.º', h:'lun', txt:'El jueves a las 18:00 repasamos el método símplex. Traed dudas.'}]}
];
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
             abiertas:[], padel:{dia:null, hora:null, hecho:null}, aula:{dia:'hoy', hora:'16:00', hecho:null}, usoBarra:false,
             chats:{}, leidos:{}};
let S = JSON.parse(JSON.stringify(INI));
try{ Object.assign(S, JSON.parse(sessionStorage.getItem('gb-mvp2')||'{}')); }catch(e){}
const guardar = () => { try{ sessionStorage.setItem('gb-mvp2', JSON.stringify(S)); }catch(e){} };
function reiniciar(){ S = JSON.parse(JSON.stringify(INI)); guardar(); location.hash = '#/inicio'; render(); }

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
  const d = Math.ceil((new Date(iso) - new Date())/864e5);
  if (new Date(iso) < new Date()) return '<span class="pill late">vencida</span>';
  if (d <= 2) return `<span class="pill soon">${ic('cal')}${d<=1?'mañana':'en '+d+' días'}</span>`;
  return `<span class="pill ok">${ic('cal')}${fmt.format(new Date(iso))}</span>`;
}
/* Días para reservar: hoy, mañana y el próximo viernes (si no es hoy ni mañana) */
function dias(){
  const out = [{k:'hoy', t:'Hoy', d:new Date()}];
  const m = new Date(); m.setDate(m.getDate()+1); out.push({k:'manana', t:'Mañana', d:m});
  const v = new Date(); v.setDate(v.getDate() + ((5 - v.getDay() + 7) % 7 || 7));
  if (![0,1].includes(Math.round((v - new Date().setHours(0,0,0,0))/864e5))) out.push({k:'viernes', t:'Viernes', d:v});
  return out;
}
const diaTxt = k => { const d = dias().find(x => x.k===k) || dias()[0]; return d.t + ', ' + fmt.format(d.d); };
const ses = id => ASIS[id] || ASIS_DEF;

/* ---------- Catálogo de la barra: todo lo que se puede pedir desde Inicio ---------- */
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const ACCIONES = [
  {id:'padel', tipo:'Reserva', t:'Reservar pista de pádel', s:'Pistas de U-tad, de pago · idea de Gonzalo', ico:'padel', k:'padel pista deporte jugar raqueta'},
  {id:'aula', tipo:'Reserva', t:'Reservar un aula', s:'Reserva de Aulas (hoy en Classlife)', ico:'aula', k:'aula sala reservar estudiar estudio grupo reserva de aulas'},
  {id:'justificante', tipo:'Trámite', t:'Justificar una falta', s:'Sube el justificante junto a la falta', ico:'asis', k:'justificar justificante falta asistencia faltas medico'},
  {id:'horario', tipo:'Horario', t:'¿Dónde tengo clase?', s:'Tu horario de hoy con los cambios', ico:'pin', k:'donde clase aula horario hoy siguiente proxima'},
  {id:'entregas', tipo:'Entregas', t:'Próximas entregas', s:'Todas tus asignaturas, por fecha', ico:'doc', k:'entregas entrega deberes practica tareas'},
  {id:'matricula', tipo:'Trámite', t:'Ver matrícula firmada', s:'Matrícula 2026/27', ico:'doc', k:'matricula certificado documento'},
  ...COMUNIDAD.map(c => ({id:'com-'+c.id, tipo:'Comunidad', t:c.t, s:c.s, ico:'uni', k:'comunidad apuntes repaso apoyo companeros ' + c.t})),
  ...SUBJECTS.map(s => ({id:'asig-'+s.id, tipo:'Asignatura', t:s.n, s:s.c, ico:'libro', k:s.n + ' asignatura'})),
  {id:'notas', tipo:'Notas', t:'Mis calificaciones', s:'Media de cada asignatura', ico:'asis', k:'notas calificaciones media nota examen aprobado', prio:12},
  ...SUBJECTS.map(s => ({id:'notas-'+s.id, tipo:'Notas', t:'Notas de '+corto(s), s:'Media '+num(media(s.id).media)+' · evaluado '+media(s.id).evaluado+' %', ico:'asis', k:'notas calificaciones media '+s.n})),
  {id:'mensajes', tipo:'Mensajes', t:'Mensajes', s:'Chats de clase y de grupo', ico:'uni', k:'mensajes chat chats clase grupo hablar escribir', prio:12},
  ...CHATS.map(c => ({id:'chat-'+c.id, tipo:'Chat', t:c.t, s:c.n+' personas', ico:'uni', k:'chat mensajes '+c.t})),
  ...SUBJECTS.map(s => ({id:'cont-'+s.id, tipo:'Contenido', t:'Guía docente de '+corto(s), s:'Contenido por temas', ico:'libro', k:'guia docente contenido temas materiales '+s.n})),
  ...SUBJECTS.flatMap(s => (CONTENIDO[s.id]||[]).flatMap(u => u.items.filter(x => x.tipo!=='pronto').map(x => ({id:'cont-'+s.id, tipo:'Material', t:x.t, s:corto(s)+' · '+u.u, ico:'doc', k:'apuntes material pdf '+u.u+' '+x.t}))))
];
const VACIAS = new Set(['el','la','los','las','de','del','a','al','un','una','para','me','mi','quiero','en','y','por','favor','reservar','reserva','ver','las','hoy','manana','viernes','lunes','martes','miercoles','jueves','sabado','domingo','tarde','manana']);
/* Puntúa cada acción con las palabras escritas; entiende frases como «reservar pádel viernes a las 19» */
function buscar(q){
  const limpia = s => norm(s).replace(/[·:]/g,' ').replace(/\s+/g,' ').trim();
  const nq = limpia(q); if (!nq) return [];
  const palabras = nq.split(/\s+/).filter(w => w && !VACIAS.has(w) && !/^\d/.test(w));
  return ACCIONES.map(a => {
    const nt = limpia(a.t), nk = norm(a.k + ' ' + a.t);
    let p = 0;
    if (nt.startsWith(nq)) p += 6;
    if (nt.includes(nq)) p += 3;
    const toks = nk.split(/[\s:·]+/);
    for (const w of palabras){ if (toks.some(t => t.startsWith(w))) p += 4; else if (nk.includes(w)) p += 2; }
    if (!palabras.length && /reserv/.test(nq) && a.tipo==='Reserva') p += 3;
    return {a, p};
  }).filter(x => x.p > 0).map(x => ({a:x.a, p:x.p + (palabras.length <= 1 ? (x.a.prio||0) : 0)})).sort((x,y) => y.p - x.p).slice(0,6).map(x => x.a);
}
function parametros(q){
  const n = norm(q), r = {};
  if (/\bviernes\b/.test(n)) r.dia = 'viernes'; else if (/\bmanana\b/.test(n)) r.dia = 'manana'; else if (/\bhoy\b|\besta tarde\b/.test(n)) r.dia = 'hoy';
  const h = n.match(/\b(?:a las\s*)?(\d{1,2})(?::(\d{2}))?\s*(?:h\b)?/);
  if (h && +h[1] >= 7 && +h[1] <= 22) r.hora = String(h[1]).padStart(2,'0') + ':' + (h[2]||'00');
  return r;
}
function resaltar(t, q){
  const nq = norm(q).trim().split(/\s+/).filter(w => w.length > 1 && !VACIAS.has(w))[0]; if (!nq) return t;
  const i = norm(t).indexOf(nq); if (i < 0) return t;
  return t.slice(0,i) + '<mark>' + t.slice(i, i+nq.length) + '</mark>' + t.slice(i+nq.length);
}

/* Chips de contexto: cambian con la hora y con tus datos */
function chips(){
  const out = [];
  const sig = TODAY.find(c => aMin(c.f) > minutosAhora);
  if (sig) out.push({id:'horario', t:`${corto(subj(sig.s))} · ${finde ? 'lun ' : ''}${sig.h} · ${sig.a}`, ico:'pin', por: sig.changed ? 'aula nueva' : 'siguiente'});
  if (!S.justificado) out.push({id:'justificante', t:'Subir justificante', ico:'asis', rojo:true, por:'1 falta'});
  const vie = ahora.getDay()===5;
  out.push({id:'padel', t: vie && ahora.getHours() >= 12 ? 'Reservar pádel esta tarde' : 'Reservar pádel el viernes', ico:'padel', q: vie ? 'pádel hoy' : 'pádel viernes'});
  out.push({id:'aula', t:'Reservar aula para estudiar', ico:'aula'});
  if (!S.com.apuntes) out.push({id:'com-apuntes', t:'Apuntes de Análisis III', ico:'uni', por:'comunidad'});
  if (sinLeer()) out.push({id:'mensajes', t:`Mensajes · ${sinLeer()} sin leer`, ico:'uni'});
  out.push({id:'notas-aiii', t:'Nota nueva: Asistencia', ico:'asis', por:'Análisis III'});
  return out;
}

/* ---------- Tarjetas que se abren en Inicio ---------- */
/* Lo que ya está en el panel no se duplica: se lleva hasta su tarjeta y se resalta */
const EN_PANEL = {horario:'t-horario', justificante:'t-asis', entregas:'t-entregas'};
function abrir(id, q){
  if (EN_PANEL[id]){
    cerrarSug(); const qi = document.getElementById('q'); if (qi){ qi.value = ''; qi.blur(); }
    const ir = () => { const el = document.getElementById(EN_PANEL[id]); if (!el) return; el.scrollIntoView({behavior:'smooth', block:'start'}); el.classList.add('accion'); setTimeout(() => el.classList.remove('accion'), 1800); };
    if (ruta()!=='inicio'){ location.hash = '#/inicio'; setTimeout(ir, 60); } else ir();
    return;
  }
  if (q){ const p = parametros(q); if (id==='padel'){ if (p.dia) S.padel.dia = p.dia; if (p.hora && PADEL_HORAS.includes(p.hora)) S.padel.hora = p.hora; }
          if (id==='aula'){ if (p.dia) S.aula.dia = p.dia; if (p.hora && AULA_HORAS.includes(p.hora)) S.aula.hora = p.hora; } }
  if (id==='padel' && !S.padel.dia) S.padel.dia = dias().some(d => d.k==='viernes') ? 'viernes' : 'hoy';
  S.abiertas = [id, ...S.abiertas.filter(x => x!==id)];
  S.usoBarra = true; guardar();
  cerrarSug(); document.getElementById('q').value = '';
  if (ruta()!=='inicio') location.hash = '#/inicio'; else pintar();
  requestAnimationFrame(() => { const el = document.getElementById('a-'+id); if (el) el.scrollIntoView({behavior:'smooth', block:'nearest'}); });
}
function cerrarTarj(id){ S.abiertas = S.abiertas.filter(x => x!==id); guardar(); pintar(); }
const cab = (id, icono, titulo, sub) => `<div class="tarj-h"><span class="ic">${ic(icono)}</span><h4>${titulo}${sub?`<small>${sub}</small>`:''}</h4><button class="cerrar" aria-label="Cerrar" onclick="cerrarTarj('${id}')">${ic('cerrar')}</button></div>`;

const T = {};
T.padel = () => {
  const p = S.padel;
  if (p.hecho) return cab('padel','padel','Pista de pádel reservada','Pistas de U-tad, de pago · horarios de ejemplo') +
    `<div class="hecho">${ic('check')}<span>${p.hecho}</span></div><p class="note">Te lo recordaremos ese día. En la demo no se reserva ni se paga nada de verdad.</p>
     <button class="linkbtn" onclick="S.padel.hecho=null;guardar();pintar()">Cancelar reserva</button>`;
  return cab('padel','padel','Reservar pista de pádel','Pistas de U-tad, de pago · horarios de ejemplo') +
    `<div class="lbl">Día</div><div class="seg">${dias().map(d => `<button aria-pressed="${p.dia===d.k}" onclick="S.padel.dia='${d.k}';S.padel.hora=null;guardar();pintar()">${d.t} <span class="note">${fmt.format(d.d)}</span></button>`).join('')}</div>
     <div class="lbl">Hora · 1 h</div><div class="slots">${PADEL_HORAS.map(h => { const occ = PADEL_OCUPADAS.includes(h) && p.dia!=='hoy';
       return `<button class="slot" ${occ?'disabled':''} aria-pressed="${p.hora===h}" onclick="S.padel.hora='${h}';guardar();pintar()">${h}<small>${occ?'ocupada':'Pista '+(1+PADEL_HORAS.indexOf(h)%2)}</small></button>`; }).join('')}</div>
     <button class="btn" id="reservar-padel" ${p.hora?'':'disabled'} onclick="reservarPadel()">${p.hora ? 'Reservar '+diaTxt(p.dia).split(',')[0].toLowerCase()+' a las '+p.hora : 'Elige una hora'}</button>`;
};
T.aula = () => REAL ? aulaReal() : aulaDemo();
function aulaDemo(){
  const a = S.aula;
  if (a.hecho) return cab('aula','aula','Aula reservada','En la app real, trámite «Reserva de Aulas» de Classlife') +
    `<div class="hecho">${ic('check')}<span>${a.hecho}</span></div><button class="linkbtn" onclick="S.aula.hecho=null;guardar();pintar()">Cancelar reserva</button>`;
  return cab('aula','aula','Reservar un aula','En la app real, trámite «Reserva de Aulas» de Classlife') +
    `<div class="lbl">Día</div><div class="seg">${dias().map(d => `<button aria-pressed="${a.dia===d.k}" onclick="S.aula.dia='${d.k}';guardar();pintar()">${d.t}</button>`).join('')}</div>
     <div class="lbl">Hora · 2 h</div><div class="seg">${AULA_HORAS.map(h => `<button aria-pressed="${a.hora===h}" onclick="S.aula.hora='${h}';guardar();pintar()">${h}</button>`).join('')}</div>
     <div class="lbl">Aulas libres <span class="demo-flag">de ejemplo</span></div>
     ${AULAS_LIBRES.map(x => `<div class="fila"><span>${ic('aula')}</span><div><b>${x.a}</b><small>${x.cap}</small></div><button class="btn sm" onclick="S.aula.hecho='${x.a} · '+diaTxt(S.aula.dia)+' · '+S.aula.hora;guardar();pintar();toast('Aula reservada (demo)')">Reservar</button></div>`).join('')}`;
}
T.matricula = () => cab('matricula','doc','Matrícula firmada','Documento de ejemplo') +
  `<div class="doc"><h5>Matrícula 2026/27 · ejemplo</h5>Alumno: ${REAL ? NOMBRE : 'Gonzalo Martínez Fernández'}<br>Titulación: ${REAL ? REAL.grupos.join(' + ') : 'Doble Grado MAIS, 4.º curso'}<br>Asignaturas: ${SUBJECTS.length}<br><span class="note">En la app real sería el PDF firmado de Secretaría.</span></div>`;
function tarjetaCom(c){
  return cab('com-'+c.id,'uni',c.t,c.s) + `<div class="asis">${c.det.map(d => `<div class="ses" style="grid-template-columns:1fr auto"><span>${d}</span>${c.id==='apuntes'?`<span class="pill ${S.com[c.id]?'soon':'late'}">${S.com[c.id]?'pendiente':'sin acceso'}</span>`:''}</div>`).join('')}</div>
   <p style="margin:12px 0 0"><button class="btn" id="btn-${c.id}" ${S.com[c.id]?'disabled':''} onclick="comAccion('${c.id}')">${S.com[c.id]?'✓ '+c.hecho:c.accion}</button></p>`;
}
function tarjetaAsig(s){
  const l = ses(s.id), pres = l.filter(x => x.v).length;
  const ents = DUE.filter(x => x.s===s.id);
  return cab('asig-'+s.id,'libro',s.n,s.c) + (s.p?`<p class="note" style="margin:0 0 6px">Profesor: ${s.p}</p>`:'') + (s.last?`<p class="note" style="margin:0 0 6px">${s.last}</p>`:'') +
    `<div class="lbl">Asistencia · ${pres} de ${l.length}</div><div class="mini-asis">${l.map(x => `<span class="${x.v?'':'c'}">${x.v}</span>`).join('')}</div>
     <div class="lbl" style="margin-top:12px">Entregas</div>${ents.length ? entregas(ents) : '<p class="note" style="margin:4px 0 0">No hay entregas publicadas.</p>'}
     <p style="margin:10px 0 0"><a class="vermas" href="#/asig/${s.id}">Ver asignatura →</a></p>`;
}
T.notas = () => cab('notas','asis','Calificaciones','Media de lo publicado · notas de ejemplo') +
  SUBJECTS.map(s => { const m = media(s.id); return `<a class="fila fila-e" href="#/asig/${s.id}/notas"><span class="ic">${ic('libro')}</span><div><b>${s.n}</b><small>Evaluado ${m.evaluado} %${(NOTAS[s.id]||[]).some(x=>x.nuevo)?' · nota nueva':''}</small></div><b class="media sm">${num(m.media)}</b></a>`; }).join('');
T.mensajes = () => cab('mensajes','uni','Mensajes', sinLeer() ? `${sinLeer()} sin leer` : 'Chats de clase y de grupo') + listaChats(true);
function tarjeta(id){
  let html = '';
  if (T[id]) html = T[id]();
  else if (id.startsWith('com-')) html = tarjetaCom(COMUNIDAD.find(c => 'com-'+c.id===id));
  else if (id.startsWith('notas-')){ const s = subj(id.slice(6)); html = cab(id,'asis','Notas · '+corto(s), s.c) + notasTabla(s.id) + `<p style="margin:10px 0 0"><a class="vermas" href="#/asig/${s.id}/notas">Ver asignatura →</a></p>`; }
  else if (id.startsWith('cont-')){ const s = subj(id.slice(5)); html = cab(id,'libro','Contenido · '+corto(s), 'Por temas, con la guía docente') + `<div class="temas">${contenido(s.id)}</div>`; }
  else if (id.startsWith('chat-')){ const c = CHATS.find(x => 'chat-'+x.id===id); S.leidos[c.id] = true; html = cab(id,'uni',c.t,`${c.n} personas · chat de ejemplo`) + chatHTML(c.id,'tarj'); }
  else if (id.startsWith('asig-')) html = tarjetaAsig(subj(id.slice(5)));
  return `<section class="tarj accion ancho" id="a-${id}">${html}</section>`;
}

/* ---------- Bloques reutilizables ---------- */
function horario(){
  if (!TODAY.length) return '<p class="note" style="margin:0">No tienes clases ese día.</p>';
  return TODAY.map(c => `<a class="fila ${c.cancelada?'cancelada':c.changed?'cambio':''}" href="#/asig/${c.s}"><time>${c.h}<br><span class="note">${c.f}</span></time><div><b>${corto(subj(c.s))}</b><small>${c.sub || subj(c.s).c.split('_').slice(1,3).join('-')}</small>${c.cancelada?`<span class="pill late" style="margin-top:4px">Cancelada</span>`:c.changed?`<span class="pill ok" style="margin-top:4px">${ic('check')}${c.cambioTxt || 'Aula actualizada'}</span>`:''}</div><span class="aula">${ic('pin')}${c.a}</span></a>`).join('');
}
function entregas(lista){
  const fut = lista.filter(x => new Date(x.d) > new Date()), pas = lista.filter(x => new Date(x.d) <= new Date()).reverse();
  return [...fut, ...pas].slice(0,4).map(x => `<a class="fila fila-e" href="#/asig/${x.s}/entregas"><span class="ic">${ic('doc')}</span><div><b>${x.t}</b><small>${subj(x.s).n}</small></div>${pill(x.d)}</a>`).join('');
}
function asistencia(id, soloFalta){
  const l = ses(id);
  return `<div class="asis">${l.filter(x => !soloFalta || !x.v).map(x => {
    const fecha = fmtDia.format(haceDias(x.dias)), nombre = soloFalta ? ' · ' + corto(subj(id)) : '';
    if (x.v) return `<div class="ses"><div><time>${fecha}</time><small>Asistencia registrada</small></div><span class="nota-a">1</span></div>`;
    if (S.justificado) return `<div class="ses enviado"><div><time>${fecha}${nombre}</time><small>Justificante enviado: <b>${S.archivo}</b> · pendiente de revisión</small></div><span class="nota-a">0</span></div>`;
    return `<div class="ses falta fila-falta"><div><time>${fecha}${nombre}</time><small style="color:var(--late);font-weight:700">Falta sin justificar</small></div><span class="nota-a" aria-label="Asistencia: 0">0</span>
      <div class="just">
        <label class="drop ${S.archivo?'has':''}"><input type="file" class="j-file" accept=".pdf,image/*"><span class="ico" aria-hidden="true">↑</span><span><b>${S.archivo || 'Sube el justificante'}</b><small>${S.archivo ? 'Listo para enviar · toca para cambiarlo' : 'PDF o foto · aquí mismo, sin ir a Trámites'}</small></span></label>
        <div class="fila-b"><button class="btn enviar" ${S.archivo?'':'disabled'} onclick="enviarJust()">Enviar justificante</button>${S.archivo?'':'<button class="linkbtn" onclick="ejemplo()">Usar un justificante de ejemplo</button>'}</div>
      </div></div>`;
  }).join('')}</div>`;
}

/* Contenido por temas: la guía docente primero (con su evaluación), luego cada tema plegable */
const TIPO_IC = {enunciado:'doc', enlace:'chispa', pronto:'reloj'};
function contenido(id){
  const s = subj(id), evalua = (NOTAS[id]||[]).map(x => `${esc(x.t)} ${x.p} %`).join(' · ');
  const guia = `<details class="tema" open><summary><span>${ic('libro')}Guía docente 2026/27</span><span class="note">evaluación</span></summary>
    <div class="tema-c"><button class="mat" onclick="abrirDoc()">${ic('doc')}<span>Guía docente · ${esc(corto(s))}.pdf</span></button>
    <p class="note" style="margin:6px 0 0"><b>Evaluación:</b> ${evalua} <span class="demo-flag">pesos de ejemplo</span></p></div></details>`;
  const abierto = Math.max(0, (CONTENIDO[id]||[]).findIndex(u => u.items.some(x => x.nuevo)));
  return guia + (CONTENIDO[id]||[]).map((u,i) => `<details class="tema" ${i===abierto?'open':''}><summary><span>${ic('cal')}${esc(u.u)}</span><span class="note">${u.items.filter(x => x.tipo!=='pronto').length || ''}${u.items.some(x => x.nuevo)?' <span class="pill ok">nuevo</span>':''}</span></summary>
    <div class="tema-c">${u.items.map(x => x.tipo==='pronto' ? `<p class="note" style="margin:4px 0">${esc(x.t)}</p>`
      : `<button class="mat" onclick="abrirDoc()">${ic(TIPO_IC[x.tipo]||'doc')}<span>${esc(x.t)}</span>${x.nuevo?'<span class="pill ok">nuevo</span>':''}</button>`).join('')}</div></details>`).join('');
}
function abrirDoc(){ toast('En la app real se abre el archivo de Blackboard.'); }
function notasTabla(id){
  const l = NOTAS[id]||[], m = media(id);
  return `<div class="resumen-n"><div><span class="lbl">Media actual</span><b class="media">${num(m.media)}</b></div>
    <div style="flex:1;min-width:140px"><span class="lbl">Evaluado ${m.evaluado} % · acumulado ${num(m.acumulada)} / 10</span><div class="barra-n"><span style="width:${m.evaluado}%"></span></div></div></div>
    ${l.map(x => `<div class="fila fila-n"><div><b>${esc(x.t)}</b><small>Peso ${x.p} %</small></div>${x.nuevo?'<span class="pill ok">nueva</span>':'<span></span>'}<span class="nota-n ${x.n==null?'pend':x.n<5?'baja':''}">${x.n==null?'pendiente':num(x.n)}</span></div>`).join('')}`;
}
function chatMsgs(c){
  const todos = [...c.msgs, ...(S.chats[c.id]||[])];
  return todos.map(m => `<div class="msg ${m.yo?'yo':''}">${m.yo?'':`<b>${esc(m.de)}</b>`}<p>${esc(m.txt)}</p><small>${esc(m.h)}</small></div>`).join('');
}
function chatHTML(id, donde){
  const c = CHATS.find(x => x.id===id); if (!c) return '';
  return `<div class="chat" id="chat-${donde}-${id}">${chatMsgs(c)}</div>
    <form class="enviarmsg" onsubmit="enviarMsg('${id}','${donde}');return false"><input id="in-${donde}-${id}" autocomplete="off" placeholder="Escribe un mensaje" aria-label="Mensaje para ${esc(c.t)}"><button class="btn sm" aria-label="Enviar">Enviar</button></form>`;
}
function enviarMsg(id, donde){
  const i = document.getElementById(`in-${donde}-${id}`); const txt = i && i.value.trim(); if (!txt) return;
  const h = new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
  (S.chats[id] = S.chats[id] || []).push({de:'Tú', h, txt, yo:true}); S.leidos[id] = true; guardar(); pintar();
  const n = document.getElementById(`in-${donde}-${id}`); if (n) n.focus();
  const box = document.getElementById(`chat-${donde}-${id}`); if (box) box.scrollTop = box.scrollHeight;
}
function listaChats(enTarjeta){
  return CHATS.map(c => { const nl = S.leidos[c.id] ? 0 : c.sinLeer, ult = [...c.msgs, ...(S.chats[c.id]||[])].slice(-1)[0];
    const accion = enTarjeta ? `onclick="abrir('chat-${c.id}')"` : `onclick="location.hash='#/msg/${c.id}'"`;
    return `<button class="fila fila-e fila-chat" ${accion}><span class="ic">${ic('uni')}</span><div><b>${esc(c.t)}</b><small>${ult.yo?'Tú: ':esc(ult.de)+': '}${esc(ult.txt)}</small></div>${nl?`<span class="pill late">${nl}</span>`:`<span class="note">${c.n} pers.</span>`}</button>`; }).join('');
}

/* ---------- Pantallas ---------- */
const ruta = () => location.hash.replace(/^#\/?/,'') || 'inicio';
const V = {};

V.inicio = () => {
  const h = ahora.getHours(), saludo = h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
  const l = ses(ASIS_ID);
  return `<div class="hola"><h2>${saludo}, ${NOMBRE}</h2><p>${fmtLargo.format(ahora).replace(/^./, c => c.toUpperCase())}</p></div>
  <div class="cmd" id="cmd">
    <div class="cmd-box">${ic('buscar')}<input id="q" type="search" autocomplete="off" placeholder="Busca o pide algo: «reservar pádel viernes»" aria-label="Busca o pide algo" role="combobox" aria-expanded="false" aria-controls="sug"><span class="kbd">Ctrl K</span></div>
    <div class="sug" id="sug" role="listbox" hidden></div>
  </div>
  <div class="chips" id="chips" aria-label="Sugerencias para ahora">${chips().map(c => `<button class="chip ${c.rojo?'rojo':''}" onclick="abrir('${c.id}'${c.q?`,'${c.q}'`:''})">${ic(c.ico)}${c.t}${c.por?` <span class="por">· ${c.por}</span>`:''}</button>`).join('')}</div>
  ${S.avisoCerrado || !avisoHTML() ? '' : `<div class="aviso" id="aviso"><span class="ic">${ic('aviso')}</span><p>${avisoHTML()}</p><button aria-label="Cerrar aviso" onclick="S.avisoCerrado=true;guardar();pintar()">${ic('cerrar')}</button></div>`}
  <div class="panel" id="panel">
    ${S.abiertas.map(tarjeta).join('')}
    <section class="tarj" id="t-horario"><div class="tarj-h"><span class="ic">${ic('cal')}</span><h4>${tituloHorario()}<small>${fmtLargo.format(diaClase)}</small></h4><span class="pill ok" ${REAL?`title="WebUntis, ${REAL.generado}"`:''}>${ic('check')}Actualizado</span></div>${horario()}${REAL ? cambiosHTML() : ''}</section>
    <section class="tarj" id="t-asis"><div class="tarj-h"><span class="ic" style="${S.justificado?'':'background:var(--late-bg);color:var(--late)'}">${ic('asis')}</span><h4>Asistencia<small>${subj(ASIS_ID).n} · ${l.filter(x=>x.v).length} de ${l.length}</small></h4><span class="demo-flag">de ejemplo</span></div>
      ${asistencia(ASIS_ID, true)}<p class="note" style="margin:8px 0 0">El resto de asignaturas, todo en verde. <a href="#/asig/${ASIS_ID}">Ver asistencia completa</a></p></section>
    <section class="tarj" id="t-entregas"><div class="tarj-h"><span class="ic">${ic('doc')}</span><h4>Próximas entregas${REAL && REAL.bb ? '<small>De tu calendario de Blackboard</small>' : ''}</h4>${REAL && !REAL.bb ? '' : '<a class="vermas" href="#/ent">Ver todas →</a>'}</div>${REAL && !REAL.bb ? migrarHTML() : (DUE.length ? entregas(DUE) : '<p class="note" style="margin:0">No tienes entregas pendientes en Blackboard.</p>')}</section>
    <section class="tarj" id="t-com"><div class="tarj-h"><span class="ic">${ic('uni')}</span><h4>Comunidad<small>De alumnos que ya aprobaron</small></h4><a class="vermas" href="#/com">Ver más →</a></div>
      ${COMUNIDAD.map(c => `<div class="fila fila-e"><span class="ic">${ic('uni')}</span><div><b>${c.t}</b><small>${c.s}</small></div><button class="btn sm" id="btn-${c.id}" ${S.com[c.id]?'disabled':''} onclick="comAccion('${c.id}')">${S.com[c.id]?'✓ '+c.hecho:c.accion}</button></div>`).join('')}</section>
  </div>`;
};

/* Ficha de asignatura con pestañas: Contenido · Notas · Asistencia · Entregas · Chat (#/asig/<id>/<pestaña>) */
const SUBTABS = [['contenido','Contenido'],['notas','Notas'],['asistencia','Asistencia'],['entregas','Entregas'],['chat','Chat']];
V.asig = (id, sub) => {
  if (id){
    const s = SUBJECTS.find(x => x.id===id); if (!s) return V.asig();
    const l = ses(id), pres = l.filter(x => x.v).length;
    const falta = id===ASIS_ID && !S.justificado;
    if (!SUBTABS.some(([k]) => k===sub)) sub = falta ? 'asistencia' : 'contenido';
    const chat = CHATS.find(c => c.id===id);
    if (sub==='chat' && chat){ S.leidos[chat.id] = true; guardar(); }
    const tabs = `<nav class="subnav" aria-label="Secciones de la asignatura">${SUBTABS.map(([k,t]) => `<a href="#/asig/${id}/${k}" ${sub===k?'aria-current="page"':''}>${t}${k==='asistencia'&&falta?' <span class="pill late">0</span>':''}${k==='notas'&&(NOTAS[id]||[]).some(x=>x.nuevo)?' <span class="pill ok">nueva</span>':''}</a>`).join('')}</nav>`;
    let cuerpo = '';
    if (sub==='contenido') cuerpo = `<div class="row"><h3 class="sub" style="margin:0">Contenido</h3><span class="demo-flag">contenido de ejemplo · por temas</span></div><div class="temas">${contenido(id)}</div>`;
    else if (sub==='notas') cuerpo = `<div class="row"><h3 class="sub" style="margin:0">Calificaciones</h3><span class="demo-flag">notas de ejemplo</span></div><div class="tarj" style="margin-top:10px">${notasTabla(id)}</div>`;
    else if (sub==='asistencia') cuerpo = `<div class="row"><h3 class="sub" style="margin:0">Asistencia</h3><span class="demo-flag">asistencia de ejemplo</span></div>
      <p><span class="pill ${pres===l.length?'ok':'late'}">${pres} de ${l.length} sesiones</span></p>${asistencia(id, false)}`;
    else if (sub==='entregas') cuerpo = `<h3 class="sub">Entregas</h3><div class="tarj">${DUE.some(x => x.s===id) ? entregas(DUE.filter(x => x.s===id)) : '<p class="note" style="margin:0">No hay entregas publicadas.</p>'}</div>`;
    else cuerpo = chat ? `<div class="row"><h3 class="sub" style="margin:0">${esc(chat.t)}</h3><span class="note">${chat.n} personas</span></div><div class="tarj" style="margin-top:10px">${chatHTML(chat.id,'asig')}</div>`
                       : `<p class="note">Esta asignatura todavía no tiene chat de clase.</p>`;
    return `<a class="atras" href="#/asig">‹ Mis asignaturas</a>
    <div class="ficha"><h3>${s.n}</h3><div class="code">${s.c}</div>${s.p?`<p class="note" style="margin:0">Profesor: ${s.p}</p>`:''}</div>
    ${REAL ? `<h3 class="sub">Próximas clases</h3><div class="tarj">${proximas(s.id)}</div>` : ''}
    ${tabs}${cuerpo}`;
  }
  return `<div class="row"><h3>Mis asignaturas</h3><span class="note">${SUBJECTS.length} asignaturas · ${REAL ? 'de tu horario de WebUntis' : 'datos de Blackboard'}</span></div>
  <div class="cards">${SUBJECTS.map(s => `<a class="card" href="#/asig/${s.id}"><h4>${s.n}</h4><div class="code">${s.c}</div>${s.p?`<p class="note" style="margin:8px 0 0">Profesor: ${s.p}</p>`:''}${s.last?`<p class="note" style="margin:8px 0 0">${s.last}</p>`:''}${s.id===ASIS_ID&&!S.justificado?`<p style="margin:8px 0 0"><span class="pill late">1 falta sin justificar${REAL?' · de ejemplo':''}</span></p>`:''}</a>`).join('')}</div>`;
};
V.notas = () => `<div class="row"><h3>Calificaciones</h3><span class="demo-flag">notas de ejemplo</span></div>
  <p class="note">Media de lo ya publicado, ponderada por el peso de cada parte en la guía docente.</p>
  <div class="cards">${SUBJECTS.map(s => { const m = media(s.id), nueva = (NOTAS[s.id]||[]).some(x => x.nuevo);
    return `<a class="card" href="#/asig/${s.id}/notas"><div class="row" style="align-items:center"><h4 style="flex:1">${s.n}</h4><b class="media sm">${num(m.media)}</b></div>
      <div class="barra-n"><span style="width:${m.evaluado}%"></span></div><p class="note" style="margin:6px 0 0">Evaluado ${m.evaluado} %${nueva?' · <span class="pill ok">nota nueva</span>':''}</p></a>`; }).join('')}</div>`;
V.msg = (id) => {
  const c = id && CHATS.find(x => x.id===id);
  if (c){ S.leidos[c.id] = true; guardar();
    return `<a class="atras" href="#/msg">‹ Mensajes</a><div class="row"><h3>${esc(c.t)}</h3><span class="note">${c.n} personas${c.s?` · <a href="#/asig/${c.s}">ver asignatura</a>`:''}</span></div>
      <div class="tarj" style="margin-top:12px">${chatHTML(c.id,'msg')}</div><p class="note">Chat de ejemplo: tus mensajes se quedan en este navegador.</p>`; }
  return `<div class="row"><h3>Mensajes</h3><span class="demo-flag">chats de ejemplo</span></div>
    <p class="note">Un chat por asignatura y por grupo de trabajo.</p><div class="tarj" style="margin-top:12px">${listaChats(false)}</div>`;
};
V.ent = () => REAL && !REAL.bb ? `<div class="row"><h3>Entregas</h3></div><div class="tarj" style="margin-top:14px">${migrarHTML()}</div>` : `<div class="row"><h3>Entregas</h3><span class="note">${REAL ? 'De tu calendario de Blackboard' : 'Todas tus asignaturas, por fecha'}</span></div>
  <div class="list">${DUE.length ? '' : '<p class="note">No hay entregas en tu calendario de Blackboard.</p>'}${DUE.map(x => `<a class="item" href="#/asig/${x.s}/entregas"><time>${fmt.format(new Date(x.d))} · ${fmtH.format(new Date(x.d))}</time><div class="what">${x.t}<small>${subj(x.s).n}</small></div>${pill(x.d)}</a>`).join('')}</div>`;
V.tram = () => `<div class="row"><h3>Trámites</h3><span class="demo-flag">simulado: no se envía nada</span></div>
  <div class="aviso"><p>Los justificantes de faltas se suben en <b>Asistencia</b>, junto a la falta. Las reservas de aulas, desde la barra de Inicio. <a href="#/inicio">Ir a Inicio</a></p></div>
  <h3 class="sub">Matrícula firmada</h3>
  <button class="btn dark" onclick="S.mat=!S.mat;guardar();pintar()">${S.mat?'Ocultar':'Ver'} matrícula 2026/27</button>
  ${S.mat ? T.matricula().replace(/<div class="tarj-h">[\s\S]*?<\/div>/,'') : ''}`;
V.com = () => `<div class="row"><h3>Comunidad</h3><span class="demo-flag">compañeros de ejemplo</span></div>
  <p class="note">Apuntes y clases de apoyo de alumnos que ya aprobaron la asignatura.</p>
  <div class="cards">${COMUNIDAD.map(c => `<div class="card act"><h4>${c.t}</h4><p class="note">${c.s}</p><button class="btn" id="btn-${c.id}" ${S.com[c.id]?'disabled':''} onclick="comAccion('${c.id}')">${S.com[c.id]?'✓ '+c.hecho:c.accion}</button></div>`).join('')}</div>`;

/* ---------- Acciones ---------- */
function enviarJust(){ if(!S.archivo) return; S.justificado = true; guardar(); pintar(); toast('Justificante enviado. La falta queda pendiente de revisión.'); }
function reservarPadel(){ const p = S.padel; if (!p.hora) return; p.hecho = `${diaTxt(p.dia)} · ${p.hora} · Pista ${1 + PADEL_HORAS.indexOf(p.hora) % 2}`; guardar(); pintar(); toast('Pista reservada (demo)'); }
function ejemplo(){ S.archivo = 'justificante-medico.pdf'; guardar(); pintar(); }
function comAccion(id){ S.com[id] = true; guardar(); pintar(); toast(id==='apuntes' ? 'Solicitud enviada (demo)' : 'Apuntado (demo)'); }

/* ---------- Barra: sugerencias en vivo, teclado y Ctrl+K / «/» ---------- */
let opciones = [], sel = 0;
function pintarSug(){
  const q = document.getElementById('q'), box = document.getElementById('sug'); if (!q) return;
  const v = q.value;
  if (v.trim()) opciones = buscar(v).map(a => ({a, q:v}));
  else opciones = chips().map(c => ({a: ACCIONES.find(x => x.id===c.id), q:c.q, chip:c})).filter(o => o.a);
  if (!opciones.length){ box.innerHTML = `<p class="note" style="padding:10px">Nada con «${v.replace(/</g,'&lt;')}». Prueba «pádel», «aula», «justificante» o una asignatura.</p>`; }
  else box.innerHTML = `<div class="sug-h">${v.trim() ? 'Resultados' : 'Para ahora'}</div>` + opciones.map((o,i) => `<button class="op" role="option" id="op-${i}" aria-selected="${i===sel}" onmousedown="event.preventDefault()" onclick="elegir(${i})"><span class="ic">${ic(o.a.ico)}</span><span class="tx"><b>${resaltar(o.chip ? o.chip.t : o.a.t, v)}</b><small>${o.a.s}</small></span><span class="tipo">${o.a.tipo}</span></button>`).join('');
  box.hidden = false; q.setAttribute('aria-expanded','true');
}
function cerrarSug(){ const b = document.getElementById('sug'); if (b) b.hidden = true; const q = document.getElementById('q'); if (q) q.setAttribute('aria-expanded','false'); sel = 0; }
function elegir(i){ const o = opciones[i]; if (o) abrir(o.a.id, o.q); }
function enlazarBarra(){
  const q = document.getElementById('q'); if (!q) return;
  q.addEventListener('focus', () => { sel = 0; pintarSug(); });
  q.addEventListener('input', () => { sel = 0; pintarSug(); });
  q.addEventListener('blur', () => setTimeout(cerrarSug, 120));
  q.addEventListener('keydown', e => {
    if (e.key==='ArrowDown'){ sel = Math.min(sel+1, opciones.length-1); pintarSug(); e.preventDefault(); }
    else if (e.key==='ArrowUp'){ sel = Math.max(sel-1, 0); pintarSug(); e.preventDefault(); }
    else if (e.key==='Enter'){ elegir(sel); e.preventDefault(); }
    else if (e.key==='Escape'){ q.value=''; cerrarSug(); q.blur(); }
  });
}
document.addEventListener('keydown', e => {
  const enCampo = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if ((e.key==='k' && (e.ctrlKey||e.metaKey)) || (e.key==='/' && !enCampo)){
    e.preventDefault();
    if (ruta()!=='inicio'){ location.hash = '#/inicio'; setTimeout(() => document.getElementById('q')?.focus(), 50); }
    else document.getElementById('q')?.focus();
  }
});

/* ---------- Guía del Happy Path ---------- */
function paso(){
  const r = ruta();
  if (!S.justificado){
    if (r!=='inicio' && !r.startsWith('asig/'+ASIS_ID)) return {n:1, ir:'#/inicio'};
    if (!S.archivo) return {n:1, t:'Inicio: el aula nueva ya está en el horario. Y un 0 en rojo: sube el justificante ahí mismo.', obj:'.fila-falta'};
    return {n:1, t:'Justificante listo. Envíalo.', obj:'.enviar'};
  }
  if (!S.padel.hecho){
    if (r!=='inicio') return {n:2, ir:'#/inicio'};
    if (!S.abiertas.includes('padel')) return {n:2, t:'Escribe «pa» en la barra (o toca el chip) y elige Pádel.', obj:'.cmd-box'};
    return {n:2, t: S.padel.hora ? 'Reserva la pista.' : 'La tarjeta sale en el mismo Inicio. Elige una hora.', obj: S.padel.hora ? '#reservar-padel' : '#a-padel .slots'};
  }
  if (!S.com.apuntes){
    if (r!=='inicio' && r!=='com') return {n:3, ir:'#/inicio'};
    return {n:3, t:'Comunidad, también aquí: pide los apuntes de Análisis III.', obj:'#btn-apuntes'};
  }
  return {n:4, t:'Fin: horario con cambios, entregas, asistencia con justificante, una reserva y la comunidad, sin salir de Inicio.'};
}
function guiaHTML(){
  if (REAL) return '';   // con tus datos no hay recorrido guiado
  if (!S.guia) return `<button class="btn guide-on" onclick="S.guia=true;guardar();pintar()">Guía de la demo</button>`;
  const p = paso();
  const txt = p.n===4 ? `${p.t} <a href="#" onclick="reiniciar();return false">Reiniciar</a>` : p.t || `Fuera del recorrido. <a href="${p.ir}">Volver al paso ${p.n}</a>`;
  return `<div class="guide" role="status"><b>${p.n===4?'Demo ✓':'Paso '+p.n+'/3'}</b><p>${txt}</p><button onclick="S.guia=false;guardar();pintar()">Ocultar</button></div>`;
}

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
  <h3 class="sub">Sesión</h3><p><button class="btn dark" onclick="salir()">Cerrar sesión</button></p>
  <p class="note">Horario actualizado: ${esc(REAL.generado || '—')}. Asistencia, comunidad, pádel y matrícula siguen siendo de ejemplo.</p>`;

function arrancar(){
  const m = location.hash.match(/entrar=([A-Za-z0-9_-]{20,})/);
  if (m){ history.replaceState(null, '', location.pathname + location.search + '#/inicio');
    api('/verificar', {method:'POST', body:{enlace:m[1]}}).then(r => { TOKEN = r.token; try { localStorage.setItem('gb-token', TOKEN); } catch(e){} cargar(); })
      .catch(() => { PUERTA = {error:'Ese enlace ya no vale (dura 15 minutos y sirve una vez). Pide otro.'}; pintar(); });
    return;
  }
  if (!DEMO && TOKEN) cargar(); else pintar();
}

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
