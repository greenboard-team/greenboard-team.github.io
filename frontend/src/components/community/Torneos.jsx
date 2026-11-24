import { Link } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import { bote, campeon, plazasTorneo } from '../../domain/comunidad/torneos.js';
import { euros } from '../../domain/texto.js';

const ESTADO = { inscripcion: ['ok', 'Inscripción abierta'], 'en-juego': ['soon', 'En juego'], terminado: ['late', 'Terminado'] };
export const DEPORTE = { futbol: { emoji: '⚽', nombre: 'Fútbol sala', unidad: 'equipos' }, padel: { emoji: '🎾', nombre: 'Pádel', unidad: 'parejas' } };
export const PREMIO = { dinero: 'Dinero', tarjeta: 'Tarjeta regalo', material: 'Material' };

export function TarjetaTorneo({ t }) {
  const [clase, texto] = ESTADO[t.estado] || ESTADO.inscripcion;
  const d = DEPORTE[t.deporte];
  const lleno = t.inscritos.length / t.equipos;
  const ganador = t.cuadro && campeon(t.cuadro);
  return (
    <Link className="gc-torneo" to={`/community/torneos/${t.id}`}>
      <div className="gc-torneo-h">
        <span className="gc-emoji" aria-hidden="true">{d.emoji}</span>
        <div><span className="gc-tipo">{t.organizador || 'U-tad'} · {d.nombre}</span><h4>{t.nombre}</h4></div>
        <span className={`pill ${clase}`}>{ganador ? 'Terminado' : texto}</span>
      </div>
      <div className="gc-bote">
        <Icon n="trofeo" />
        <div><b>{euros(bote(t))}</b><small>{PREMIO[t.premio.tipo]} · {t.premio.texto}</small></div>
      </div>
      <div className="gc-barra"><span style={{ width: `${lleno * 100}%` }} /></div>
      <p className="note" style={{ margin: '6px 0 0' }}>
        {t.inscritos.length}/{t.equipos} {d.unidad} · {t.cuota ? `inscripción ${euros(t.cuota)} (va al bote)` : 'inscripción gratis'}
        {t.estado === 'inscripcion' && plazasTorneo(t) > 0 && ` · quedan ${plazasTorneo(t)}`}
      </p>
      <p className="note" style={{ margin: '2px 0 0' }}>{t.fechas}</p>
      {ganador && <p className="gc-campeon">🏆 {ganador}</p>}
    </Link>
  );
}

/**
 * Cuadro de eliminatoria. Con `alMarcar`, la universidad pulsa el equipo que gana cada partido.
 */
export function Cuadro({ cuadro, alMarcar }) {
  return (
    <div className="gc-cuadro" role="group" aria-label="Cuadro del torneo">
      {cuadro.map((r, ri) => (
        <div key={ri} className="gc-ronda">
          <h5>{r.nombre}</h5>
          <div className="gc-partidos">
            {r.partidos.map((p, pi) => (
              <div key={pi} className="gc-partido">
                {['a', 'b'].map((lado) => {
                  const eq = p[lado];
                  const gano = p.ganador && p.ganador === eq;
                  const perdio = p.ganador && eq && p.ganador !== eq;
                  const puede = alMarcar && eq && p.a && p.b;
                  return (
                    <button key={lado} type="button" disabled={!puede} className={`gc-equipo ${gano ? 'gana' : ''} ${perdio ? 'pierde' : ''}`}
                      onClick={() => puede && alMarcar(ri, pi, eq)} title={puede ? `Marcar a ${eq} como ganador` : undefined}>
                      {eq || (ri === 0 ? 'Exento' : 'Por decidir')}
                      {gano && <Icon n="check" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="gc-ronda campeon">
        <h5>Campeón</h5>
        <div className="gc-partidos"><div className="gc-partido"><span className="gc-equipo gana">{campeon(cuadro) ? '🏆 ' + campeon(cuadro) : '¿Quién será?'}</span></div></div>
      </div>
    </div>
  );
}
