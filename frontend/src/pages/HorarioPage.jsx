import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/common/Icon.jsx';
import { DemoFlag } from '../components/common/Piezas.jsx';
import { SemanaGrid } from '../components/horario/SemanaGrid.jsx';
import { DialogoUnirse } from '../components/community/Anuncios.jsx';
import { planesEnMisHuecos } from '../components/community/ResumenComunidad.jsx';
import { emojiDe, estoyApuntado, plazasLibres } from '../domain/comunidad/anuncios.js';
import { DIAS_SEMANA, nombreDia } from '../domain/fechas.js';
import { filtrarSemana, huecosDelDia } from '../domain/horario.js';
import { useAcademico } from '../store/SesionContext.jsx';
import { useComunidad } from '../store/ComunidadContext.jsx';
import { usePerfil } from '../hooks/usePerfil.js';

/**
 * Horario semanal. Encima de tus clases salen los planes de Green Community que caben en tus huecos:
 * te unes desde aquí sin buscarlos.
 */
export default function HorarioPage() {
  const m = useAcademico();
  const { anuncios, comunidades } = useComunidad();
  const perfil = usePerfil();
  const [verPlanes, setVerPlanes] = useState(true);
  const [abierto, setAbierto] = useState(null);
  const [asignaturas, setAsignaturas] = useState([]);

  // El filtro deja solo tus asignaturas: los huecos y planes se calculan también sobre esa semana.
  const semana = filtrarSemana(m.semana, asignaturas);
  const enHueco = planesEnMisHuecos(anuncios, semana, perfil);
  const mios = anuncios.filter((a) => a.mio || estoyApuntado(a, perfil.nombre));
  const bloques = [
    ...mios.map((a) => ({ dia: a.dia, desde: a.desde, hasta: a.hasta, tipo: 'mio', titulo: `${emojiDe(a, comunidades)} ${a.titulo}`, sub: a.mio ? 'Tu anuncio' : 'Te has apuntado' })),
    ...(verPlanes ? enHueco.map((a) => ({ dia: a.dia, desde: a.desde, hasta: a.hasta, tipo: 'plan', titulo: `${emojiDe(a, comunidades)} ${a.titulo}`, sub: `Faltan ${plazasLibres(a)} · únete`, onClick: () => setAbierto(a) })) : []),
  ];

  return (
    <>
      <div className="row">
        <h3>Horario de la semana</h3>
        {m.real ? <span className="note">WebUntis · {m.real.generado}</span> : <DemoFlag>horario de ejemplo</DemoFlag>}
      </div>
      <p className="note">
        Tus clases y, en tus huecos, lo que se organiza en Green Community. Toca un plan para unirte.
        {asignaturas.length > 0 && ` Viendo ${asignaturas.length} de ${m.subjects.length} asignaturas.`}
      </p>
      <div className="gc-toolbar">
        <label className="gc-switch"><input type="checkbox" checked={verPlanes} onChange={(e) => setVerPlanes(e.target.checked)} />Ver planes en mis huecos ({enHueco.length})</label>
        <details className="asig-filtro">
          <summary>Asignaturas: {asignaturas.length ? `${asignaturas.length} seleccionadas` : 'todas'}</summary>
          <div className="asig-filtro-opciones">
            {m.subjects.map((s) => (
              <label key={s.id} className="gc-switch">
                <input
                  type="checkbox"
                  checked={asignaturas.includes(s.id)}
                  onChange={(e) => setAsignaturas((prev) => e.target.checked ? [...prev, s.id] : prev.filter((x) => x !== s.id))}
                />
                {s.n}
              </label>
            ))}
            {asignaturas.length > 0 && (
              <button type="button" className="btn sm" onClick={() => setAsignaturas([])}>Ver todas las asignaturas</button>
            )}
          </div>
        </details>
        <Link className="btn sm" to="/community/nuevo"><Icon n="mas" />Organizar algo en un hueco</Link>
      </div>
      <div className="gc-leyenda"><span className="clase">Clase</span><span className="plan">Plan en tu hueco</span><span className="mio">Lo tuyo</span></div>
      <SemanaGrid semana={semana} subjects={m.subjects} bloques={bloques} referencia={m.diaClase} />

      <h3 className="sub">Planes que caben en tus huecos</h3>
      {!enHueco.length && <p className="note">No hay planes en tus huecos esta semana. <Link to="/community/nuevo">Organiza tú uno</Link>.</p>}
      <div className="tarj">
        {DIAS_SEMANA.map((d) => {
          const planes = enHueco.filter((a) => a.dia === d.n);
          if (!planes.length) return null;
          const huecos = huecosDelDia(semana[d.n] || []).map((h) => `${h.desde}–${h.hasta}`).join(', ');
          return (
            <div key={d.n} className="gc-dia">
              <div className="lbl">{nombreDia(d.n)} <span className="note">· libre {huecos || 'todo el día'}</span></div>
              {planes.map((a) => (
                <div key={a.id} className="fila fila-e gc-hueco">
                  <span className="ic" aria-hidden="true">{emojiDe(a, comunidades)}</span>
                  <div><b>{a.titulo}</b><small>{a.desde}–{a.hasta} · {a.lugar.texto} · faltan {plazasLibres(a)}</small></div>
                  <button className="btn sm" onClick={() => setAbierto(a)}>Unirme</button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <DialogoUnirse a={abierto} alCerrar={() => setAbierto(null)} />
    </>
  );
}
