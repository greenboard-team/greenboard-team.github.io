/** Utilidades de texto sin dependencias del navegador. */

/** Minúsculas y sin tildes, para buscar y comparar. */
export const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Identificador estable a partir de un nombre («Análisis III» → «analisis-iii»). */
export const slug = (t) => norm(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'x';

/** Nombre corto de una asignatura («Proyectos III: Desarrollo…» → «Proyectos III»). */
export const corto = (s) => String(s?.n ?? s ?? '').split(':')[0];

/** Iniciales para el avatar. */
export const iniciales = (nombre) => String(nombre || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

/** Número con una decimal a la española, o «–». */
export const num = (n) => (n == null ? '–' : n.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));

/** Importe en euros («5 €», «2,50 €»). */
export const euros = (n) => `${Number(n).toLocaleString('es-ES', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })} €`;

/** Plural sencillo: plural(3, 'plaza') → «3 plazas». */
export const plural = (n, una, varias = una + 's') => `${n} ${n === 1 ? una : varias}`;
