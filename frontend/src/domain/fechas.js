/** Fechas y horas. Todo en hora local del navegador, como el resto de la app. */

export const fmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });
export const fmtH = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' });
export const fmtDia = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
export const fmtLargo = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

export const capitalizar = (s) => s.replace(/^./, (c) => c.toUpperCase());

/** «09:30» → 570 */
export const aMin = (h) => {
  const [a, b] = String(h).split(':').map(Number);
  return a * 60 + (b || 0);
};
/** 570 → «09:30» */
export const deMin = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export const isoDia = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const diaDe = (iso) => new Date(iso + 'T12:00');
export const esHoy = (d) => d.toDateString() === new Date().toDateString();
export const haceDias = (n, desde = new Date()) => {
  const d = new Date(desde);
  d.setDate(d.getDate() - n);
  return d;
};

/** Día de la semana con lunes = 1 … domingo = 7. */
export const diaSemana = (d = new Date()) => ((d.getDay() + 6) % 7) + 1;
export const DIAS_SEMANA = [
  { n: 1, corto: 'Lun', largo: 'lunes' },
  { n: 2, corto: 'Mar', largo: 'martes' },
  { n: 3, corto: 'Mié', largo: 'miércoles' },
  { n: 4, corto: 'Jue', largo: 'jueves' },
  { n: 5, corto: 'Vie', largo: 'viernes' },
  { n: 6, corto: 'Sáb', largo: 'sábado' },
  { n: 7, corto: 'Dom', largo: 'domingo' },
];
export const nombreDia = (n) => DIAS_SEMANA.find((d) => d.n === n)?.largo ?? '';

/** Fecha concreta del día `n` (1–7) de la semana que contiene `ref`. */
export function fechaDeLaSemana(n, ref = new Date()) {
  const d = new Date(ref);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + (n - diaSemana(d)));
  return d;
}

/** Días para reservar: hoy, mañana y el próximo viernes (si no es hoy ni mañana). */
export function diasReserva(hoy = new Date()) {
  const out = [{ k: 'hoy', t: 'Hoy', d: new Date(hoy) }];
  const m = new Date(hoy);
  m.setDate(m.getDate() + 1);
  out.push({ k: 'manana', t: 'Mañana', d: m });
  const v = new Date(hoy);
  v.setDate(v.getDate() + (((5 - v.getDay() + 7) % 7) || 7));
  const base = new Date(hoy);
  base.setHours(0, 0, 0, 0);
  if (![0, 1].includes(Math.round((v - base) / 864e5))) out.push({ k: 'viernes', t: 'Viernes', d: v });
  return out;
}
export const diaTxt = (k) => {
  const ds = diasReserva();
  const d = ds.find((x) => x.k === k) || ds[0];
  return d.t + ', ' + fmt.format(d.d);
};

/** Estado de una fecha de entrega: vencida, pronto (≤ 2 días) u ok. */
export function estadoEntrega(iso, ahora = new Date()) {
  const fecha = new Date(iso);
  if (fecha < ahora) return { tipo: 'late', texto: 'vencida' };
  const d = Math.ceil((fecha - ahora) / 864e5);
  if (d <= 2) return { tipo: 'soon', texto: d <= 1 ? 'mañana' : `en ${d} días` };
  return { tipo: 'ok', texto: fmt.format(fecha) };
}

export function saludo(h = new Date().getHours()) {
  return h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
}
