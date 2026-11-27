/* Greenboard · app del MVP (/mvp/) · ui
   Tarjetas de Inicio, bloques reutilizables, pantallas (rutas #/…), acciones y guía de la demo. */

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
  if (q){ const p = parametros(q);
    if (id==='padel'){ if (p.dia) S.padel.dia = diaValido(p.dia); if (p.hora && PADEL_HORAS.includes(p.hora) && !padelOcupada(S.padel.dia || 'hoy', p.hora)) S.padel.hora = p.hora; }
    if (id==='aula'){ if (p.dia) S.aula.dia = diaValido(p.dia); if (p.hora && AULA_HORAS.includes(p.hora)) S.aula.hora = p.hora; } }
  if (id==='padel'){ S.padel.dia = diaValido(S.padel.dia || 'viernes'); if (S.padel.hora && padelOcupada(S.padel.dia, S.padel.hora)) S.padel.hora = null; }
  if (id==='aula') S.aula.dia = diaValido(S.aula.dia);
  S.abiertas = [id, ...S.abiertas.filter(x => x!==id)];
  guardar();
  cerrarSug(); document.getElementById('q').value = '';
  if (ruta()!=='inicio') location.hash = '#/inicio'; else pintar();
  requestAnimationFrame(() => { const el = document.querySelector('#a-'+id+' .mat.foco') || document.getElementById('a-'+id); if (el) el.scrollIntoView({behavior:'smooth', block: el.classList.contains('mat') ? 'center' : 'nearest'}); });
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
     <div class="lbl">Hora · 1 h</div><div class="slots">${PADEL_HORAS.map(h => { const occ = padelOcupada(p.dia, h);
       return `<button class="slot" ${occ?'disabled':''} aria-pressed="${p.hora===h}" onclick="S.padel.hora='${h}';guardar();pintar()">${h}<small>${occ ? (yaPasada(p.dia,h) ? 'pasada' : 'ocupada') : 'Pista '+(1+PADEL_HORAS.indexOf(h)%2)}</small></button>`; }).join('')}</div>
     <button class="btn" id="reservar-padel" ${p.hora?'':'disabled'} onclick="reservarPadel()">${p.hora ? 'Reservar '+diaTxt(p.dia).split(',')[0].toLowerCase()+' a las '+p.hora : 'Elige una hora'}</button>`;
};
T.aula = () => REAL ? aulaReal() : aulaDemo();
function aulaDemo(){
  const a = S.aula;
  if (a.hecho) return cab('aula','aula','Aula reservada','En la app real, trámite «Reserva de Aulas» de Classlife') +
    `<div class="hecho">${ic('check')}<span>${a.hecho}</span></div><button class="linkbtn" onclick="S.aula.hecho=null;guardar();pintar()">Cancelar reserva</button>`;
  return cab('aula','aula','Reservar un aula','En la app real, trámite «Reserva de Aulas» de Classlife') +
    `<div class="lbl">Día</div><div class="seg">${dias().map(d => `<button aria-pressed="${a.dia===d.k}" onclick="S.aula.dia='${d.k}';guardar();pintar()">${d.t}</button>`).join('')}</div>
     <div class="lbl">Hora · 2 h</div><div class="seg">${AULA_HORAS.map(h => `<button ${yaPasada(a.dia,h)?'disabled':''} aria-pressed="${a.hora===h}" onclick="S.aula.hora='${h}';guardar();pintar()">${h}</button>`).join('')}</div>
     <div class="lbl">Aulas libres <span class="demo-flag">de ejemplo</span></div>
     ${AULAS_LIBRES.map(x => `<div class="fila"><span>${ic('aula')}</span><div><b>${x.a}</b><small>${x.cap}</small></div><button class="btn sm" ${yaPasada(a.dia,a.hora)?'disabled':''} onclick="S.aula.hecho='${x.a} · '+diaTxt(S.aula.dia)+' · '+S.aula.hora;guardar();pintar();toast('Aula reservada (demo)')">Reservar</button></div>`).join('')}`;
}
T.matricula = () => cab('matricula','doc','Matrícula firmada','Documento de ejemplo') +
  `<div class="doc"><h5>Matrícula 2026/27 · ejemplo</h5>Alumno: ${REAL ? NOMBRE : 'Gonzalo Martínez Fernández'}<br>Titulación: ${REAL ? REAL.grupos.join(' + ') : 'Doble Grado MAIS, 4.º curso'}<br>Asignaturas: ${SUBJECTS.length}<br><span class="note">En la app real sería el PDF firmado de Secretaría.</span></div>`;
function tarjetaCom(c){
  return cab('com-'+c.id,'uni',c.t,c.s) + `<div class="asis">${c.det.map(d => `<div class="ses" style="grid-template-columns:1fr auto"><span>${d}</span>${c.id==='apuntes'?`<span class="pill ${S.com[c.id]?'soon':'late'}">${S.com[c.id]?'pendiente':'sin acceso'}</span>`:''}</div>`).join('')}</div>
   <p style="margin:12px 0 0"><button class="btn" id="btn-${c.id}-tarj" ${S.com[c.id]?'disabled':''} onclick="comAccion('${c.id}')">${S.com[c.id]?'✓ '+c.hecho:c.accion}</button></p>`;
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
  else if (id.startsWith('chat-')){ const c = CHATS.find(x => 'chat-'+x.id===id); S.leidos[c.id] = true; guardar(); html = cab(id,'uni',c.t,`${c.n} personas · chat de ejemplo`) + chatHTML(c.id,'tarj'); }
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
    if (S.justificado) return `<div class="ses enviado"><div><time>${fecha}${nombre}</time><small>Justificante enviado: <b>${esc(S.archivo)}</b> · pendiente de revisión</small></div><span class="nota-a">0</span></div>`;
    return `<div class="ses falta fila-falta"><div><time>${fecha}${nombre}</time><small style="color:var(--late);font-weight:700">Falta sin justificar</small></div><span class="nota-a" aria-label="Asistencia: 0">0</span>
      <div class="just">
        <label class="drop ${S.archivo?'has':''}"><input type="file" class="j-file" accept=".pdf,image/*"><span class="ico" aria-hidden="true">↑</span><span><b>${S.archivo ? esc(S.archivo) : 'Sube el justificante'}</b><small>${S.archivo ? 'Listo para enviar · toca para cambiarlo' : 'PDF o foto · aquí mismo, sin ir a Trámites'}</small></span></label>
        <div class="fila-b"><button class="btn enviar" ${S.archivo?'':'disabled'} onclick="enviarJust()">Enviar justificante</button>${S.archivo?'':'<button class="linkbtn" onclick="ejemplo()">Usar un justificante de ejemplo</button>'}</div>
      </div></div>`;
  }).join('')}</div>`;
}

