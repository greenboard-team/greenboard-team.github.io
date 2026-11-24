import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import { CabeceraTarjeta, DemoFlag, Hecho, Segmentos } from '../common/Piezas.jsx';
import { Contenido, ListaEntregas, NotasTabla } from '../asignaturas/Bloques.jsx';
import { Chat, ListaChats } from '../mensajes/Chat.jsx';
import { corto, num } from '../../domain/texto.js';
import { diaTxt, diasReserva, fmt, isoDia } from '../../domain/fechas.js';
import { media } from '../../domain/notas.js';
import { asignatura, sesionesAsistencia, sinLeer } from '../../repositories/academicoRepository.js';
import { CLASSLIFE_AULAS } from '../../config/api.js';
import { useAcademico, useSesion } from '../../store/SesionContext.jsx';
import { useUi } from '../../store/UiContext.jsx';

/**
 * Tarjetas que se abren arriba del panel de Inicio desde la barra o los chips.
 * Patrón Factory (sencillo): `TarjetaInicio` elige qué componente pintar a partir del id.
 */

function Padel() {
  const m = useAcademico();
  const { ui, dispatch, avisar } = useUi();
  const p = ui.padel;
  const set = (cambios) => dispatch({ type: 'cambiar', cambios: { padel: { ...p, ...cambios } } });
  const sub = 'Pistas de U-tad, 5 € la hora · horarios de ejemplo';
  if (p.hecho) {
    return (
      <>
        <CabeceraTarjeta id="padel" icono="padel" titulo="Pista de pádel reservada" sub={sub} />
        <Hecho>{p.hecho}</Hecho>
        <p className="note">¿Os falta gente? <Link to="/community/nuevo?tipo=padel">Publícalo en Green Community</Link>. En la demo no se reserva ni se paga nada de verdad.</p>
        <button className="linkbtn" onClick={() => set({ hecho: null })}>Cancelar reserva</button>
      </>
    );
  }
  const pista = (h) => 1 + (m.padel.horas.indexOf(h) % 2);
  return (
    <>
      <CabeceraTarjeta id="padel" icono="padel" titulo="Reservar pista de pádel" sub={sub} />
      <div className="lbl">Día</div>
      <Segmentos etiqueta="Día" valor={p.dia} onCambio={(k) => set({ dia: k, hora: null })}
        opciones={diasReserva().map((d) => ({ k: d.k, t: d.t, nota: fmt.format(d.d) }))} />
      <div className="lbl">Hora · 1 h</div>
      <div className="slots">
        {m.padel.horas.map((h) => {
          const ocupada = m.padel.ocupadas.includes(h) && p.dia !== 'hoy';
          return (
            <button key={h} className="slot" disabled={ocupada} aria-pressed={p.hora === h} onClick={() => set({ hora: h })}>
              {h}<small>{ocupada ? 'ocupada' : 'Pista ' + pista(h)}</small>
            </button>
          );
        })}
      </div>
      <button className="btn" id="reservar-padel" disabled={!p.hora}
        onClick={() => { set({ hecho: `${diaTxt(p.dia)} · ${p.hora} · Pista ${pista(p.hora)}` }); avisar('Pista reservada (demo)'); }}>
        {p.hora ? `Reservar ${diaTxt(p.dia).split(',')[0].toLowerCase()} a las ${p.hora}` : 'Elige una hora'}
      </button>
    </>
  );
}

