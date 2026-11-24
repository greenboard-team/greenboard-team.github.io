import { fmt, fmtDia, diaDe } from '../../domain/fechas.js';

/** Frase de un cambio de WebUntis («Proyectos III cambia del 003 al 112 el mar 3 dic a las 11:00»). */
export function CambioFrase({ c, cuando }) {
  const a = <b>{c.asig}</b>;
  if (c.tipo === 'aula') return <>{a} cambia {c.antes ? `del ${c.antes} ` : ''}al <b>{c.ahora || 'aula por confirmar'}</b> el {cuando}</>;
  if (c.tipo === 'hora') return <>{a} pasa de {c.antes} a <b>{c.ahora}</b> el {fmtDia.format(diaDe(c.d))}</>;
  if (c.tipo === 'cancelada') return <>{a} del {cuando} está <b>cancelada</b></>;
  if (c.tipo === 'adicional') return <>Clase de recuperación de {a}: {cuando} ({c.ahora})</>;
  return <>Clase nueva de {a}: {cuando} ({c.ahora})</>;
}

export function ListaCambios({ cambios }) {
  if (!cambios.length) return null;
  return (
    <>
      <div className="lbl" style={{ marginTop: 10 }}>Cambios en tus clases</div>
      {cambios.slice(0, 6).map((c, i) => (
        <div key={i} className="fila cambio">
          <time>{fmt.format(diaDe(c.d))}<br /><span className="note">{c.h}</span></time>
          <div><small><CambioFrase c={c} cuando={`${fmtDia.format(diaDe(c.d))} a las ${c.h}`} /></small></div>
          <span />
        </div>
      ))}
    </>
  );
}
