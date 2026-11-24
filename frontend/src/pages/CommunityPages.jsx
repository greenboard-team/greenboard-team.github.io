import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Icon from '../components/common/Icon.jsx';
import { DemoFlag, Segmentos } from '../components/common/Piezas.jsx';
import BannerGta from '../components/community/BannerGta.jsx';
import { ListaAnuncios } from '../components/community/Anuncios.jsx';
import { Cuadro, DEPORTE, PREMIO, TarjetaTorneo } from '../components/community/Torneos.jsx';
import FormularioAnuncio from '../components/community/FormularioAnuncio.jsx';
import { ApuntesLista, BotonApunte } from '../components/inicio/Tarjetas.jsx';
import universidad from '../data/universidad.json';
import { filtrar, ordenar } from '../domain/comunidad/anuncios.js';
import { bote, campeon, plazasTorneo, TAMANOS } from '../domain/comunidad/torneos.js';
import { euros, norm } from '../domain/texto.js';
import { useAcademico } from '../store/SesionContext.jsx';
import { useComunidad } from '../store/ComunidadContext.jsx';
import { useUi } from '../store/UiContext.jsx';
import { usePerfil } from '../hooks/usePerfil.js';

const FILTROS = [
  { k: 'todos', t: 'Todo' },
  { k: 'futbol', t: '⚽ Fútbol sala' },
  { k: 'padel', t: '🎾 Pádel' },
  { k: 'videojuegos', t: '🎮 Videojuegos' },
  { k: 'arte', t: '🎨 Arte' },
];
const filtroDe = (k) => (['futbol', 'padel'].includes(k) ? { tipo: k } : k === 'todos' ? {} : { tipo: 'plan', categoria: k });

function Apuntes() {
  const m = useAcademico();
  const { ui, dispatch, avisar } = useUi();
  return (
    <div className="cards">
      {m.apuntes.map((c) => (
        <div key={c.id} className="card act">
          <h4>📚 {c.t}</h4>
          <p className="note">{c.s}</p>
          {c.tipo === 'apuntes' ? (
            <details className="gc-apuntes">
              <summary className="btn">{c.accion}</summary>
              <ApuntesLista c={c} />
            </details>
          ) : (
            <BotonApunte c={c} hecho={ui.com[c.id]} onClick={() => { dispatch({ type: 'apuntarCom', id: c.id }); avisar('Apuntado (demo)'); }} />
          )}
        </div>
      ))}
    </div>
  );
}

function BotonSeguir({ id }) {
  const { seguidas, dispatch } = useComunidad();
  const sigo = seguidas.includes(id);
  return (
    <button className={`btn sm ${sigo ? 'dark' : ''}`} onClick={(e) => { e.preventDefault(); dispatch({ type: 'seguir', id }); }} aria-pressed={sigo}>
      {sigo ? '✓ Siguiendo' : 'Seguir'}
    </button>
  );
}