function AulaDemo() {
  const m = useAcademico();
  const { ui, dispatch, avisar } = useUi();
  const a = ui.aula;
  const set = (cambios) => dispatch({ type: 'cambiar', cambios: { aula: { ...a, ...cambios } } });
  const sub = 'En la app real, trámite «Reserva de Aulas» de Classlife';
  if (a.hecho) {
    return (
      <>
        <CabeceraTarjeta id="aula" icono="aula" titulo="Aula reservada" sub={sub} />
        <Hecho>{a.hecho}</Hecho>
        <button className="linkbtn" onClick={() => set({ hecho: null })}>Cancelar reserva</button>
      </>
    );
  }
  return (
    <>
      <CabeceraTarjeta id="aula" icono="aula" titulo="Reservar un aula" sub={sub} />
      <div className="lbl">Día</div>
      <Segmentos etiqueta="Día" valor={a.dia} onCambio={(k) => set({ dia: k })} opciones={diasReserva().map((d) => ({ k: d.k, t: d.t }))} />
      <div className="lbl">Hora · 2 h</div>
      <Segmentos etiqueta="Hora" valor={a.hora} onCambio={(k) => set({ hora: k })} opciones={m.aulas.horas.map((h) => ({ k: h, t: h }))} />
      <div className="lbl">Aulas libres <DemoFlag>de ejemplo</DemoFlag></div>
      {m.aulas.libres.map((x) => (
        <div key={x.a} className="fila">
          <span><Icon n="aula" /></span>
          <div><b>{x.a}</b><small>{x.cap}</small></div>
          <button className="btn sm" onClick={() => { set({ hecho: `${x.a} · ${diaTxt(a.dia)} · ${a.hora}` }); avisar('Aula reservada (demo)'); }}>Reservar</button>
        </div>
      ))}
    </>
  );
}

/** Aulas libres de verdad (según el horario de WebUntis); reservar sigue siendo en Classlife. */
function AulaReal() {
  const m = useAcademico();
  const { api } = useSesion();
  const { ui, dispatch } = useUi();
  const a = ui.aula;
  const set = (cambios) => dispatch({ type: 'cambiar', cambios: { aula: { ...a, ...cambios }, aulaTodas: false } });
  const d = (diasReserva().find((x) => x.k === a.dia) || diasReserva()[0]).d;
  const dia = isoDia(d);
  const hasta = String(+a.hora.slice(0, 2) + 2).padStart(2, '0') + a.hora.slice(2);
  const [r, setR] = useState('cargando');

  useEffect(() => {
    let vivo = true;
    setR('cargando');
    api.aulasLibres(dia, a.hora, hasta).then((x) => vivo && setR(x)).catch(() => vivo && setR('error'));
    return () => { vivo = false; };
  }, [api, dia, a.hora, hasta]);

  const ddmm = `${String(d.getDate()).padStart(2, '0')}%2F${String(d.getMonth() + 1).padStart(2, '0')}%2F${d.getFullYear()}`;
  let cuerpo;
  if (r === 'cargando') cuerpo = <p className="cargando">Buscando aulas libres…</p>;
  else if (r === 'error') cuerpo = <p className="error">No se han podido leer las aulas. Prueba otra vez.</p>;
  else if (!r.conDatos) cuerpo = <p className="note">Aún no hay horario de aulas de ese día (se lee la semana actual y la siguiente).</p>;
  else if (!r.libres.length) cuerpo = <p className="note">Todas las aulas tienen clase en ese hueco.</p>;
  else {
    cuerpo = (
      <>
        {r.libres.slice(0, ui.aulaTodas ? 99 : 6).map((x) => (
          <div key={x.aula} className="fila">
            <span><Icon n="aula" /></span>
            <div><b>{x.aula}</b><small>{x.edificio} · {x.hastaLas ? 'libre hasta las ' + x.hastaLas : 'libre el resto del día'}</small></div>
            <a className="btn sm" target="_blank" rel="noopener noreferrer" href={`${CLASSLIFE_AULAS}?from=${ddmm}`}>Reservar</a>
          </div>
        ))}
        {r.libres.length > 6 && !ui.aulaTodas && (
          <p style={{ margin: '8px 0 0' }}><button className="linkbtn" onClick={() => dispatch({ type: 'cambiar', cambios: { aulaTodas: true } })}>Ver las {r.libres.length} aulas libres</button></p>
        )}
      </>
    );
  }
  return (
    <>
      <CabeceraTarjeta id="aula" icono="aula" titulo="Aulas libres" sub="Según el horario de clases de WebUntis · se reserva en Classlife" />
      <div className="lbl">Día</div>
      <Segmentos etiqueta="Día" valor={a.dia} onCambio={(k) => set({ dia: k })} opciones={diasReserva().map((x) => ({ k: x.k, t: x.t, nota: fmt.format(x.d) }))} />
      <div className="lbl">Desde · 2 h</div>
      <Segmentos etiqueta="Hora" valor={a.hora} onCambio={(k) => set({ hora: k })} opciones={m.aulas.horas.map((h) => ({ k: h, t: h }))} />
      <div className="lbl">{r?.libres ? `${r.libres.length} aulas sin clase de ${a.hora} a ${hasta}` : 'Aulas sin clase'}</div>
      {cuerpo}
      <p className="note" style={{ margin: '10px 0 0' }}>«Reservar» abre «Reserva de Aulas» de Classlife en ese día. Las reservas de otros alumnos solo las ve Classlife.</p>
    </>
  );
}

