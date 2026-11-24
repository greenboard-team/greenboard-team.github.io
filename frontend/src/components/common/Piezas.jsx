import Icon from './Icon.jsx';
import { estadoEntrega } from '../../domain/fechas.js';
import { useUi } from '../../store/UiContext.jsx';

/** Etiqueta de fecha de una entrega: vencida, pronto u ok. */
export function PillEntrega({ iso }) {
  const e = estadoEntrega(iso);
  return (
    <span className={`pill ${e.tipo}`}>
      {e.tipo !== 'late' && <Icon n="cal" />}
      {e.texto}
    </span>
  );
}

export function DemoFlag({ children }) {
  return <span className="demo-flag">{children}</span>;
}

/** Cabecera de las tarjetas que se abren en Inicio (con botón de cerrar). */
export function CabeceraTarjeta({ id, icono, titulo, sub, cerrable = true }) {
  const { dispatch } = useUi();
  return (
    <div className="tarj-h">
      <span className="ic"><Icon n={icono} /></span>
      <h4>
        {titulo}
        {sub && <small>{sub}</small>}
      </h4>
      {cerrable && (
        <button className="cerrar" aria-label="Cerrar" onClick={() => dispatch({ type: 'cerrar', id })}>
          <Icon n="cerrar" />
        </button>
      )}
    </div>
  );
}

export function Hecho({ children }) {
  return (
    <div className="hecho">
      <Icon n="check" />
      <span>{children}</span>
    </div>
  );
}

/** Botones segmentados (días, horas…). */
export function Segmentos({ opciones, valor, onCambio, etiqueta }) {
  return (
    <div className="seg" role="group" aria-label={etiqueta}>
      {opciones.map((o) => (
        <button key={o.k} type="button" aria-pressed={valor === o.k} onClick={() => onCambio(o.k)} disabled={o.disabled}>
          {o.t} {o.nota && <span className="note">{o.nota}</span>}
        </button>
      ))}
    </div>
  );
}
