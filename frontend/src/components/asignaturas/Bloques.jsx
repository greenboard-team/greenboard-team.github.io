import { Link } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import { DemoFlag, PillEntrega } from '../common/Piezas.jsx';
import { corto, num } from '../../domain/texto.js';
import { fmt, fmtDia, haceDias } from '../../domain/fechas.js';
import { media } from '../../domain/notas.js';
import { asignatura, sesionesAsistencia } from '../../repositories/academicoRepository.js';
import { useAcademico } from '../../store/SesionContext.jsx';
import { useUi } from '../../store/UiContext.jsx';

/** Clases de un día, con cambios de aula y cancelaciones. */
export function HorarioLista({ clases }) {
  const m = useAcademico();
  if (!clases.length) return <p className="note" style={{ margin: 0 }}>No tienes clases ese día.</p>;
  return clases.map((c, i) => {
    const s = asignatura(m, c.s);
    return (
      <Link key={i} className={`fila ${c.cancelada ? 'cancelada' : c.changed ? 'cambio' : ''}`} to={`/asig/${c.s}`}>
        <time>{c.h}<br /><span className="note">{c.f}</span></time>
        <div>
          <b>{corto(s)}</b>
          <small>{c.sub || s.c.split('_').slice(1, 3).join('-')}</small>
          {c.cancelada ? <span className="pill late" style={{ marginTop: 4 }}>Cancelada</span>
            : c.changed ? <span className="pill ok" style={{ marginTop: 4 }}><Icon n="check" />{c.cambioTxt || 'Aula actualizada'}</span> : null}
        </div>
        <span className="aula"><Icon n="pin" />{c.a}</span>
      </Link>
    );
  });
}

/** Entregas: primero las que vienen, luego las pasadas (máximo 4). */
export function ListaEntregas({ lista }) {
  const m = useAcademico();
  const ahora = new Date();
  const fut = lista.filter((x) => new Date(x.d) > ahora);
  const pas = lista.filter((x) => new Date(x.d) <= ahora).reverse();
  return [...fut, ...pas].slice(0, 4).map((x, i) => (
    <Link key={i} className="fila fila-e" to={`/asig/${x.s}/entregas`}>
      <span className="ic"><Icon n="doc" /></span>
      <div><b>{x.t}</b><small>{asignatura(m, x.s).n}</small></div>
      <PillEntrega iso={x.d} />
    </Link>
  ));
}