export function Matricula({ conCabecera = true }) {
  const m = useAcademico();
  return (
    <>
      {conCabecera && <CabeceraTarjeta id="matricula" icono="doc" titulo="Matrícula firmada" sub="Documento de ejemplo" />}
      <div className="doc">
        <h5>Matrícula 2026/27 · ejemplo</h5>
        Alumno: {m.nombreCompleto}<br />
        Titulación: {m.real ? m.real.grupos.join(' + ') : 'Doble Grado MAIS, 4.º curso'}<br />
        Asignaturas: {m.subjects.length}<br />
        <span className="note">En la app real sería el PDF firmado de Secretaría.</span>
      </div>
    </>
  );
}

/** Apuntes compartidos: abiertos a todos, cada tema se abre directamente. */
export function ApuntesLista({ c }) {
  const { avisar } = useUi();
  return (
    <div className="temas-c">
      {c.det.map((d) => (
        <button key={d} className="mat" onClick={() => avisar(`Se abre «${d}» (PDF de ejemplo)`)}>
          <Icon n="doc" /><span>{d}</span>
        </button>
      ))}
    </div>
  );
}

function Apunte({ c }) {
  const { ui, dispatch, avisar } = useUi();
  const hecho = ui.com[c.id];
  if (c.tipo === 'apuntes') {
    return (
      <>
        <CabeceraTarjeta id={'com-' + c.id} icono="libro" titulo={c.t} sub={c.s} />
        <ApuntesLista c={c} />
      </>
    );
  }
  return (
    <>
      <CabeceraTarjeta id={'com-' + c.id} icono="libro" titulo={c.t} sub={c.s} />
      <div className="asis">
        {c.det.map((d) => (
          <div key={d} className="ses" style={{ gridTemplateColumns: '1fr' }}><span>{d}</span></div>
        ))}
      </div>
      <p style={{ margin: '12px 0 0' }}>
        <BotonApunte c={c} hecho={hecho} onClick={() => { dispatch({ type: 'apuntarCom', id: c.id }); avisar('Apuntado (demo)'); }} />
      </p>
    </>
  );
}

export function BotonApunte({ c, hecho, onClick, sm }) {
  return (
    <button className={`btn ${sm ? 'sm' : ''}`} id={`btn-${c.id}`} disabled={hecho} onClick={onClick}>
      {hecho ? '✓ ' + c.hecho : c.accion}
    </button>
  );
}