/** Portada de Green Community: destacada, filtros, anuncios, torneos, comunidades y estudio. */
export function CommunityPage() {
  const m = useAcademico();
  const { anuncios, comunidades, torneos } = useComunidad();
  const [params, setParams] = useSearchParams();
  const [texto, setTexto] = useState('');
  const [enHuecos, setEnHuecos] = useState(false);
  const filtro = params.get('tipo') || 'todos';
  const nuevo = params.get('nuevo');

  useEffect(() => {
    if (!nuevo) return;
    const el = document.getElementById('gc-' + nuevo);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('recien'); }
  }, [nuevo]);

  const lista = ordenar(filtrar(anuncios, { ...filtroDe(filtro), texto, enMisHuecos: enHuecos, semana: m.semana }, norm));
  const gta = comunidades.find((c) => c.id === 'gta6');
  const planesGta = anuncios.filter((a) => a.comunidad === 'gta6').length;
  const miembros = comunidades.reduce((a, c) => a + c.miembros, 0);

  return (
    <>
      <header className="gc-hero">
        <div>
          <span className="gc-marca">🌿 Green Community</span>
          <h2>Lo que pasa en {universidad.nombre} fuera de clase</h2>
          <p>Pachangas, pádel, torneos y planes con gente de la uni, en los huecos de tu horario.</p>
          <div className="gc-stats">
            <span><b>{miembros}</b> en comunidades</span>
            <span><b>{anuncios.length}</b> planes esta semana</span>
            <span><b>{torneos.length}</b> torneos</span>
          </div>
        </div>
        <Link className="btn" to="/community/nuevo"><Icon n="mas" />Organizar algo</Link>
      </header>

      {gta && (
        <Link className="gc-destacada" to="/community/c/gta6">
          <BannerGta alto={170} />
          <div className="gc-destacada-pie">
            <div><span className="pill ok">Nuevo</span> <b>{gta.nombre}</b><small>{gta.lema} · {gta.miembros} miembros · {planesGta} planes</small></div>
            <span className="btn sm">Buscar gente <Icon n="flecha" /></span>
          </div>
        </Link>
      )}

      <div className="gc-filtros">
        <Segmentos etiqueta="Filtrar" valor={filtro} onCambio={(k) => setParams(k === 'todos' ? {} : { tipo: k })} opciones={FILTROS} />
        <div className="gc-toolbar">
          <input className="gc-buscar" type="search" placeholder="Buscar: GTA, Retiro, Lucía…" value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Buscar planes" />
          <label className="gc-switch"><input type="checkbox" checked={enHuecos} onChange={(e) => setEnHuecos(e.target.checked)} />Solo lo que cabe en mi horario</label>
        </div>
      </div>

      <ListaAnuncios anuncios={lista} />

      <div className="row gc-seccion"><h3 className="sub">Torneos de la universidad</h3><Link className="vermas" to="/community/torneos">Todos los torneos →</Link></div>
      <div className="gc-torneos">{torneos.slice(0, 2).map((t) => <TarjetaTorneo key={t.id} t={t} />)}</div>

      <div className="row gc-seccion"><h3 className="sub">Comunidades</h3><DemoFlag>miembros de ejemplo</DemoFlag></div>
      <div className="gc-comunidades">
        {comunidades.map((c) => (
          <Link key={c.id} className="gc-comunidad" to={`/community/c/${c.id}`}>
            <span className="gc-emoji" aria-hidden="true">{c.emoji}</span>
            <div><b>{c.nombre}</b><small>{c.miembros} miembros</small></div>
            <BotonSeguir id={c.id} />
          </Link>
        ))}
      </div>

      <div className="row gc-seccion"><h3 className="sub">Estudio · apuntes y clases de apoyo</h3><DemoFlag>compañeros de ejemplo</DemoFlag></div>
      <Apuntes />
      <p className="note" style={{ marginTop: 24 }}>Los anuncios se revisan automáticamente antes de publicarse. <Link to="/community/moderacion">Panel de moderación (Vida universitaria) →</Link></p>
    </>
  );
}

