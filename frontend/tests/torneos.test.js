import { describe, expect, it } from 'vitest';
import { bote, campeon, empezar, generarCuadro, inscribir, marcarGanador, nombreRonda } from '../src/domain/comunidad/torneos.js';

const base = { id: 't', estado: 'inscripcion', equipos: 4, cuota: 10, premio: { base: 100 }, inscritos: [] };

describe('torneos', () => {
  it('el bote crece con cada inscripción', () => {
    let t = inscribir(base, { equipo: 'A', capitan: 'x' });
    t = inscribir(t, { equipo: 'B', capitan: 'y' });
    expect(bote(t)).toBe(120);
    expect(() => inscribir(t, { equipo: 'a', capitan: 'z' })).toThrow(/ya hay/i);
  });
  it('genera octavos, cuartos, semis y final para 16', () => {
    const c = generarCuadro(Array.from({ length: 16 }, (_, i) => 'E' + i), 16);
    expect(c.map((r) => r.nombre)).toEqual(['Octavos', 'Cuartos', 'Semifinales', 'Final']);
    expect(nombreRonda(8)).toBe('Cuartos');
  });
  it('los huecos libres pasan como exentos', () => {
    const c = generarCuadro(['A', 'B', 'C'], 4);
    expect(c[1].partidos[0].a).toBe('A');
  });
  it('el ganador avanza hasta campeón', () => {
    let c = generarCuadro(['A', 'B', 'C', 'D'], 4);
    c = marcarGanador(c, 0, 0, 'A');
    c = marcarGanador(c, 0, 1, 'C');
    c = marcarGanador(c, 1, 0, 'C');
    expect(campeon(c)).toBe('C');
    expect(() => marcarGanador(c, 1, 0, 'B')).toThrow();
  });
  it('no empieza con menos de 2 equipos', () => {
    expect(() => empezar(base)).toThrow();
  });
});
