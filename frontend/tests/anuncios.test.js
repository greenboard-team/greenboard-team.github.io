import { describe, expect, it } from 'vitest';
import { condiciones, crearAnuncio, filtrar, miCuota, plazasLibres, unirse, validar } from '../src/domain/comunidad/anuncios.js';
import { MODOS_PAGO, modosDisponibles } from '../src/domain/comunidad/pagos.js';

const autor = { nombre: 'Gonzalo Martínez', curso: '4.º MAIS' };
const semana = { 2: [{ h: '15:00', f: '19:00', s: 'pro3' }] };

describe('Factory de anuncios', () => {
  it('valida lo obligatorio', () => {
    expect(validar({ tipo: 'futbol', autor: { nombre: '', curso: '' }, plazas: 0 })).toHaveLength(4);
  });
  it('crea una pachanga y avisa si choca con tu clase (pero la deja publicar)', () => {
    const a = crearAnuncio({ tipo: 'futbol', autor, dia: 2, desde: '17:00', hasta: '18:30', plazas: 6 }, semana);
    expect(a.titulo).toBe('Pachanga de fútbol sala');
    expect(a.enClase).toBe(true);
    expect(plazasLibres(a)).toBe(6);
  });
  it('en pádel las plazas salen del formato y «paga quien pierda» solo vale con rivales', () => {
    const a = crearAnuncio({ tipo: 'padel', autor, dia: 3, desde: '13:00', hasta: '14:00', plazas: 9, padel: { formato: 'companero', pago: 'perdedor', precio: 5 } });
    expect(a.plazas).toBe(1);
    expect(a.padel.pago).toBe('partes');
    expect(modosDisponibles({ formato: 'rivales' })).toHaveLength(3);
  });
  it('las instalaciones deportivas no heredan el lugar del formulario', () => {
    const a = crearAnuncio({ tipo: 'padel', autor, dia: 3, desde: '13:00', hasta: '14:00', lugar: { tipo: 'uni', texto: 'Cafetería' }, padel: { formato: 'rivales', pago: 'partes', precio: 5 } });
    expect(a.lugar.texto).toMatch(/pádel/);
  });
  it('un plan de un juego sin título se titula solo', () => {
    const a = crearAnuncio({ tipo: 'plan', autor, dia: 5, desde: '21:00', hasta: '23:00', plazas: 3, plan: { categoria: 'videojuegos', juego: 'GTA VI', modo: 'Golpes' } });
    expect(a.titulo).toBe('GTA VI · golpes con gente de la uni');
  });
  it('los planes necesitan título y categoría', () => {
    expect(() => crearAnuncio({ tipo: 'plan', autor, dia: 5, desde: '21:00', hasta: '23:00', plazas: 3, plan: {} })).toThrow(/título/);
  });
});

describe('Strategy de pagos', () => {
  it('divide a partes iguales, invita o paga quien pierde', () => {
    expect(MODOS_PAGO.partes.cuota(5, 4)).toBe(1.25);
    expect(MODOS_PAGO.anunciante.cuota(5, 4)).toBe(0);
    expect(MODOS_PAGO.perdedor.cuota(5, 4)).toBe(2.5);
  });
  it('la cuota de quien se une depende del modo', () => {
    const a = crearAnuncio({ tipo: 'padel', autor, dia: 3, desde: '13:00', hasta: '14:00', padel: { formato: 'rivales', pago: 'perdedor', precio: 5 } });
    expect(miCuota(a)).toBe(2.5);
    expect(condiciones(a).join(' ')).toMatch(/pareja que pierda/);
  });
});

describe('unirse', () => {
  const a = { id: 'x', tipo: 'futbol', autor: { nombre: 'Álvaro', curso: '3.º' }, dia: 3, desde: '13:00', hasta: '14:30', plazas: 1, apuntados: [], lugar: { tipo: 'instalacion', texto: 'Cancha' } };
  it('exige aceptar las condiciones', () => {
    expect(() => unirse(a, autor, { aceptaCondiciones: false })).toThrow(/condiciones/);
  });
  it('apunta y luego está completo', () => {
    const b = unirse(a, autor, { aceptaCondiciones: true });
    expect(b.apuntados).toHaveLength(1);
    expect(a.apuntados).toHaveLength(0); // inmutable
    expect(() => unirse(b, { nombre: 'Otra', curso: '1.º' }, { aceptaCondiciones: true })).toThrow(/completo/);
  });
  it('filtra por lo que cabe en mi horario', () => {
    const choca = { ...a, id: 'y', dia: 2, desde: '16:00', hasta: '17:00' };
    expect(filtrar([a, choca], { enMisHuecos: true, semana }).map((x) => x.id)).toEqual(['x']);
  });
});