/** Una comunidad: su portada, filtro por modo de juego y sus planes. */
export function ComunidadDetallePage() {
  const { id } = useParams();
  const { comunidades, anuncios, torneos } = useComunidad();
  const [modo, setModo] = useState('');
  const c = comunidades.find((x) => x.id === id);
  if (!c) return <p className="note">Esa comunidad no existe. <Link to="/community">Volver</Link></p>;
  const suyos = anuncios.filter((a) => a.comunidad === c.id || (c.categoria === 'deporte' && a.tipo === c.id));
  const lista = ordenar(suyos.filter((a) => !modo || a.plan?.modo === modo));
  const susTorneos = torneos.filter((t) => t.deporte === c.id);
  return (
    <>
      <Link className="atras" to="/community">‹ Green Community</Link>
      {c.banner === 'gta6' ? <div className="gc-banner"><BannerGta alto={190} /></div> : <div className="gc-cabecera-com"><span aria-hidden="true">{c.emoji}</span></div>}
      <div className="row" style={{ marginTop: 14 }}>
        <h3>{c.nombre}</h3>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span className="note">{c.miembros} miembros</span><BotonSeguir id={c.id} /></span>
      </div>
      <p>{c.descripcion}</p>
      {c.modos && (
        <>
          <div className="lbl">¿A qué te apetece?</div>
          <Segmentos etiqueta="Modo" valor={modo} onCambio={(k) => setModo(k === modo ? '' : k)} opciones={[{ k: '', t: 'Todo' }, ...c.modos.map((x) => ({ k: x, t: x }))]} />
        </>
      )}
      <p style={{ margin: '14px 0' }}>
        <Link className="btn" to={c.categoria === 'deporte' ? `/community/nuevo?tipo=${c.id}` : `/community/nuevo?comunidad=${c.id}`}>
          <Icon n="mas" />{c.categoria === 'deporte' ? (c.id === 'padel' ? 'Buscar pareja o rivales' : 'Montar una pachanga') : `Crear plan en ${c.nombre}`}
        </Link>
      </p>
      {c.id === 'estudio' ? <Apuntes /> : <ListaAnuncios anuncios={lista} vacio={modo ? `Nadie ha propuesto «${modo}» todavía. ¡Propónlo tú!` : undefined} />}
      {susTorneos.length > 0 && (
        <>
          <h3 className="sub">Torneos</h3>
          <div className="gc-torneos">{susTorneos.map((t) => <TarjetaTorneo key={t.id} t={t} />)}</div>
        </>
      )}
    </>
  );
}

export function NuevoAnuncioPage() {
  return (
    <>
      <Link className="atras" to="/community">‹ Green Community</Link>
      <div className="row"><h3>Organizar algo</h3><DemoFlag>se guarda en este navegador</DemoFlag></div>
      <p className="note">Elige qué, cuándo y cuántos buscas. Se publica y le sale a quien tenga ese hueco libre en su horario.</p>
      <FormularioAnuncio />
    </>
  );
}

/** «Ver como universidad»: en la demo, cualquiera puede probar la vista de quien organiza los torneos. */
function useVistaUniversidad() {
  const [params, setParams] = useSearchParams();
  return [params.get('vista') === 'universidad', (uni) => setParams(uni ? { vista: 'universidad' } : {})];
}

function SelectorVista({ uni, alCambiar }) {
  return (
    <div className="gc-vista">
      <span className="note">Ver como</span>
      <Segmentos etiqueta="Ver como" valor={uni ? 'uni' : 'alumno'} onCambio={(k) => alCambiar(k === 'uni')}
        opciones={[{ k: 'alumno', t: 'Alumno' }, { k: 'uni', t: '🏛 Universidad' }]} />
    </div>
  );
}

