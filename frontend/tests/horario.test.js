import { describe, expect, it } from 'vitest';
import { huecosDelDia, solapan, tengoClase, franjasDelDia } from '../src/domain/horario.js';

const lunes = [
  { h: '09:00', f: '10:30', s: 'aiii' },
  { h: '11:00', f: '12:30', s: 'opti' },
  { h: '15:00', f: '16:30', s: 'psdi' },
];

describe('horario', () => {
  it('detecta solapes y deja tocar bordes', () => {
    expect(solapan('09:00', '10:30', '10:00', '11:00')).toBe(true);
    expect(solapan('09:00', '10:30', '10:30', '11:00')).toBe(false);
  });
  it('calcula los huecos libres de al menos una hora', () => {
    expect(huecosDelDia(lunes, { desde: '08:00', hasta: '20:00' })).toEqual([
      { desde: '08:00', hasta: '09:00', minutos: 60 },
      { desde: '12:30', hasta: '15:00', minutos: 150 },
      { desde: '16:30', hasta: '20:00', minutos: 210 },
    ]);
  });
  it('ignora clases canceladas', () => {
    expect(tengoClase({ 1: [{ h: '13:00', f: '14:00', cancelada: true }] }, { dia: 1, desde: '13:00', hasta: '14:00' })).toBe(false);
  });
  it('marca las franjas que chocan con clase', () => {
    const f = franjasDelDia(lunes, { desde: '10:00', hasta: '12:00', duracion: 60, paso: 60 });
    expect(f.map((x) => x.conClase.map((c) => c.s))).toEqual([['aiii'], ['opti']]);
  });
});
