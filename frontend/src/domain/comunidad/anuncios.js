import { aMin, nombreDia } from '../fechas.js';
import { clasesQueSolapan } from '../horario.js';
import { euros, plural } from '../texto.js';
import { modoPago } from './pagos.js';

/**
 * Anuncio de Green Community: una pachanga, un partido de pádel o un plan.
 * {
 *   id, tipo:'futbol'|'padel'|'plan', titulo, autor:{nombre,curso},
 *   dia:1–7, desde:'13:00', hasta:'14:30', plazas:number, apuntados:[{nombre,curso}],
 *   lugar:{tipo:'instalacion'|'online'|'uni'|'fuera', texto}, comunidad?:string,
 *   padel?:{formato:'companero'|'rivales'|'partido', pago:'partes'|'anunciante'|'perdedor', precio:number},
 *   plan?:{categoria, juego?, modo?}, nota?:string, enClase?:boolean, creado:ISO
 * }
 */

export const TIPOS = {
  futbol: { id: 'futbol', etiqueta: 'Pachanga de fútbol sala', corto: 'Fútbol sala', emoji: '⚽' },
  padel: { id: 'padel', etiqueta: 'Partido de pádel', corto: 'Pádel', emoji: '🎾' },
  plan: { id: 'plan', etiqueta: 'Plan', corto: 'Plan', emoji: '✨' },
};

export const FORMATOS_PADEL = {
  companero: { id: 'companero', etiqueta: 'Busco compañero', plazas: 1, jugadores: 2, texto: 'Busco pareja para jugar contra otra pareja que ya tengo' },
  rivales: { id: 'rivales', etiqueta: 'Somos 2, buscamos rivales', plazas: 2, jugadores: 4, texto: 'Ya somos pareja: buscamos otra pareja para jugar contra nosotros' },
  partido: { id: 'partido', etiqueta: 'Busco 3 para un partido', plazas: 3, jugadores: 4, texto: 'Estoy solo: buscamos completar un 2 contra 2' },
};

let contador = 0;
const nuevoId = (tipo) => `${tipo}-${Date.now().toString(36)}-${(contador++).toString(36)}`;

/** Errores de un borrador antes de publicarlo (lista vacía = se puede publicar). */
export function validar(b) {
  const e = [];
  if (!TIPOS[b.tipo]) e.push('Elige qué quieres organizar.');
  if (!b.autor?.nombre?.trim()) e.push('Pon tu nombre.');
  if (!b.autor?.curso?.trim()) e.push('Pon tu curso.');
  if (!b.dia || !b.desde || !b.hasta) e.push('Elige una franja.');
  else if (aMin(b.hasta) <= aMin(b.desde)) e.push('La franja tiene que acabar después de empezar.');
  if (b.tipo !== 'padel' && !(b.plazas >= 1)) e.push('Indica cuántas personas buscas.');
  if (b.tipo === 'plan' && !b.titulo?.trim() && !b.plan?.juego) e.push('Ponle un título al plan.');
  if (b.tipo === 'plan' && !b.plan?.categoria) e.push('Elige una categoría.');
  if (b.tipo === 'plan' && b.lugar?.tipo === 'fuera' && !b.lugar.texto?.trim()) e.push('Di dónde es el plan.');
  return e;
}

/**
 * Patrón Factory: a partir del borrador del formulario crea el anuncio completo
 * (título por defecto, plazas del formato de pádel, lugar, aviso si choca con tu clase…).
 * @param {object} borrador
 * @param {object} semana horario del autor, para avisar si lo pone en hora de clase
 */
export function crearAnuncio(borrador, semana = {}, ahora = new Date()) {
  const errores = validar(borrador);
  if (errores.length) throw new Error(errores.join(' '));
  const base = {
    id: nuevoId(borrador.tipo),
    tipo: borrador.tipo,
    autor: { nombre: borrador.autor.nombre.trim(), curso: borrador.autor.curso.trim() },
    dia: borrador.dia,
    desde: borrador.desde,
    hasta: borrador.hasta,
    apuntados: [],
    nota: borrador.nota?.trim() || '',
    comunidad: borrador.comunidad || null,
    creado: ahora.toISOString(),
    mio: true,
  };
  base.enClase = clasesQueSolapan(semana, base).length > 0;

  if (borrador.tipo === 'futbol') {
    return {
      ...base,
      titulo: borrador.titulo?.trim() || 'Pachanga de fútbol sala',
      plazas: Number(borrador.plazas),
      lugar: { tipo: 'instalacion', texto: 'Cancha de fútbol sala · U-tad' },
    };
  }
  if (borrador.tipo === 'padel') {
    const formato = FORMATOS_PADEL[borrador.padel?.formato] || FORMATOS_PADEL.rivales;
    const pago = formato.id === 'rivales' ? borrador.padel?.pago : (borrador.padel?.pago === 'perdedor' ? 'partes' : borrador.padel?.pago);
    return {
      ...base,
      titulo: borrador.titulo?.trim() || `Pádel · ${formato.etiqueta.toLowerCase()}`,
      plazas: formato.plazas,
      lugar: { tipo: 'instalacion', texto: 'Pistas de pádel · U-tad' },
      padel: { formato: formato.id, pago: pago || 'partes', precio: Number(borrador.padel?.precio ?? 5) },
    };
  }
  const { juego, modo } = borrador.plan;
  return {
    ...base,
    titulo: borrador.titulo?.trim() || `${juego}${modo ? ' · ' + modo.toLowerCase() : ''} con gente de la uni`,
    plazas: Number(borrador.plazas),
    lugar: { tipo: borrador.lugar?.tipo || 'online', texto: borrador.lugar?.texto || 'Online' },
    plan: { categoria: borrador.plan.categoria, juego: borrador.plan.juego || '', modo: borrador.plan.modo || '' },
  };
}

