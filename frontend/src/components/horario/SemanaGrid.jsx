import { aMin, DIAS_SEMANA, fechaDeLaSemana, diaSemana, fmt } from '../../domain/fechas.js';
import { corto } from '../../domain/texto.js';
import { solapan } from '../../domain/horario.js';

const PX_MIN = 0.75; // altura de un minuto

/** Reparte bloques que se pisan en carriles para que no se tapen (algoritmo voraz por hora de inicio). */
export function carriles(bloques) {
  const orden = [...bloques].sort((a, b) => aMin(a.desde) - aMin(b.desde));
  const finCarril = [];
  const out = orden.map((b) => {
    let c = finCarril.findIndex((fin) => fin <= aMin(b.desde));
    if (c === -1) { c = finCarril.length; finCarril.push(0); }
    finCarril[c] = aMin(b.hasta);
    return { ...b, carril: c };
  });
  // Cada grupo de bloques que se solapan comparte el número de carriles del grupo
  return out.map((b) => ({ ...b, carriles: Math.max(1, ...out.filter((x) => solapan(x.desde, x.hasta, b.desde, b.hasta)).map((x) => x.carril + 1)) }));
}

/**
 * Semana de lunes a domingo con tus clases. Encima se pintan bloques (planes, tu selección…).
 * @param {object} props
 * @param {object} props.semana  {1:[{h,f,s,a}], …}
 * @param {{dia,desde,hasta,tipo,titulo,sub,onClick?}[]} props.bloques
 * @param {(dia:number, minuto:number) => void} [props.alPulsar] para elegir franja
 * @param {Date} [props.ref] fecha de referencia de la semana
 */
export function SemanaGrid({ semana, subjects, bloques = [], alPulsar, desde = '08:00', hasta = '23:30', referencia = new Date(), etiqueta = 'Horario de la semana' }) {
  const ini = aMin(desde);
  const fin = aMin(hasta);
  const alto = (fin - ini) * PX_MIN;
  const horas = [];
  for (let m = Math.ceil(ini / 60) * 60; m < fin; m += 60) horas.push(m);
  const hoy = diaSemana(new Date());
  const nombre = (id) => corto(subjects.find((s) => s.id === id) || { n: id });
  const pos = (d, h) => ({ top: (aMin(d) - ini) * PX_MIN, height: Math.max(18, (aMin(h) - aMin(d)) * PX_MIN) });

  const pulsar = (dia) => (e) => {
    if (!alPulsar) return;
    const r = e.currentTarget.getBoundingClientRect();
    const min = ini + Math.floor((e.clientY - r.top) / PX_MIN / 30) * 30;
    alPulsar(dia, Math.min(Math.max(min, ini), fin - 30));
  };

  return (
    <div className={`semana ${alPulsar ? 'elegible' : ''}`} role="group" aria-label={etiqueta}>
      <div className="semana-cab">
        <span />
        {DIAS_SEMANA.map((d) => (
          <span key={d.n} className={d.n === hoy ? 'hoy' : ''}>{d.corto} <small>{fmt.format(fechaDeLaSemana(d.n, referencia))}</small></span>
        ))}
      </div>
      <div className="semana-cuerpo" style={{ height: alto }}>
        <div className="semana-horas">
          {horas.map((m) => <span key={m} style={{ top: (m - ini) * PX_MIN }}>{String(m / 60).padStart(2, '0')}:00</span>)}
        </div>
        {DIAS_SEMANA.map((d) => {
          const propios = carriles(bloques.filter((b) => b.dia === d.n));
          return (
            <div key={d.n} className={`semana-dia ${d.n === hoy ? 'hoy' : ''}`} onClick={pulsar(d.n)}>
              {horas.map((m) => <i key={m} className="linea" style={{ top: (m - ini) * PX_MIN }} />)}
              {(semana[d.n] || []).map((c, i) => (
                <div key={'c' + i} className={`bloque clase ${c.cancelada ? 'cancelada' : ''}`} style={pos(c.h, c.f)} title={`${nombre(c.s)} · ${c.h}–${c.f} · ${c.a}`}>
                  <b>{nombre(c.s)}</b><small>{c.h}–{c.f}{c.a ? ' · ' + c.a : ''}</small>
                </div>
              ))}
              {propios.map((b, i) => {
                const ancho = 100 / b.carriles;
                const Tag = b.onClick ? 'button' : 'div';
                return (
                  <Tag key={'b' + i} type={b.onClick ? 'button' : undefined}
                    className={`bloque ${b.tipo}`} title={`${b.titulo} · ${b.desde}–${b.hasta}`}
                    style={{ ...pos(b.desde, b.hasta), left: `calc(${b.carril * ancho}% + 2px)`, width: `calc(${ancho}% - 4px)` }}
                    onClick={b.onClick ? (e) => { e.stopPropagation(); b.onClick(); } : undefined}>
                    <b>{b.titulo}</b>{b.sub && <small>{b.sub}</small>}
                  </Tag>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
