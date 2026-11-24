import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { iniciales } from '../../domain/texto.js';
import { sinLeer } from '../../repositories/academicoRepository.js';
import { estoyApuntado } from '../../domain/comunidad/anuncios.js';
import { useAcademico, useSesion } from '../../store/SesionContext.jsx';
import { useComunidad } from '../../store/ComunidadContext.jsx';
import { useUi } from '../../store/UiContext.jsx';
import { usePerfil } from '../../hooks/usePerfil.js';

function Pestanas() {
  const m = useAcademico();
  const { ui } = useUi();
  const vivas = m.due.filter((x) => new Date(x.d) > new Date()).length;
  const nl = sinLeer(m, ui.leidos);
  const items = [
    ['/inicio', 'Inicio', null],
    ['/horario', 'Horario', null],
    ['/asig', 'Asignaturas', ui.justificado ? <span className="count">{m.subjects.length}</span> : <span className="count rojo" title="Faltas sin justificar">1</span>],
    ['/notas', 'Calificaciones', null],
    ['/ent', 'Entregas', <span key="c" className="count">{vivas}</span>],
    ['/msg', 'Mensajes', nl ? <span className="count rojo" title="Sin leer">{nl}</span> : null],
    ['/tram', 'Trámites', null],
    ['/community', 'Green Community', <span key="n" className="count nuevo">nuevo</span>],
    ...(m.real ? [['/ajustes', 'Ajustes', null]] : []),
  ];
  return (
    <nav className="tabs" aria-label="Secciones">
      {items.map(([to, t, c]) => (
        <NavLink key={to} className="tab" to={to}>{t} {c}</NavLink>
      ))}
    </nav>
  );
}

function Pie() {
  const m = useAcademico();
  const { salir, dejarDemo } = useSesion();
  const { dispatch } = useUi();
  const comunidad = useComunidad();
  if (m.real) {
    return (
      <p className="note pie">
        Prototipo del MVP con tus datos: horario y cambios de WebUntis ({m.real.generado}), aulas libres según ese horario{m.real.bb ? ', entregas de tu Blackboard' : ''} · asistencia,
        contenido, notas, chats, Green Community, pádel y matrícula de ejemplo · <NavLink to="/ajustes">Ajustes</NavLink> · <button className="linkbtn" onClick={salir}>Cerrar sesión</button>
      </p>
    );
  }
  return (
    <p className="note pie">
      Demo del MVP · asignaturas y entregas reales de Blackboard (26/10/2026); horario, aulas, asistencia, contenido, notas, chats, compañeros, Green Community y reservas de ejemplo ·
      no se conecta a ningún portal · <button className="linkbtn" onClick={() => { dispatch({ type: 'reiniciar' }); comunidad.dispatch({ type: 'reiniciar' }); }}>Reiniciar demo</button> ·{' '}
      <button className="linkbtn" onClick={dejarDemo}>Entrar con mi correo de U-tad</button>
    </p>
  );
}

/** Recorrido guiado de la demo (Happy Path). Resalta el elemento del paso actual. */
function pasoActual(ui, ruta, asisId, apuntadoAlgo) {
  if (!ui.justificado) {
    if (ruta !== '/inicio' && !ruta.startsWith('/asig/' + asisId)) return { n: 1, ir: '/inicio' };
    if (!ui.archivo) return { n: 1, t: 'Inicio: el aula nueva ya está en el horario. Y un 0 en rojo: sube el justificante ahí mismo.', obj: '.fila-falta' };
    return { n: 1, t: 'Justificante listo. Envíalo.', obj: '.enviar' };
  }
  if (!ui.padel.hecho) {
    if (ruta !== '/inicio') return { n: 2, ir: '/inicio' };
    if (!ui.abiertas.includes('padel')) return { n: 2, t: 'Escribe «pa» en la barra (o toca el chip) y elige Reservar pista de pádel.', obj: '.cmd-box' };
    return { n: 2, t: ui.padel.hora ? 'Reserva la pista.' : 'La tarjeta sale en el mismo Inicio. Elige una hora.', obj: ui.padel.hora ? '#reservar-padel' : '#a-padel .slots' };
  }
  if (!apuntadoAlgo) {
    if (ruta !== '/horario') return { n: 3, t: 'Green Community: abre tu Horario y mira qué planes caben en tus huecos.', obj: 'a.tab[href="#/horario"]' };
    return { n: 3, t: 'En tu hueco del miércoles hay una pachanga: únete desde aquí.', obj: '.gc-hueco .btn' };
  }
  return { n: 4, t: 'Fin: horario con cambios, justificante, una reserva y una pachanga en tu hueco, todo sin salir de Greenboard.' };
}

function Guia() {
  const m = useAcademico();
  const { ui, dispatch } = useUi();
  const { anuncios } = useComunidad();
  const perfil = usePerfil();
  const { pathname } = useLocation();
  const apuntadoAlgo = anuncios.some((a) => estoyApuntado(a, perfil.nombre));
  const p = pasoActual(ui, pathname, m.asisId, apuntadoAlgo);

  useEffect(() => {
    if (!ui.guia || !p.obj) return undefined;
    const t = setTimeout(() => document.querySelector(p.obj)?.classList.add('spot'), 50);
    return () => { clearTimeout(t); document.querySelectorAll('.spot').forEach((e) => e.classList.remove('spot')); };
  });

  if (m.real) return null;
  if (!ui.guia) return <button className="btn guide-on" onClick={() => dispatch({ type: 'cambiar', cambios: { guia: true } })}>Guía de la demo</button>;
  return (
    <div className="guide" role="status">
      <b>{p.n === 4 ? 'Demo ✓' : `Paso ${p.n}/3`}</b>
      <p>{p.t || <>Fuera del recorrido. <NavLink to={p.ir}>Volver al paso {p.n}</NavLink></>}</p>
      <button onClick={() => dispatch({ type: 'cambiar', cambios: { guia: false } })}>Ocultar</button>
    </div>
  );
}

export function Toast() {
  const { toast } = useUi();
  return <div className="toast" role="status" hidden={!toast}>{toast}</div>;
}

export default function Layout() {
  const m = useAcademico();
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <>
      <div className="app">
        <aside className="side">
          <span className="brand"><i>G</i>Greenboard</span>
          <div className="who">
            <span className="avatar">{iniciales(m.nombreCompleto)}</span>
            <span>{m.nombreCompleto}<small>{m.real ? `${m.real.grupos.join(' + ')} · U-tad` : '4.º MAIS · U-tad'}</small></span>
          </div>
          <Pestanas />
        </aside>
        <main className="main" id="view">
          <Outlet />
          <Pie />
        </main>
      </div>
      <Guia />
      <Toast />
    </>
  );
}
