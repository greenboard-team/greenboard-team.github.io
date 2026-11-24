import { Link, useParams } from 'react-router-dom';
import { DemoFlag, PillEntrega } from '../components/common/Piezas.jsx';
import { Asistencia, Contenido, ListaEntregas, NotasTabla } from '../components/asignaturas/Bloques.jsx';
import { Chat, ListaChats } from '../components/mensajes/Chat.jsx';
import { Matricula } from '../components/inicio/Tarjetas.jsx';
import { MigrarBlackboard } from './CuentaPages.jsx';
import Icon from '../components/common/Icon.jsx';
import { num } from '../domain/texto.js';
import { diaDe, fmt, fmtDia, fmtH, isoDia } from '../domain/fechas.js';
import { media, tieneNotaNueva } from '../domain/notas.js';
import { cortoAula } from '../services/adapters/webuntisAdapter.js';
import { slug } from '../domain/texto.js';
import { asignatura, sesionesAsistencia } from '../repositories/academicoRepository.js';
import { useAcademico } from '../store/SesionContext.jsx';
import { useUi } from '../store/UiContext.jsx';

const SUBTABS = [['contenido', 'Contenido'], ['notas', 'Notas'], ['asistencia', 'Asistencia'], ['entregas', 'Entregas'], ['chat', 'Chat']];

function ProximasClases({ id }) {
  const m = useAcademico();
  const hoy = isoDia(new Date());
  const l = m.real.sesiones.filter((x) => slug(x.asig) === id && x.d >= hoy).slice(0, 3);
  if (!l.length) return <p className="note" style={{ margin: 0 }}>No hay más clases en las próximas semanas.</p>;
  return l.map((x, i) => (
    <div key={i} className={`fila ${x.estado === 'cancelada' ? 'cancelada' : ''}`}>
      <time>{fmtDia.format(diaDe(x.d))}<br /><span className="note">{x.h}–{x.f}</span></time>
      <div><b>{x.prof || ''}</b><small>{x.g.join(' · ')}</small></div>
      <span className="aula"><Icon n="pin" />{cortoAula(x)}</span>
    </div>
  ));
}

export function AsignaturasPage() {
  const m = useAcademico();
  const { ui } = useUi();
  return (
    <>
      <div className="row"><h3>Mis asignaturas</h3><span className="note">{m.subjects.length} asignaturas · {m.real ? 'de tu horario de WebUntis' : 'datos de Blackboard'}</span></div>
      <div className="cards">
        {m.subjects.map((s) => (
          <Link key={s.id} className="card" to={`/asig/${s.id}`}>
            <h4>{s.n}</h4>
            <div className="code">{s.c}</div>
            {s.p && <p className="note" style={{ margin: '8px 0 0' }}>Profesor: {s.p}</p>}
            {s.last && <p className="note" style={{ margin: '8px 0 0' }}>{s.last}</p>}
            {s.id === m.asisId && !ui.justificado && <p style={{ margin: '8px 0 0' }}><span className="pill late">1 falta sin justificar{m.real ? ' · de ejemplo' : ''}</span></p>}
          </Link>
        ))}
      </div>
    </>
  );
}

/** Ficha de asignatura con pestañas: Contenido · Notas · Asistencia · Entregas · Chat. */
export function AsignaturaPage() {
  const { id, sub: subUrl } = useParams();
  const m = useAcademico();
  const { ui } = useUi();
  const s = m.subjects.find((x) => x.id === id);
  if (!s) return <AsignaturasPage />;
  const l = sesionesAsistencia(m, id);
  const pres = l.filter((x) => x.v).length;
  const falta = id === m.asisId && !ui.justificado;
  const sub = SUBTABS.some(([k]) => k === subUrl) ? subUrl : falta ? 'asistencia' : 'contenido';
  const chat = m.chats.find((c) => c.id === id);
  const ents = m.due.filter((x) => x.s === id);

  let cuerpo;
  if (sub === 'contenido') cuerpo = <><div className="row"><h3 className="sub" style={{ margin: 0 }}>Contenido</h3><DemoFlag>contenido de ejemplo · por temas</DemoFlag></div><Contenido id={id} /></>;
  else if (sub === 'notas') cuerpo = <><div className="row"><h3 className="sub" style={{ margin: 0 }}>Calificaciones</h3><DemoFlag>notas de ejemplo</DemoFlag></div><div className="tarj" style={{ marginTop: 10 }}><NotasTabla id={id} /></div></>;
  else if (sub === 'asistencia') {
    cuerpo = (
      <>
        <div className="row"><h3 className="sub" style={{ margin: 0 }}>Asistencia</h3><DemoFlag>asistencia de ejemplo</DemoFlag></div>
        <p><span className={`pill ${pres === l.length ? 'ok' : 'late'}`}>{pres} de {l.length} sesiones</span></p>
        <Asistencia id={id} />
      </>
    );
  } else if (sub === 'entregas') cuerpo = <><h3 className="sub">Entregas</h3><div className="tarj">{ents.length ? <ListaEntregas lista={ents} /> : <p className="note" style={{ margin: 0 }}>No hay entregas publicadas.</p>}</div></>;
  else {
    cuerpo = chat
      ? <><div className="row"><h3 className="sub" style={{ margin: 0 }}>{chat.t}</h3><span className="note">{chat.n} personas</span></div><div className="tarj" style={{ marginTop: 10 }}><Chat id={chat.id} /></div></>
      : <p className="note">Esta asignatura todavía no tiene chat de clase.</p>;
  }

  return (
    <>
      <Link className="atras" to="/asig">‹ Mis asignaturas</Link>
      <div className="ficha"><h3>{s.n}</h3><div className="code">{s.c}</div>{s.p && <p className="note" style={{ margin: 0 }}>Profesor: {s.p}</p>}</div>
      {m.real && <><h3 className="sub">Próximas clases</h3><div className="tarj"><ProximasClases id={id} /></div></>}
      <nav className="subnav" aria-label="Secciones de la asignatura">
        {SUBTABS.map(([k, t]) => (
          <Link key={k} to={`/asig/${id}/${k}`} aria-current={sub === k ? 'page' : undefined}>
            {t}
            {k === 'asistencia' && falta && <> <span className="pill late">0</span></>}
            {k === 'notas' && tieneNotaNueva(m.notas[id]) && <> <span className="pill ok">nueva</span></>}
          </Link>
        ))}
      </nav>
      {cuerpo}
    </>
  );
}

