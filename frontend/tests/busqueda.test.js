import { describe, expect, it } from 'vitest';
import { buscar, parametros } from '../src/domain/busqueda.js';
import { media } from '../src/domain/notas.js';

const acciones = [
  { id: 'padel', tipo: 'Reserva', t: 'Reservar pista de pádel', k: 'padel pista' },
  { id: 'gc-futbol', tipo: 'Community', t: 'Buscar pachanga de fútbol sala', k: 'futbol pachanga cancha' },
];

describe('barra de Inicio', () => {
  it('entiende frases con día y hora', () => {
    expect(parametros('reservar pádel viernes a las 19')).toEqual({ dia: 'viernes', hora: '19:00' });
    expect(buscar(acciones, 'pachanga')[0].id).toBe('gc-futbol');
    expect(buscar(acciones, 'pa')[0].id).toBe('padel');
  });
  it('calcula la media ponderada de lo publicado', () => {
    const r = media([{ p: 20, n: 8 }, { p: 30, n: 6 }, { p: 50, n: null }]);
    expect(r.media).toBeCloseTo(6.8);
    expect(r.evaluado).toBe(50);
  });
});
