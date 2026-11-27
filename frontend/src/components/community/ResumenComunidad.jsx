import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import { BotonApunte } from '../inicio/Tarjetas.jsx';
import { DialogoUnirse } from './Anuncios.jsx';
import { emojiDe, estaCompleto, estoyApuntado, plazasLibres } from '../../domain/comunidad/anuncios.js';
import { tengoClase } from '../../domain/horario.js';
import { diaSemana, nombreDia, aMin } from '../../domain/fechas.js';
import { plural } from '../../domain/texto.js';
import { useComunidad } from '../../store/ComunidadContext.jsx';
import { useAcademico } from '../../store/SesionContext.jsx';
import { useUi } from '../../store/UiContext.jsx';
import { usePerfil } from '../../hooks/usePerfil.js';
import { useAbrir } from '../../hooks/useAbrir.js';

/** Planes de la semana que caben en tus huecos, empezando por los más cercanos a hoy. */
export function planesEnMisHuecos(anuncios, semana, perfil, hoy = diaSemana()) {
  const distancia = (d) => (d - hoy + 7) % 7;
  return anuncios
    .filter((a) => !a.mio && !estaCompleto(a) && !estoyApuntado(a, perfil.nombre) && !tengoClase(semana, a))
    .sort((x, y) => distancia(x.dia) - distancia(y.dia) || aMin(x.desde) - aMin(y.desde));
}

/** Tarjeta de Green Community en Inicio. */
export function ResumenComunidad() {
  const m = useAcademico();
  const { anuncios, comunidades } = useComunidad();
  const perfil = usePerfil();
  const { ui, dispatch, avisar } = useUi();
  const [abierto, setAbierto] = useState(null);
  const abrir = useAbrir();
  const planes = planesEnMisHuecos(anuncios, m.semana, perfil);
  return (
    <section className="tarj" id="t-com">
      <div className="tarj-h">
        <span className="ic"><Icon n="uni" /></span>
        <h4>Green Community<small>{plural(planes.length, 'plan', 'planes')} {planes.length === 1 ? 'cabe' : 'caben'} en tus huecos esta semana</small></h4>
        <Link className="vermas" to="/community">Ver más →</Link>
      </div>
      {planes.slice(0, 3).map((a) => (
        <div key={a.id} className="fila fila-e gc-hueco">
          <span className="ic" aria-hidden="true">{emojiDe(a, comunidades)}</span>
          <div><b>{a.titulo}</b><small>{nombreDia(a.dia)} {a.desde}–{a.hasta} · faltan {plazasLibres(a)}</small></div>
          <button className="btn sm" onClick={() => setAbierto(a)}>Unirme</button>
        </div>
      ))}
      {m.apuntes.map((c) => (
        <div key={c.id} className="fila fila-e">
          <span className="ic"><Icon n="libro" /></span>
          <div><b>{c.t}</b><small>{c.s}</small></div>
          {c.tipo === 'apuntes'
            ? <button className="btn sm" id={`btn-${c.id}`} onClick={() => abrir('com-' + c.id)}>{c.accion}</button>
            : <BotonApunte sm c={c} hecho={ui.com[c.id]} onClick={() => { dispatch({ type: 'apuntarCom', id: c.id }); avisar('Apuntado (demo)'); }} />}
        </div>
      ))}
      <DialogoUnirse a={abierto} alCerrar={() => setAbierto(null)} />
    </section>
  );
}
