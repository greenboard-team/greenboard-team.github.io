import { Link } from 'react-router-dom';
import Icon from '../components/common/Icon.jsx';
import { DemoFlag } from '../components/common/Piezas.jsx';
import { BarraComandos } from '../components/inicio/BarraComandos.jsx';
import { TarjetaInicio } from '../components/inicio/Tarjetas.jsx';
import { CambioFrase, ListaCambios } from '../components/inicio/Cambios.jsx';
import { Asistencia, HorarioLista, ListaEntregas } from '../components/asignaturas/Bloques.jsx';
import { ResumenComunidad } from '../components/community/ResumenComunidad.jsx';
import { MigrarBlackboard } from './CuentaPages.jsx';
import { capitalizar, fmtDia, fmtLargo, saludo } from '../domain/fechas.js';
import { asignatura, sesionesAsistencia, tituloHorario } from '../repositories/academicoRepository.js';
import { useAcademico } from '../store/SesionContext.jsx';
import { faltaPendiente, useUi } from '../store/UiContext.jsx';
import { useInstalar } from '../hooks/useInstalar.js';
import { useAbrir } from '../hooks/useAbrir.js';

export function AvisoInstalar({ siempre }) {
  const { modo, cerrado, instalar, cerrar } = useInstalar();
  const { avisar } = useUi();
  if (!modo || (cerrado && !siempre)) return null;
  const x = !siempre && <button className="cerrar" aria-label="No mostrar más" onClick={cerrar}><Icon n="cerrar" /></button>;
  if (modo === 'aviso') {
    return (
      <div className="instalar" id="instalar">
        <img src="icons/icon-192.png" alt="" />
        <p><b>Instala Greenboard</b>Ábrela como una app, desde tu pantalla de inicio.</p>
        <button className="btn sm" onClick={async () => { if (await instalar()) avisar('Greenboard instalada'); }}>Instalar</button>{x}
      </div>
    );
  }
  return (
    <div className="instalar" id="instalar">
      <img src="icons/icon-192.png" alt="" />
      <p><b>Añadir a pantalla de inicio</b>Toca <span className="compartir" aria-label="Compartir">↑</span> Compartir y luego «Añadir a pantalla de inicio».</p>{x}
    </div>
  );
}

function Aviso() {
  const m = useAcademico();
  const { ui, dispatch } = useUi();
  const abrir = useAbrir();
  if (ui.avisoCerrado) return null;
  let texto;
  if (!m.real) {
    texto = <><b>Aviso:</b> Proyectos III cambia al <b>aula 112</b> {m.cuandoClase} a las 11:00. Ya está actualizado en tu horario.</>;
  } else {
    const c = m.real.cambios[0];
    if (!c) return null;
    const n = m.real.cambios.length;
    texto = (
      <>
        <b>Aviso:</b> <CambioFrase c={c} cuando={`${fmtDia.format(new Date(c.d + 'T12:00'))} a las ${c.h}`} />
        {n > 1 && <> <button className="linkbtn" onClick={() => abrir('horario')}>y {n - 1} cambio{n > 2 ? 's' : ''} más</button></>}. Sale de WebUntis y ya está en tu horario.
      </>
    );
  }
  return (
    <div className="aviso" id="aviso">
      <span className="ic"><Icon n="aviso" /></span>
      <p>{texto}</p>
      <button aria-label="Cerrar aviso" onClick={() => dispatch({ type: 'cambiar', cambios: { avisoCerrado: true } })}><Icon n="cerrar" /></button>
    </div>
  );
}

export default function InicioPage() {
  const m = useAcademico();
  const { ui } = useUi();
  const l = sesionesAsistencia(m, m.asisId);
  const ahora = new Date();
  return (
    <>
      <div className="hola">
        <h2>{saludo(ahora.getHours())}, {m.nombre}</h2>
        <p>{capitalizar(fmtLargo.format(ahora))}</p>
      </div>
      <BarraComandos />
      <AvisoInstalar />
      <Aviso />
      <div className="panel" id="panel">
        {ui.abiertas.map((id) => <TarjetaInicio key={id} id={id} />)}
        <section className="tarj" id="t-horario">
          <div className="tarj-h">
            <span className="ic"><Icon n="cal" /></span>
            <h4>{tituloHorario(m)}<small>{fmtLargo.format(m.diaClase)}</small></h4>
            <span className="pill ok" title={m.real ? `WebUntis, ${m.real.generado}` : undefined}><Icon n="check" />Actualizado</span>
          </div>
          <HorarioLista clases={m.today} />
          {m.real && <ListaCambios cambios={m.real.cambios} />}
          <p className="note" style={{ margin: '8px 0 0' }}><Link to="/horario">Ver la semana y los planes en tus huecos →</Link></p>
        </section>
        <section className="tarj" id="t-asis">
          <div className="tarj-h">
            <span className="ic" style={!faltaPendiente(ui) ? undefined : { background: 'var(--late-bg)', color: 'var(--late)' }}><Icon n="asis" /></span>
            <h4>Asistencia<small>{asignatura(m, m.asisId).n} · {l.filter((x) => x.v).length} de {l.length}</small></h4>
            <DemoFlag>de ejemplo</DemoFlag>
          </div>
          <Asistencia id={m.asisId} soloFalta />
          <p className="note" style={{ margin: '8px 0 0' }}>El resto de asignaturas, todo en verde. <Link to={`/asig/${m.asisId}`}>Ver asistencia completa</Link></p>
        </section>
        <section className="tarj" id="t-entregas">
          <div className="tarj-h">
            <span className="ic"><Icon n="doc" /></span>
            <h4>Próximas entregas{m.real?.bb && <small>De tu calendario de Blackboard</small>}</h4>
            {!(m.real && !m.real.bb) && <Link className="vermas" to="/ent">Ver todas →</Link>}
          </div>
          {m.real && !m.real.bb ? <MigrarBlackboard />
            : m.due.length ? <ListaEntregas lista={m.due} /> : <p className="note" style={{ margin: 0 }}>No tienes entregas pendientes en Blackboard.</p>}
        </section>
        <ResumenComunidad />
      </div>
    </>
  );
}