function FormTorneo({ alCrear }) {
  const { hacer } = useComunidad();
  const [t, setT] = useState({ nombre: '', deporte: 'futbol', equipos: 8, cuota: 5, premio: { tipo: 'dinero', base: 100, texto: '' }, fechas: '' });
  const [error, setError] = useState(null);
  const set = (c) => { setT((x) => ({ ...x, ...c })); setError(null); };
  const crear = (e) => {
    e.preventDefault();
    const torneo = {
      ...t,
      id: 'torneo-' + Date.now().toString(36),
      nombre: t.nombre.trim(),
      equipos: Number(t.equipos),
      cuota: Number(t.cuota),
      premio: { ...t.premio, base: Number(t.premio.base), texto: t.premio.texto.trim() || PREMIO[t.premio.tipo] + ' para el campeón' },
      fechas: t.fechas.trim() || 'Fechas por anunciar',
      estado: 'inscripcion',
      inscritos: [],
      organizador: universidad.organizador,
    };
    const err = hacer({ type: 'crearTorneo', torneo });
    if (err) setError(err); else alCrear(torneo);
  };
  const maxBote = Number(t.premio.base || 0) + Number(t.cuota || 0) * Number(t.equipos);
  return (
    <form className="tarj gc-form-torneo" onSubmit={crear}>
      <h4 style={{ margin: '0 0 8px' }}>Nuevo torneo de la universidad</h4>
      <div className="campo"><label htmlFor="t-nombre">Nombre</label><input id="t-nombre" value={t.nombre} placeholder="Copa de invierno" onChange={(e) => set({ nombre: e.target.value })} /></div>
      <div className="lbl">Deporte</div>
      <Segmentos etiqueta="Deporte" valor={t.deporte} onCambio={(k) => set({ deporte: k })} opciones={universidad.instalaciones.map((i) => ({ k: i.deporte, t: `${DEPORTE[i.deporte].emoji} ${i.nombre}` }))} />
      <div className="lbl">{DEPORTE[t.deporte].unidad.replace(/^./, (x) => x.toUpperCase())}</div>
      <Segmentos etiqueta="Tamaño" valor={Number(t.equipos)} onCambio={(k) => set({ equipos: k })} opciones={TAMANOS.map((n) => ({ k: n, t: String(n), nota: n === 16 ? 'octavos' : n === 8 ? 'cuartos' : 'semis' }))} />
      <div className="gc-campos">
        <div className="campo"><label htmlFor="t-cuota">Inscripción por {DEPORTE[t.deporte].unidad.slice(0, -1)} (€)</label><input id="t-cuota" type="number" min="0" step="1" value={t.cuota} onChange={(e) => set({ cuota: e.target.value })} /></div>
        <div className="campo"><label htmlFor="t-base">Premio que pone la uni (€)</label><input id="t-base" type="number" min="0" step="10" value={t.premio.base} onChange={(e) => set({ premio: { ...t.premio, base: e.target.value } })} /></div>
      </div>
      <div className="lbl">Tipo de premio</div>
      <Segmentos etiqueta="Premio" valor={t.premio.tipo} onCambio={(k) => set({ premio: { ...t.premio, tipo: k } })} opciones={Object.entries(PREMIO).map(([k, v]) => ({ k, t: v }))} />
      <div className="campo"><label htmlFor="t-premio">Descripción del premio</label><input id="t-premio" value={t.premio.texto} placeholder="Trofeo + dinero para el equipo campeón" onChange={(e) => set({ premio: { ...t.premio, texto: e.target.value } })} /></div>
      <div className="campo"><label htmlFor="t-fechas">Fechas</label><input id="t-fechas" value={t.fechas} placeholder="Del 9 al 18 de diciembre, a las 13:00" onChange={(e) => set({ fechas: e.target.value })} /></div>
      <p className="gc-cuota"><Icon n="trofeo" />Si se llena, el bote llega a <b>{euros(maxBote)}</b></p>
      {error && <p className="error" role="alert">{error}</p>}
      <p style={{ margin: '12px 0 0' }}><button className="btn">Publicar torneo</button></p>
    </form>
  );
}

export function TorneosPage() {
  const { torneos } = useComunidad();
  const navigate = useNavigate();
  const [uni, setUni] = useVistaUniversidad();
  return (
    <>
      <Link className="atras" to="/community">‹ Green Community</Link>
      <div className="row"><h3>Torneos</h3><SelectorVista uni={uni} alCambiar={setUni} /></div>
      <p className="note">Los organiza la universidad. La inscripción de cada equipo va al bote del premio.</p>
      {uni && <FormTorneo alCrear={(t) => navigate(`/community/torneos/${t.id}?vista=universidad`)} />}
      <div className="gc-torneos">{torneos.map((t) => <TarjetaTorneo key={t.id} t={t} />)}</div>
    </>
  );
}

