/* Greenboard · app del MVP (/mvp/) · buscador
   La barra de Inicio (Ctrl+K o «/»): catálogo de acciones, puntuación, frases y sugerencias en vivo. */

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
  ...SUBJECTS.map(s => ({id:'asig-'+s.id, sj:s.id, tipo:'Asignatura', t:s.n, s:s.c, ico:'libro', k:s.n + ' asignatura'})),
  {id:'notas', tipo:'Notas', t:'Mis calificaciones', s:'Media de cada asignatura', ico:'asis', k:'notas calificaciones media nota examen aprobado', prio:12},
  ...SUBJECTS.map(s => ({id:'notas-'+s.id, sj:s.id, nuevo:(NOTAS[s.id]||[]).some(x => x.nuevo), tipo:'Notas', t:'Notas de '+corto(s), s:'Media '+num(media(s.id).media)+' · evaluado '+media(s.id).evaluado+' %', ico:'asis', k:'notas calificaciones media '+s.n})),
  {id:'mensajes', tipo:'Mensajes', t:'Mensajes', s:'Chats de clase y de grupo', ico:'uni', k:'mensajes chat chats clase grupo hablar escribir', prio:12},
  ...CHATS.map(c => ({id:'chat-'+c.id, sj:c.s, tipo:'Chat', t:c.t, s:c.n+' personas', ico:'uni', k:'chat mensajes '+c.t})),
  ...SUBJECTS.map(s => ({id:'cont-'+s.id, sj:s.id, tipo:'Contenido', t:'Guía docente de '+corto(s), s:'Contenido por temas', ico:'libro', k:'guia docente contenido temas materiales '+s.n})),
  ...SUBJECTS.flatMap(s => (CONTENIDO[s.id]||[]).flatMap(u => u.items.filter(x => x.tipo!=='pronto').map(x => ({id:'cont-'+s.id, sj:s.id, foco:x.t, nuevo:!!x.nuevo, tipo:'Material', t:x.t, s:corto(s)+' · '+u.u, ico:'doc', k:'apuntes material pdf '+u.u+' '+x.t}))))
];
const VACIAS = new Set(['el','la','los','las','de','del','a','al','un','una','para','me','mi','quiero','en','y','por','favor','reservar','reserva','ver','las','hoy','manana','viernes','lunes','martes','miercoles','jueves','sabado','domingo','tarde','manana']);
/* Puntúa cada acción con las palabras escritas; entiende frases como «reservar pádel viernes a las 19».
   Orden: primero la calidad del acierto (título que empieza igual, palabra exacta, novedad); después se reparten los
   huecos entre asignaturas, para que «notas» o «apuntes» no se llenen con las primeras del catálogo. */
const MAX_RESULTADOS = 8;
function buscar(q){
  const limpia = s => norm(s).replace(/[·:]/g,' ').replace(/\s+/g,' ').trim();
  const nq = limpia(q); if (!nq) return [];
  const palabras = nq.split(/\s+/).filter(w => w && !VACIAS.has(w) && !/^\d/.test(w));
  const puntos = ACCIONES.map(a => {
    const nt = limpia(a.t), nk = norm(a.k + ' ' + a.t);
    let p = 0;
    if (nt.startsWith(nq)) p += 6;
    if (nt.includes(nq)) p += 3;
    const toks = nk.split(/[\s:·]+/);
    for (const w of palabras){ if (toks.some(t => t.startsWith(w))) p += toks.includes(w) ? 5 : 4; else if (nk.includes(w)) p += 2; }
    if (p > 0 && a.nuevo) p += 1;
    if (!palabras.length && /reserv/.test(nq) && a.tipo==='Reserva') p += 3;
    return {a, p};
  }).filter(x => x.p > 0).map(x => ({a:x.a, p:x.p + (palabras.length <= 1 ? (x.a.prio||0) : 0)}));
  // Reparto: cada resultado que ya sale de una asignatura le quita 3 puntos a la siguiente de esa misma asignatura.
  const elegidos = [], vistos = {}, quedan = [...puntos];
  while (elegidos.length < MAX_RESULTADOS && quedan.length){
    let mejor = 0, mejorP = -Infinity;
    quedan.forEach((x, i) => { const pe = x.p - 3*(x.a.sj ? (vistos[x.a.sj]||0) : 0); if (pe > mejorP) { mejor = i; mejorP = pe; } });
    const [x] = quedan.splice(mejor, 1); elegidos.push(x.a); if (x.a.sj) vistos[x.a.sj] = (vistos[x.a.sj]||0) + 1;
  }
  return elegidos;
}
function parametros(q){
  const n = norm(q), r = {};
  if (/\bviernes\b/.test(n)) r.dia = 'viernes'; else if (/\bmanana\b/.test(n)) r.dia = 'manana'; else if (/\bhoy\b|\besta tarde\b/.test(n)) r.dia = 'hoy';
  const h = n.match(/\b(?:a las\s*)?(\d{1,2})(?!\d)(?::(\d{2}))?\s*(?:h\b)?/);
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
  if (opciones.length) q.setAttribute('aria-activedescendant', 'op-' + sel); else q.removeAttribute('aria-activedescendant');
}
function cerrarSug(){ const b = document.getElementById('sug'); if (b) b.hidden = true; const q = document.getElementById('q'); if (q){ q.setAttribute('aria-expanded','false'); q.removeAttribute('aria-activedescendant'); } sel = 0; }
function elegir(i){ const o = opciones[i]; if (!o) return; FOCO_MAT = o.a.foco || null; abrir(o.a.id, o.q); }
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
