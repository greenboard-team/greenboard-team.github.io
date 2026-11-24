import Icon from '../common/Icon.jsx';
import { useEstadoIA } from '../../hooks/useEstadoIA.js';
import { activarIA, configModeracion, desactivarIA } from '../../services/moderacion/moderadores.js';

const NAV = configModeracion.navegador;

/** Estado del moderador con IA (Qwen en el navegador) y botón para activarlo. */
export default function EstadoIA({ compacto = false }) {
  const e = useEstadoIA();
  const pct = Math.round((e.progreso || 0) * 100);
  if (compacto) {
    if (e.fase === 'listo') return <span className="gc-ia ok"><Icon n="check" />Revisado también por {NAV.nombre} en tu navegador</span>;
    if (e.fase === 'cargando') return <span className="gc-ia">Cargando {NAV.nombre}… {pct} %</span>;
    return null;
  }
  return (
    <div className={`gc-ia-panel fase-${e.fase}`}>
      <div className="gc-ia-cab">
        <span className="ic">🤖</span>
        <div>
          <b>Moderador con IA · {NAV.nombre}</b>
          <small>Se descarga una vez ({NAV.tamano}) a este navegador y modera sin servidor, aunque no haya conexión. Necesita WebGPU (Chrome o Edge).</small>
        </div>
      </div>
      {e.fase === 'apagado' && <button className="btn sm" onClick={activarIA}>Descargar y activar</button>}
      {e.fase === 'cargando' && (
        <>
          <div className="gc-barra"><span style={{ width: `${pct}%` }} /></div>
          <p className="note" style={{ margin: '6px 0 0' }}>{pct} % · {e.texto}</p>
        </>
      )}
      {e.fase === 'listo' && <p className="gc-ok-clase" style={{ margin: 0 }}><Icon n="check" />Activo: cada anuncio pasa por las reglas y después por {NAV.nombre}. <button className="linkbtn" onClick={desactivarIA}>Desactivar</button></p>}
      {e.fase === 'error' && <p className="error" style={{ margin: 0 }}>No se ha podido cargar el modelo ({e.texto}). Siguen activas las reglas. <button className="linkbtn" onClick={activarIA}>Reintentar</button></p>}
      {e.fase === 'sin-webgpu' && <p className="note" style={{ margin: 0 }}>Este navegador no tiene WebGPU: se modera solo con las reglas. Prueba con Chrome o Edge actualizados.</p>}
    </div>
  );
}
