import { euros } from '../texto.js';

/**
 * Patrón Strategy: cada forma de pagar una pista sabe calcular cuánto paga cada uno
 * y cómo explicarlo en las condiciones que el resto acepta antes de unirse.
 * Añadir una modalidad nueva = añadir una entrada aquí, sin tocar las pantallas.
 */
export const MODOS_PAGO = {
  partes: {
    id: 'partes',
    etiqueta: 'A partes iguales',
    resumen: 'Se divide entre todos',
    cuota: (precio, jugadores) => precio / jugadores,
    condicion: (precio, jugadores) => `La pista (${euros(precio)}) se paga entre los ${jugadores}: ${euros(precio / jugadores)} cada uno.`,
  },
  anunciante: {
    id: 'anunciante',
    etiqueta: 'La pago yo',
    resumen: 'Invita quien publica',
    cuota: () => 0,
    condicion: (precio) => `La pista (${euros(precio)}) la paga quien publica. Tú no pagas nada.`,
  },
  perdedor: {
    id: 'perdedor',
    etiqueta: 'Paga quien pierda',
    resumen: 'La pareja que pierda paga la pista',
    cuota: (precio, jugadores) => precio / (jugadores / 2),
    condicion: (precio, jugadores) => `Paga la pareja que pierda: ${euros(precio)} entre los ${jugadores / 2} (${euros(precio / (jugadores / 2))} cada uno). Si ganáis, gratis.`,
  },
};

export const modoPago = (id) => MODOS_PAGO[id] ?? MODOS_PAGO.partes;

/** Modalidades que tienen sentido según cuántos buscas. «Paga quien pierda» solo si hay partido (2 contra 2). */
export function modosDisponibles({ formato }) {
  return formato === 'rivales' ? Object.values(MODOS_PAGO) : [MODOS_PAGO.partes, MODOS_PAGO.anunciante];
}
