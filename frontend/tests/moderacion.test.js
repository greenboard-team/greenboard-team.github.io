import { describe, expect, it } from 'vitest';
import config from '../src/data/moderacion.json';
import { analizar, explicar, normalizar } from '../src/domain/moderacion/reglas.js';
import { ModeradorPorCapas, ModeradorReglas } from '../src/services/moderacion/moderadores.js';

const v = (t) => analizar(t, config).veredicto;

describe('filtro local de moderación', () => {
  it('bloquea el contenido sexual, también con trucos', () => {
    expect(v('Folla conmigo y victor peiro')).toBe('bloquear');
    expect(v('F0LLA conmigo')).toBe('bloquear');
    expect(v('fooolla')).toBe('bloquear');
    expect(v('f o l l a r esta noche')).toBe('bloquear');
    expect(v('fóllámé')).toBe('bloquear');
  });
  it('bloquea insultos, odio y drogas', () => {
    expect(v('Pachanga contra los subnormales de 3.º')).toBe('bloquear');
    expect(v('nos fumamos unos porros')).toBe('bloquear');
  });
  it('manda a revisión lo dudoso: apuestas, alcohol, desnudos, teléfonos', () => {
    expect(v('Apostamos 20 euros al FIFA')).toBe('revisar');
    expect(v('Botellón después del partido')).toBe('revisar');
    expect(v('Dibujo de desnudo artístico')).toBe('revisar');
    expect(v('Escríbeme al 612 345 678')).toBe('revisar');
  });
  it('no bloquea planes normales (ni palabras parecidas)', () => {
    for (const t of ['Pachanga mixta de tarde', 'Paga quien pierda', 'Repartir folletos de la feria', 'Cálculo y pollo asado',
      'Golpes online en Vice City', 'Matar zombis en el modo historia', 'Viaje a Mongolia', 'Se ha retrasado la clase', 'Coca-Cola en la cafetería', 'Perros y gatos']) {
      expect(v(t), t).toBe('ok');
    }
  });
  it('explica el motivo', () => {
    expect(explicar(analizar('Folla conmigo', config))).toMatch(/contenido sexual/);
    expect(normalizar('Á3 b@')).toBe('ae ba');
  });
});

describe('moderación por capas', () => {
  it('si el modelo no responde, deciden las reglas', async () => {
    const caido = { nombre: 'caido', moderar: async () => null };
    const m = new ModeradorPorCapas([new ModeradorReglas(), caido]);
    expect((await m.moderar('Pachanga a mediodía')).veredicto).toBe('ok');
  });
  it('el modelo puede subir la gravedad de lo que las reglas no ven', async () => {
    const llm = { nombre: 'qwen', moderar: async () => ({ veredicto: 'bloquear', motivos: [{ nombre: 'burla a una persona', accion: 'bloquear' }], fuente: 'qwen' }) };
    const m = new ModeradorPorCapas([new ModeradorReglas(), llm]);
    expect((await m.moderar('Vamos a reírnos de Fulano en clase')).veredicto).toBe('bloquear');
  });
  it('lo evidente no llega al modelo', async () => {
    let llamado = false;
    const llm = { nombre: 'qwen', moderar: async () => { llamado = true; return null; } };
    await new ModeradorPorCapas([new ModeradorReglas(), llm]).moderar('Folla conmigo');
    expect(llamado).toBe(false);
  });
});
