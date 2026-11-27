import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/common/Icon.jsx';
import { Hecho } from '../components/common/Piezas.jsx';
import { AvisoInstalar } from './InicioPage.jsx';
import { norm } from '../domain/texto.js';
import { useSesion } from '../store/SesionContext.jsx';
import { useUi } from '../store/UiContext.jsx';

/** Pantalla de entrada (sin menú): correo de U-tad + código de invitación, o ver la demo. */
export function EntrarPage() {
  const { entrar, puerta, verDemo, carga, cargar, salir, token } = useSesion();
  const [correo, setCorreo] = useState(puerta.correo || '');
  const [codigo, setCodigo] = useState('');

  if (token && carga === 'cargando') return <div className="puerta"><p className="cargando">Cargando tu horario…</p></div>;
  if (token && carga === 'error') {
    return (
      <div className="puerta">
        <p className="error">No se han podido leer tus datos.</p>
        <p><button className="btn" onClick={cargar}>Reintentar</button> <button className="linkbtn" onClick={salir}>Cerrar sesión</button></p>
      </div>
    );
  }
  return (
    <div className="puerta">
      <span className="brand"><i>G</i>Greenboard</span>
      <h2>Entra con tu correo de U-tad</h2>
      <p className="note">El prototipo con tus datos reales (horario de WebUntis, aulas libres y tus entregas de Blackboard) es solo para alumnos de U-tad.</p>
      <form onSubmit={(e) => { e.preventDefault(); entrar(correo.trim(), codigo.trim()); }}>
        <div className="campo"><label htmlFor="correo">Correo de alumno</label>
          <input id="correo" type="email" autoComplete="email" inputMode="email" required placeholder="nombre.apellido@live.u-tad.com" value={correo} onChange={(e) => setCorreo(e.target.value)} />
        </div>
        <div className="campo"><label htmlFor="codigo">Código de invitación</label>
          <input id="codigo" autoComplete="off" placeholder="Te lo da el equipo Greenboard" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
        </div>
        {puerta.error && <p className="error" role="alert">{puerta.error}</p>}
        {puerta.ok && <div style={{ marginTop: 12 }}><Hecho>{puerta.ok}</Hecho></div>}
        <p style={{ margin: '16px 0 0' }}><button className="btn" id="btn-entrar" disabled={puerta.enviando}>{puerta.enviando ? 'Entrando…' : 'Entrar'}</button></p>
      </form>
      <p className="note" style={{ marginTop: 18 }}>
        Nunca te pediremos tu contraseña de U-tad ni la de Blackboard. <button className="linkbtn" onClick={verDemo}>Ver la demo con datos de ejemplo</button>
      </p>
    </div>
  );
}