export function TorneoPage() {
  const { id } = useParams();
  const { torneos, hacer } = useComunidad();
  const perfil = usePerfil();
  const { avisar } = useUi();
  const [uni, setUni] = useVistaUniversidad();
  const [equipo, setEquipo] = useState('');
  const [acepta, setAcepta] = useState(false);
  const [error, setError] = useState(null);
  const t = torneos.find((x) => x.id === id);
  if (!t) return <p className="note">Ese torneo no existe. <Link to="/community/torneos">Volver</Link></p>;
  const d = DEPORTE[t.deporte];
  const yaDentro = t.inscritos.some((x) => x.mio);
  const ganador = t.cuadro && campeon(t.cuadro);

  const inscribirme = (e) => {
    e.preventDefault();
    const err = hacer({ type: 'inscribir', id: t.id, equipo: { equipo, capitan: perfil.nombre } });
    if (err) { setError(err); return; }
    avisar(`Inscritos: ${equipo}. El bote sube a ${euros(bote(t) + t.cuota)}`);
    setEquipo('');
    setAcepta(false);
  };
  const sortear = () => { const err = hacer({ type: 'empezar', id: t.id }); avisar(err || 'Inscripción cerrada: cuadro sorteado'); };
  const marcar = (ronda, partido, eq) => { const err = hacer({ type: 'ganador', id: t.id, ronda, partido, equipo: eq }); if (err) avisar(err); };

  return (
    <>
      <Link className="atras" to={`/community/torneos${uni ? '?vista=universidad' : ''}`}>‹ Torneos</Link>
      <div className="row"><h3>{d.emoji} {t.nombre}</h3><SelectorVista uni={uni} alCambiar={setUni} /></div>
      <p className="note">{t.organizador || universidad.organizador} · {d.nombre} · {t.equipos} {d.unidad} · {t.fechas}</p>

      <div className="gc-bote grande">
        <Icon n="trofeo" />
        <div>
          <b>{euros(bote(t))}</b>
          <small>{t.premio.texto}</small>
          <small>{euros(t.premio.base)} de la universidad + {t.inscritos.length} × {euros(t.cuota)} de inscripciones{t.estado === 'inscripcion' && ` · si se llena: ${euros(t.premio.base + t.cuota * t.equipos)}`}</small>
        </div>
      </div>
      {ganador && <p className="gc-campeon grande">🏆 Campeón: {ganador}</p>}

      {t.estado === 'inscripcion' && (
        <>
          <h3 className="sub">Inscripción · quedan {plazasTorneo(t)}</h3>
          {yaDentro ? <p className="hecho"><Icon n="check" /><span>Tu {d.unidad.slice(0, -1)} ya está inscrito.</span></p> : (
            <form className="tarj" onSubmit={inscribirme}>
              <div className="campo"><label htmlFor="t-equipo">Nombre {t.deporte === 'padel' ? 'de la pareja' : 'del equipo'}</label>
                <input id="t-equipo" value={equipo} placeholder={t.deporte === 'padel' ? 'Martínez / Villegas' : 'Los de MAIS'} onChange={(e) => { setEquipo(e.target.value); setError(null); }} />
              </div>
              <p className="note">Capitán: {perfil.nombre}. {t.cuota ? `Inscripción: ${euros(t.cuota)} por ${d.unidad.slice(0, -1)}, que va íntegra al bote.` : 'Inscripción gratis.'} Se juega a eliminatoria directa: si perdéis, fuera.</p>
              <label className="gc-acepto"><input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />Acepto las normas del torneo{t.cuota ? ` y pagar ${euros(t.cuota)}` : ''}</label>
              {error && <p className="error" role="alert">{error}</p>}
              <p style={{ margin: '12px 0 0' }}><button className="btn" disabled={!acepta || !equipo.trim() || plazasTorneo(t) === 0}>Inscribirnos</button> <DemoFlag>en la demo no se cobra</DemoFlag></p>
            </form>
          )}
          {uni && <p style={{ margin: '12px 0 0' }}><button className="btn dark" onClick={sortear}>Cerrar inscripción y sortear el cuadro</button></p>}
        </>
      )}

      {t.cuadro && (
        <>
          <div className="row gc-seccion"><h3 className="sub">Cuadro</h3>{uni && <span className="note">Toca el equipo que gana cada partido</span>}</div>
          <Cuadro cuadro={t.cuadro} alMarcar={uni ? marcar : null} />
        </>
      )}

      <h3 className="sub">Inscritos ({t.inscritos.length}/{t.equipos})</h3>
      <div className="gc-inscritos">
        {t.inscritos.map((x) => <span key={x.equipo} className={x.mio ? 'mio' : ''}>{x.equipo}<small>{x.capitan}</small></span>)}
        {Array.from({ length: plazasTorneo(t) }, (_, i) => <span key={'v' + i} className="vacio">Libre</span>)}
      </div>
    </>
  );
}