/** Emoji del anuncio: el de su comunidad si la tiene (🌴 GTA, ⚔️ LoL…), si no el de su tipo. */
export const emojiDe = (a, comunidades = []) => comunidades.find((c) => c.id === a.comunidad)?.emoji || TIPOS[a.tipo].emoji;

export const plazasLibres = (a) => Math.max(0, a.plazas - a.apuntados.length);
export const estaCompleto = (a) => plazasLibres(a) === 0;
export const estoyApuntado = (a, nombre) => a.apuntados.some((p) => p.nombre === nombre);

/** Personas en total cuando se llena (para dividir el pago). */
export function jugadoresTotales(a) {
  if (a.tipo === 'padel') return FORMATOS_PADEL[a.padel.formato]?.jugadores ?? 4;
  return a.plazas + 1;
}

/** Condiciones que el resto tiene que revisar y aceptar antes de unirse. */
export function condiciones(a) {
  const c = [`${nombreDia(a.dia).replace(/^./, (x) => x.toUpperCase())} de ${a.desde} a ${a.hasta} · ${a.lugar.texto}.`];
  if (a.tipo === 'futbol') {
    c.push('Cancha de U-tad, gratis para alumnos. Trae ropa de deporte; los petos los lleva quien publica.');
    c.push(`Se buscan ${plural(a.plazas, 'jugador', 'jugadores')} más.`);
  }
  if (a.tipo === 'padel') {
    const f = FORMATOS_PADEL[a.padel.formato];
    c.push(f.texto + '.');
    c.push(modoPago(a.padel.pago).condicion(a.padel.precio, f.jugadores));
    c.push(`Pista de U-tad: ${euros(a.padel.precio)} la hora. Se reserva en cuanto se llena el partido.`);
  }
  if (a.tipo === 'plan') {
    if (a.plan.juego) c.push(`Juego: ${a.plan.juego}${a.plan.modo ? ' · ' + a.plan.modo : ''}.`);
    if (a.lugar.tipo === 'fuera') c.push('Es fuera de la universidad: cada uno va por su cuenta.');
  }
  if (a.enClase) c.push('Ojo: quien publica lo ha puesto en una hora en la que tiene clase.');
  if (a.nota) c.push(`Nota de ${a.autor.nombre}: «${a.nota}»`);
  return c;
}

/**
 * Unirse a un anuncio. Devuelve un anuncio nuevo (inmutable) o lanza un error con el motivo.
 * Las condiciones tienen que estar aceptadas.
 */
export function unirse(a, persona, { aceptaCondiciones }) {
  if (!aceptaCondiciones) throw new Error('Tienes que aceptar las condiciones.');
  if (a.mio || a.autor.nombre === persona.nombre) throw new Error('Es tu anuncio.');
  if (estoyApuntado(a, persona.nombre)) throw new Error('Ya estás apuntado.');
  if (estaCompleto(a)) throw new Error('Ya está completo.');
  return { ...a, apuntados: [...a.apuntados, { nombre: persona.nombre, curso: persona.curso }] };
}

export function salirse(a, nombre) {
  return { ...a, apuntados: a.apuntados.filter((p) => p.nombre !== nombre) };
}

/** Lo que pagarías tú si te unes. */
export function miCuota(a) {
  if (a.tipo !== 'padel') return 0;
  return modoPago(a.padel.pago).cuota(a.padel.precio, jugadoresTotales(a));
}

/**
 * Filtro de la lista: por tipo, por categoría de plan, por comunidad, por texto y «solo los que caben en mi horario».
 */
export function filtrar(anuncios, { tipo, categoria, comunidad, texto, enMisHuecos, semana } = {}, norm = (s) => s.toLowerCase()) {
  return anuncios.filter((a) => {
    if (tipo && tipo !== 'todos' && a.tipo !== tipo) return false;
    if (categoria && a.plan?.categoria !== categoria) return false;
    if (comunidad && a.comunidad !== comunidad) return false;
    if (texto && !norm([a.titulo, a.plan?.juego, a.plan?.modo, a.lugar.texto, a.autor.nombre].join(' ')).includes(norm(texto))) return false;
    if (enMisHuecos && semana && clasesQueSolapan(semana, a).length) return false;
    return true;
  });
}

/** Orden: primero los que tienen plazas, luego por día y hora. */
export const ordenar = (anuncios) => [...anuncios].sort((x, y) =>
  (estaCompleto(x) - estaCompleto(y)) || (x.dia - y.dia) || (aMin(x.desde) - aMin(y.desde)));