/** Elegir grupos de WebUntis (doble grado: hasta 3). */
export function GruposPage() {
  const { api, academico, guardarGrupos } = useSesion();
  const { avisar } = useUi();
  const navigate = useNavigate();
  const [lista, setLista] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [elegidos, setElegidos] = useState(() => [...(academico?.real?.grupos || [])]);

  useEffect(() => { api.grupos().then((r) => setLista(r.grupos)).catch(() => setLista({})); }, [api]);
  if (!lista) return <div className="puerta"><p className="cargando">Cargando los grupos de WebUntis…</p></div>;
  const f = norm(filtro);
  const filtrados = Object.entries(lista).filter(([g, n]) => !f || norm(g + ' ' + n).includes(f));
  const elegir = (g) => setElegidos((e) => (e.includes(g) ? e.filter((x) => x !== g) : [...e, g].slice(-3)));
  const guardar = async () => {
    try { await guardarGrupos(elegidos); navigate('/inicio'); } catch { avisar('No se han podido guardar los grupos'); }
  };
  return (
    <div className="puerta" style={{ maxWidth: 720, marginTop: '2vh' }}>
      <span className="brand"><i>G</i>Greenboard</span>
      <h2>¿En qué grupo estás?</h2>
      <p className="note">Tu horario sale de tu grupo de WebUntis. Si haces doble grado, elige los dos (por ejemplo <b>FIIS4A</b> y <b>MAIS4A</b>) y se juntan en uno. Hasta 3.</p>
      <div className="campo"><label htmlFor="fg">Buscar grupo</label><input id="fg" type="search" placeholder="MAIS4, Física, Animación…" value={filtro} onChange={(e) => setFiltro(e.target.value)} /></div>
      {filtrados.length ? (
        <div className="grupos">
          {filtrados.map(([g, n]) => (
            <button key={g} className="grupo" aria-pressed={elegidos.includes(g)} onClick={() => elegir(g)}><b>{g}</b><small>{n}</small></button>
          ))}
        </div>
      ) : <p className="note">Ningún grupo con ese nombre.</p>}
      <p style={{ margin: '16px 0 0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn" id="btn-grupos" disabled={!elegidos.length} onClick={guardar}>{elegidos.length ? 'Ver mi horario · ' + elegidos.join(' + ') : 'Elige tu grupo'}</button>
        {academico?.real?.grupos?.length > 0 && <Link to="/inicio" className="note">Cancelar</Link>}
      </p>
    </div>
  );
}

const ERR_BB = {
  enlace: 'Ese no es el enlace del calendario de Blackboard de U-tad (acaba en /learn.ics).',
  'no-responde': 'Blackboard no ha devuelto un calendario con ese enlace.',
};

/** Migrar desde Blackboard: el alumno pega su enlace de calendario; el Worker lo lee y lo guarda solo para él. */
export function MigrarBlackboard() {
  const { conectarBB, academico } = useSesion();
  const { avisar } = useUi();
  const [url, setUrl] = useState('');
  const [leyendo, setLeyendo] = useState(false);
  const importar = async () => {
    setLeyendo(true);
    try {
      const r = await conectarBB(url.trim());
      avisar(`Importadas ${r.entregas} entregas de Blackboard`);
    } catch (e) {
      setLeyendo(false);
      avisar(ERR_BB[e.message] || 'No se ha podido importar');
    }
  };
  return (
    <>
      <p style={{ margin: '0 0 8px' }}><b>Migrar desde Blackboard.</b> Pega el enlace de tu calendario de Blackboard y aquí salen todas tus entregas, con su fecha.</p>
      <ol className="pasos">
        <li>En Blackboard, abre <b>Calendario</b> (menú de la izquierda).</li>
        <li>Toca el engranaje <b>⚙</b> (ajustes del calendario) y, abajo, <b>Compartir calendario</b>.</li>
        <li>Genera el enlace y cópialo. Empieza por <span className="code">https://u-tad.blackboard.com/webapps/calendar/calendarFeed/</span></li>
      </ol>
      <div className="campo"><label htmlFor="bb-url">Enlace de tu calendario</label>
        <input id="bb-url" type="url" autoComplete="off" spellCheck="false" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://u-tad.blackboard.com/webapps/calendar/calendarFeed/…/learn.ics" />
      </div>
      {academico?.real?.bbError && <p className="error">Blackboard no ha devuelto tu calendario ({academico.real.bbError}). Si lo regeneraste, pega el enlace nuevo.</p>}
      <p style={{ margin: '12px 0 0' }}><button className="btn" id="btn-bb" disabled={leyendo} onClick={importar}>{leyendo ? 'Leyendo tu calendario…' : 'Importar mis entregas'}</button></p>
      <p className="note" style={{ margin: '10px 0 0' }}>Ese enlace es personal, como una contraseña de solo lectura: se guarda solo en tu cuenta y no se enseña a nadie. Nunca te pediremos tu contraseña de Blackboard. Lo puedes quitar en Ajustes.</p>
    </>
  );
}

export function AjustesPage() {
  const { academico: m, quitarBB, salir } = useSesion();
  const { avisar } = useUi();
  if (!m?.real) return <p className="note">Los ajustes solo existen cuando entras con tu correo.</p>;
  return (
    <>
      <div className="row"><h3>Ajustes</h3><span className="note">{m.real.correo}</span></div>
      <h3 className="sub">Tus grupos</h3>
      <p>{m.real.grupos.map((g) => <span key={g} className="pill ok">{g}</span>)} <Link to="/grupos" style={{ marginLeft: 8 }}>Cambiar</Link></p>
      <h3 className="sub">Blackboard</h3>
      {m.real.bb
        ? <p>Tus entregas se leen de tu calendario de Blackboard. <button className="linkbtn" onClick={async () => { await quitarBB(); avisar('Enlace de Blackboard borrado'); }}>Quitar el enlace</button></p>
        : <div className="tarj"><MigrarBlackboard /></div>}
      <h3 className="sub">App en el móvil</h3>
      <AvisoInstalar siempre />
      <h3 className="sub">Sesión</h3>
      <p><button className="btn dark" onClick={salir}><Icon n="cerrar" />Cerrar sesión</button></p>
      <p className="note">Horario actualizado: {m.real.generado || '—'}. Asistencia, Green Community, pádel y matrícula siguen siendo de ejemplo.</p>
    </>
  );
}