/** Asistencia de una asignatura. La falta sin justificar lleva el justificante en la misma fila. */
export function Asistencia({ id, soloFalta }) {
  const m = useAcademico();
  const { ui, dispatch, avisar } = useUi();
  const l = sesionesAsistencia(m, id);
  const nombre = soloFalta ? ' · ' + corto(asignatura(m, id)) : '';
  return (
    <div className="asis">
      {l.filter((x) => !soloFalta || !x.v).map((x, i) => {
        const fecha = fmtDia.format(haceDias(x.dias));
        if (x.v) {
          return (
            <div key={i} className="ses"><div><time>{fecha}</time><small>Asistencia registrada</small></div><span className="nota-a">1</span></div>
          );
        }
        if (ui.noJustificada) {
          return (
            <div key={i} className="ses enviado">
              <div><time>{fecha}{nombre}</time><small>Falta sin justificar · has decidido no justificarla</small></div>
              <span className="nota-a">0</span>
              <button className="linkbtn" style={{ gridColumn: '1 / -1', justifySelf: 'start' }} onClick={() => dispatch({ type: 'cambiar', cambios: { noJustificada: false } })}>Deshacer</button>
            </div>
          );
        }
        if (ui.justificado) {
          return (
            <div key={i} className="ses enviado">
              <div><time>{fecha}{nombre}</time><small>Justificante enviado: <b>{ui.archivo}</b> · pendiente de revisión</small></div>
              <span className="nota-a">0</span>
            </div>
          );
        }
        return (
          <div key={i} className="ses falta fila-falta">
            <div><time>{fecha}{nombre}</time><small style={{ color: 'var(--late)', fontWeight: 700 }}>Falta sin justificar</small></div>
            <span className="nota-a" aria-label="Asistencia: 0">0</span>
            <div className="just">
              <label className={`drop ${ui.archivo ? 'has' : ''}`}>
                <input type="file" accept=".pdf,image/*" onChange={(e) => { const f = e.target.files[0]; if (f) dispatch({ type: 'cambiar', cambios: { archivo: f.name } }); }} />
                <span className="ico" aria-hidden="true">↑</span>
                <span>
                  <b>{ui.archivo || 'Sube el justificante'}</b>
                  <small>{ui.archivo ? 'Listo para enviar · toca para cambiarlo' : 'PDF o foto · aquí mismo, sin ir a Trámites'}</small>
                </span>
              </label>
              <div className="fila-b">
                <button className="btn enviar" disabled={!ui.archivo} onClick={() => { dispatch({ type: 'cambiar', cambios: { justificado: true } }); avisar('Justificante enviado. La falta queda pendiente de revisión.'); }}>
                  Enviar justificante
                </button>
                {!ui.archivo && (
                  <button className="linkbtn" onClick={() => dispatch({ type: 'cambiar', cambios: { archivo: 'justificante-medico.pdf' } })}>Usar un justificante de ejemplo</button>
                )}
                <button className="linkbtn" onClick={() => { dispatch({ type: 'cambiar', cambios: { noJustificada: true, archivo: null } }); avisar('Vale, no la justificas. Ya no te lo recordaremos.'); }}>No justificar</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const TIPO_IC = { enunciado: 'doc', enlace: 'chispa', pronto: 'reloj' };

/** Contenido por temas: la guía docente primero (con su evaluación), luego cada tema plegable. */
export function Contenido({ id }) {
  const m = useAcademico();
  const { avisar } = useUi();
  const s = asignatura(m, id);
  const temas = m.contenido[id] || [];
  const evalua = (m.notas[id] || []).map((x) => `${x.t} ${x.p} %`).join(' · ');
  const abierto = Math.max(0, temas.findIndex((u) => u.items.some((x) => x.nuevo)));
  const abrirDoc = () => avisar('En la app real se abre el archivo de Blackboard.');
  return (
    <div className="temas">
      <details className="tema" open>
        <summary><span><Icon n="libro" />Guía docente 2026/27</span><span className="note">evaluación</span></summary>
        <div className="tema-c">
          <button className="mat" onClick={abrirDoc}><Icon n="doc" /><span>Guía docente · {corto(s)}.pdf</span></button>
          <p className="note" style={{ margin: '6px 0 0' }}><b>Evaluación:</b> {evalua} <DemoFlag>pesos de ejemplo</DemoFlag></p>
        </div>
      </details>
      {temas.map((u, i) => (
        <details key={i} className="tema" open={i === abierto}>
          <summary>
            <span><Icon n="cal" />{u.u}</span>
            <span className="note">{u.items.filter((x) => x.tipo !== 'pronto').length || ''}{u.items.some((x) => x.nuevo) && <> <span className="pill ok">nuevo</span></>}</span>
          </summary>
          <div className="tema-c">
            {u.items.map((x, j) => (x.tipo === 'pronto'
              ? <p key={j} className="note" style={{ margin: '4px 0' }}>{x.t}</p>
              : <button key={j} className="mat" onClick={abrirDoc}><Icon n={TIPO_IC[x.tipo] || 'doc'} /><span>{x.t}</span>{x.nuevo && <span className="pill ok">nuevo</span>}</button>))}
          </div>
        </details>
      ))}
    </div>
  );
}

export function NotasTabla({ id }) {
  const m = useAcademico();
  const l = m.notas[id] || [];
  const r = media(l);
  return (
    <>
      <div className="resumen-n">
        <div><span className="lbl">Media actual</span><b className="media">{num(r.media)}</b></div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <span className="lbl">Evaluado {r.evaluado} % · acumulado {num(r.acumulada)} / 10</span>
          <div className="barra-n"><span style={{ width: `${r.evaluado}%` }} /></div>
        </div>
      </div>
      {l.map((x, i) => (
        <div key={i} className="fila fila-n">
          <div><b>{x.t}</b><small>Peso {x.p} %</small></div>
          {x.nuevo ? <span className="pill ok">nueva</span> : <span />}
          <span className={`nota-n ${x.n == null ? 'pend' : x.n < 5 ? 'baja' : ''}`}>{x.n == null ? 'pendiente' : num(x.n)}</span>
        </div>
      ))}
    </>
  );
}

export const fechaCorta = (iso) => fmt.format(new Date(iso));