export function CalificacionesPage() {
  const m = useAcademico();
  return (
    <>
      <div className="row"><h3>Calificaciones</h3><DemoFlag>notas de ejemplo</DemoFlag></div>
      <p className="note">Media de lo ya publicado, ponderada por el peso de cada parte en la guía docente.</p>
      <div className="cards">
        {m.subjects.map((s) => {
          const r = media(m.notas[s.id] || []);
          return (
            <Link key={s.id} className="card" to={`/asig/${s.id}/notas`}>
              <div className="row" style={{ alignItems: 'center' }}><h4 style={{ flex: 1 }}>{s.n}</h4><b className="media sm">{num(r.media)}</b></div>
              <div className="barra-n"><span style={{ width: `${r.evaluado}%` }} /></div>
              <p className="note" style={{ margin: '6px 0 0' }}>Evaluado {r.evaluado} %{tieneNotaNueva(m.notas[s.id]) && <> · <span className="pill ok">nota nueva</span></>}</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export function EntregasPage() {
  const m = useAcademico();
  if (m.real && !m.real.bb) return <><div className="row"><h3>Entregas</h3></div><div className="tarj" style={{ marginTop: 14 }}><MigrarBlackboard /></div></>;
  return (
    <>
      <div className="row"><h3>Entregas</h3><span className="note">{m.real ? 'De tu calendario de Blackboard' : 'Todas tus asignaturas, por fecha'}</span></div>
      <div className="list">
        {!m.due.length && <p className="note">No hay entregas en tu calendario de Blackboard.</p>}
        {m.due.map((x, i) => (
          <Link key={i} className="item" to={`/asig/${x.s}/entregas`}>
            <time>{fmt.format(new Date(x.d))} · {fmtH.format(new Date(x.d))}</time>
            <div className="what">{x.t}<small>{asignatura(m, x.s).n}</small></div>
            <PillEntrega iso={x.d} />
          </Link>
        ))}
      </div>
    </>
  );
}

export function MensajesPage() {
  const { id } = useParams();
  const m = useAcademico();
  const c = id && m.chats.find((x) => x.id === id);
  if (c) {
    return (
      <>
        <Link className="atras" to="/msg">‹ Mensajes</Link>
        <div className="row"><h3>{c.t}</h3><span className="note">{c.n} personas{c.s && <> · <Link to={`/asig/${c.s}`}>ver asignatura</Link></>}</span></div>
        <div className="tarj" style={{ marginTop: 12 }}><Chat id={c.id} /></div>
        <p className="note">Chat de ejemplo: tus mensajes se quedan en este navegador.</p>
      </>
    );
  }
  return (
    <>
      <div className="row"><h3>Mensajes</h3><DemoFlag>chats de ejemplo</DemoFlag></div>
      <p className="note">Un chat por asignatura y por grupo de trabajo.</p>
      <div className="tarj" style={{ marginTop: 12 }}><ListaChats /></div>
    </>
  );
}

export function TramitesPage() {
  const { ui, dispatch } = useUi();
  return (
    <>
      <div className="row"><h3>Trámites</h3><DemoFlag>simulado: no se envía nada</DemoFlag></div>
      <div className="aviso"><p>Los justificantes de faltas se suben en <b>Asistencia</b>, junto a la falta. Las reservas de aulas, desde la barra de Inicio. <Link to="/inicio">Ir a Inicio</Link></p></div>
      <h3 className="sub">Matrícula firmada</h3>
      <button className="btn dark" onClick={() => dispatch({ type: 'cambiar', cambios: { mat: !ui.mat } })}>{ui.mat ? 'Ocultar' : 'Ver'} matrícula 2026/27</button>
      {ui.mat && <Matricula conCabecera={false} />}
    </>
  );
}
