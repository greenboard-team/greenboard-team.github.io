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

describe('qué se revisa de un anuncio', () => {
  it('título, nota, lugar, nombre y curso', async () => {
    const { textoAModerar } = await import('../src/domain/comunidad/anuncios.js');
    const base = { titulo: 'Pachanga', autor: { nombre: 'Gonzalo', curso: '4.º MAIS' }, lugar: { tipo: 'uni', texto: 'Cancha' } };
    expect(v(textoAModerar({ ...base, nota: 'Traed porros' }))).toBe('bloquear');
    expect(v(textoAModerar({ ...base, autor: { nombre: 'El Gilipollas', curso: '4.º' } }))).toBe('bloquear');
    expect(v(textoAModerar(base))).toBe('ok');
  });
});

describe('modelo de IA', () => {
  it('lee la respuesta JSON del modelo aunque venga con texto alrededor', async () => {
    const { leerRespuesta } = await import('../src/services/moderacion/moderadores.js');
    expect(leerRespuesta('{"veredicto":"bloquear","motivo":"amenaza"}', 'qwen').veredicto).toBe('bloquear');
    expect(leerRespuesta('Claro: {"veredicto":"ok","motivo":""}', 'qwen').veredicto).toBe('ok');
    expect(leerRespuesta('no sé', 'qwen')).toBeNull();
  });
  it('las reglas ya pillan los números por letras', () => {
    expect(v('f0llar esta noche')).toBe('bloquear');
    expect(v('voy a m4tar a Pablo')).toBe('revisar');
    expect(v('Matar zombis en el modo historia')).toBe('ok');
  });
});

describe('modelo propio', async () => {
  const modelo = (await import('../src/data/modeloModeracion.json')).default;
  const { cargarModelo, probabilidades, clasificar } = await import('../src/domain/moderacion/modelo.js');
  const { revisarAlMomento } = await import('../src/services/moderacion/moderadores.js');
  const m = cargarModelo(modelo);

  it('da las mismas probabilidades que scikit-learn', () => {
    for (const c of modelo.control) {
      probabilidades(m, c.texto).forEach((p, i) => expect(p).toBeCloseTo(c.probabilidades[i], 3));
    }
  });
  it('entiende frases que la lista de palabras no ve', () => {
    expect(clasificar(m, 'Vamos a reírnos de Hugo en la cafetería').veredicto).toBe('bloquear');
    expect(revisarAlMomento('Voy a m4tar a Pablo').veredicto).toBe('bloquear');
  });
  it('con reglas + modelo, los planes normales no se bloquean', () => {
    for (const t of ['Pachanga mixta de tarde', 'Golpes online en Vice City', 'Matar zombis en el modo historia', 'Acuarela en el Retiro',
      'Repaso de Optimización el jueves', 'Partida de cartas en la cafetería', 'Busco pareja para el pádel', 'Se ha retrasado la clase']) {
      expect(revisarAlMomento(t).veredicto, t).not.toBe('bloquear');
    }
  });
});