/* Contenido por temas: la guía docente primero (con su evaluación), luego cada tema plegable */
const TIPO_IC = {enunciado:'doc', enlace:'chispa', pronto:'reloj'};
/* Material elegido en la barra: su tema sale abierto y el archivo, marcado (lo pone elegir() en buscador.js) */
let FOCO_MAT = null;
function contenido(id){
  const s = subj(id), evalua = (NOTAS[id]||[]).map(x => `${esc(x.t)} ${x.p} %`).join(' · ');
  const guia = `<details class="tema" open><summary><span>${ic('libro')}Guía docente 2026/27</span><span class="note">evaluación</span></summary>
    <div class="tema-c"><button class="mat" onclick="abrirDoc()">${ic('doc')}<span>Guía docente · ${esc(corto(s))}.pdf</span></button>
    <p class="note" style="margin:6px 0 0"><b>Evaluación:</b> ${evalua} <span class="demo-flag">pesos de ejemplo</span></p></div></details>`;
  const conFoco = FOCO_MAT ? (CONTENIDO[id]||[]).findIndex(u => u.items.some(x => x.t===FOCO_MAT)) : -1;
  const abierto = conFoco >= 0 ? conFoco : Math.max(0, (CONTENIDO[id]||[]).findIndex(u => u.items.some(x => x.nuevo)));
  return guia + (CONTENIDO[id]||[]).map((u,i) => `<details class="tema" ${i===abierto?'open':''}><summary><span>${ic('cal')}${esc(u.u)}</span><span class="note">${u.items.filter(x => x.tipo!=='pronto').length || ''}${u.items.some(x => x.nuevo)?' <span class="pill ok">nuevo</span>':''}</span></summary>
    <div class="tema-c">${u.items.map(x => x.tipo==='pronto' ? `<p class="note" style="margin:4px 0">${esc(x.t)}</p>`
      : `<button class="mat${x.t===FOCO_MAT?' foco':''}" onclick="abrirDoc()">${ic(TIPO_IC[x.tipo]||'doc')}<span>${esc(x.t)}</span>${x.nuevo?'<span class="pill ok">nuevo</span>':''}</button>`).join('')}</div></details>`).join('');
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
  ${instalarHTML()}
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
    if (sub==='chat'){ S.leidos[chat.id] = true; guardar(); }
    const tabs = `<nav class="subnav" aria-label="Secciones de la asignatura">${SUBTABS.map(([k,t]) => `<a href="#/asig/${id}/${k}" ${sub===k?'aria-current="page"':''}>${t}${k==='asistencia'&&falta?' <span class="pill late">0</span>':''}${k==='notas'&&(NOTAS[id]||[]).some(x=>x.nuevo)?' <span class="pill ok">nueva</span>':''}</a>`).join('')}</nav>`;
    let cuerpo = '';
    if (sub==='contenido') cuerpo = `<div class="row"><h3 class="sub" style="margin:0">Contenido</h3><span class="demo-flag">contenido de ejemplo · por temas</span></div><div class="temas">${contenido(id)}</div>`;
    else if (sub==='notas') cuerpo = `<div class="row"><h3 class="sub" style="margin:0">Calificaciones</h3><span class="demo-flag">notas de ejemplo</span></div><div class="tarj" style="margin-top:10px">${notasTabla(id)}</div>`;
    else if (sub==='asistencia') cuerpo = `<div class="row"><h3 class="sub" style="margin:0">Asistencia</h3><span class="demo-flag">asistencia de ejemplo</span></div>
      <p><span class="pill ${pres===l.length?'ok':'late'}">${pres} de ${l.length} sesiones</span></p>${asistencia(id, false)}`;
    else if (sub==='entregas') cuerpo = `<h3 class="sub">Entregas</h3><div class="tarj">${DUE.some(x => x.s===id) ? entregas(DUE.filter(x => x.s===id)) : '<p class="note" style="margin:0">No hay entregas publicadas.</p>'}</div>`;
    else cuerpo = `<div class="row"><h3 class="sub" style="margin:0">${esc(chat.t)}</h3><span class="note">${chat.n} personas</span></div><div class="tarj" style="margin-top:10px">${chatHTML(chat.id,'asig')}</div>`;
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
function reservarPadel(){ const p = S.padel; if (!p.hora || padelOcupada(p.dia, p.hora)) return; p.hecho = `${diaTxt(p.dia)} · ${p.hora} · Pista ${1 + PADEL_HORAS.indexOf(p.hora) % 2}`; guardar(); pintar(); toast('Pista reservada (demo)'); }
function ejemplo(){ S.archivo = 'justificante-medico.pdf'; guardar(); pintar(); }
function comAccion(id){ S.com[id] = true; guardar(); pintar(); toast(id==='apuntes' ? 'Solicitud enviada (demo)' : 'Apuntado (demo)'); }

/* ---------- Guía del Happy Path ---------- */
function paso(){
  const r = ruta();
  if (!S.justificado){
    if (r!=='inicio' && r!=='asig/'+ASIS_ID && r!=='asig/'+ASIS_ID+'/asistencia') return {n:1, ir: r.startsWith('asig/'+ASIS_ID) ? '#/asig/'+ASIS_ID+'/asistencia' : '#/inicio'};
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