/**
 * Panel de Vida universitaria: solo llega lo dudoso (lo que el filtro manda a revisión y lo denunciado).
 * Lo evidente ya lo bloqueó el filtro y lo normal se publicó solo.
 */
export function ModeracionPage() {
  const { todos, moderacion, moderador, dispatch } = useComunidad();
  const { avisar } = useUi();
  const pendientes = todos.filter((a) => a.estado === 'revision');
  const retirados = todos.filter((a) => a.estado === 'retirado');
  const total = moderacion.publicadosSolos + moderacion.bloqueados + pendientes.length + moderacion.revisados;
  return (
    <>
      <Link className="atras" to="/community">‹ Green Community</Link>
      <div className="row"><h3>🏛 Moderación</h3><DemoFlag>vista de Vida universitaria</DemoFlag></div>
      <p className="note">Todo anuncio pasa antes por el moderador automático ({moderador}). Aquí solo llega lo dudoso y lo que denuncian los alumnos.</p>
      <div className="gc-mod-stats">
        <div><b>{moderacion.publicadosSolos}</b><span className="note">publicados solos</span></div>
        <div><b>{moderacion.bloqueados}</b><span className="note">intentos bloqueados al momento</span></div>
        <div><b>{pendientes.length}</b><span className="note">esperando revisión</span></div>
        <div><b>{total ? Math.round(((moderacion.publicadosSolos + moderacion.bloqueados) / total) * 100) : 100} %</b><span className="note">sin intervención humana</span></div>
      </div>
      <h3 className="sub">Pendientes</h3>
      {!pendientes.length && <p className="note gc-vacio">Nada que revisar. 🎉</p>}
      {pendientes.map((a) => (
        <article key={a.id} className="gc-mod-item">
          <h4>{a.titulo}</h4>
          <p className="note" style={{ margin: 0 }}>{a.autor.nombre} · {a.autor.curso}{a.nota && <> · «{a.nota}»</>}</p>
          <p style={{ margin: '6px 0 0' }}>
            {a.denuncias?.length > 0 && <span className="gc-tag aviso">{a.denuncias.length} denuncia{a.denuncias.length > 1 ? 's' : ''}</span>}{' '}
            {a.moderacion?.motivos?.map((x, i) => <span key={i} className="gc-tag">{x.nombre} · {a.moderacion.fuente}</span>)}
          </p>
          <div className="fila-b">
            <button className="btn sm" onClick={() => { dispatch({ type: 'aprobar', id: a.id }); avisar('Aprobado y publicado'); }}>Aprobar</button>
            <button className="btn sm dark" onClick={() => { dispatch({ type: 'retirar', id: a.id }); avisar('Anuncio retirado'); }}>Retirar</button>
          </div>
        </article>
      ))}
      {retirados.length > 0 && (
        <>
          <h3 className="sub">Retirados</h3>
          {retirados.map((a) => <p key={a.id} className="note" style={{ margin: '4px 0' }}>«{a.titulo}» · {a.autor.nombre}</p>)}
        </>
      )}
    </>
  );
}