function TarjetaAsignatura({ id }) {
  const m = useAcademico();
  const s = asignatura(m, id);
  const l = sesionesAsistencia(m, id);
  const ents = m.due.filter((x) => x.s === id);
  return (
    <>
      <CabeceraTarjeta id={'asig-' + id} icono="libro" titulo={s.n} sub={s.c} />
      {s.p && <p className="note" style={{ margin: '0 0 6px' }}>Profesor: {s.p}</p>}
      {s.last && <p className="note" style={{ margin: '0 0 6px' }}>{s.last}</p>}
      <div className="lbl">Asistencia · {l.filter((x) => x.v).length} de {l.length}</div>
      <div className="mini-asis">{l.map((x, i) => <span key={i} className={x.v ? '' : 'c'}>{x.v}</span>)}</div>
      <div className="lbl" style={{ marginTop: 12 }}>Entregas</div>
      {ents.length ? <ListaEntregas lista={ents} /> : <p className="note" style={{ margin: '4px 0 0' }}>No hay entregas publicadas.</p>}
      <p style={{ margin: '10px 0 0' }}><Link className="vermas" to={`/asig/${id}`}>Ver asignatura →</Link></p>
    </>
  );
}

function NotasTodas() {
  const m = useAcademico();
  return (
    <>
      <CabeceraTarjeta id="notas" icono="asis" titulo="Calificaciones" sub="Media de lo publicado · notas de ejemplo" />
      {m.subjects.map((s) => {
        const r = media(m.notas[s.id] || []);
        return (
          <Link key={s.id} className="fila fila-e" to={`/asig/${s.id}/notas`}>
            <span className="ic"><Icon n="libro" /></span>
            <div><b>{s.n}</b><small>Evaluado {r.evaluado} %{(m.notas[s.id] || []).some((x) => x.nuevo) ? ' · nota nueva' : ''}</small></div>
            <b className="media sm">{num(r.media)}</b>
          </Link>
        );
      })}
    </>
  );
}

function Mensajes() {
  const m = useAcademico();
  const { ui } = useUi();
  const nl = sinLeer(m, ui.leidos);
  return (
    <>
      <CabeceraTarjeta id="mensajes" icono="uni" titulo="Mensajes" sub={nl ? `${nl} sin leer` : 'Chats de clase y de grupo'} />
      <ListaChats enTarjeta />
    </>
  );
}

export function TarjetaInicio({ id }) {
  const m = useAcademico();
  let cuerpo = null;
  if (id === 'padel') cuerpo = <Padel />;
  else if (id === 'aula') cuerpo = m.real ? <AulaReal /> : <AulaDemo />;
  else if (id === 'matricula') cuerpo = <Matricula />;
  else if (id === 'notas') cuerpo = <NotasTodas />;
  else if (id === 'mensajes') cuerpo = <Mensajes />;
  else if (id.startsWith('com-')) {
    const c = m.apuntes.find((x) => 'com-' + x.id === id);
    cuerpo = c && <Apunte c={c} />;
  } else if (id.startsWith('notas-')) {
    const s = asignatura(m, id.slice(6));
    cuerpo = (
      <>
        <CabeceraTarjeta id={id} icono="asis" titulo={'Notas · ' + corto(s)} sub={s.c} />
        <NotasTabla id={s.id} />
        <p style={{ margin: '10px 0 0' }}><Link className="vermas" to={`/asig/${s.id}/notas`}>Ver asignatura →</Link></p>
      </>
    );
  } else if (id.startsWith('cont-')) {
    const s = asignatura(m, id.slice(5));
    cuerpo = (
      <>
        <CabeceraTarjeta id={id} icono="libro" titulo={'Contenido · ' + corto(s)} sub="Por temas, con la guía docente" />
        <Contenido id={s.id} />
      </>
    );
  } else if (id.startsWith('chat-')) {
    const c = m.chats.find((x) => 'chat-' + x.id === id);
    cuerpo = c && (
      <>
        <CabeceraTarjeta id={id} icono="uni" titulo={c.t} sub={`${c.n} personas · chat de ejemplo`} />
        <Chat id={c.id} />
      </>
    );
  } else if (id.startsWith('asig-')) cuerpo = <TarjetaAsignatura id={id.slice(5)} />;
  if (!cuerpo) return null;
  return <section className="tarj accion ancho" id={'a-' + id}>{cuerpo}</section>;
}
