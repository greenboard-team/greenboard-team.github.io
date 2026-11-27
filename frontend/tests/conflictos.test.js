import { describe, expect, it } from 'vitest';
import { defaultsDeConflicto } from '../src/domain/conflictos.js';

const conflictos = [
  { clave: 'PRO3', opciones: [{ grupo: 'FIIS4A' }, { grupo: 'INSO3D' }] },
  { clave: 'ING', opciones: [{ grupo: 'FIIS4A' }, { grupo: 'INSO4A' }] },
];

describe('defaultsDeConflicto', () => {
  it('elige la primera opción si no hay elección previa', () => {
    expect(defaultsDeConflicto(conflictos, {})).toEqual({ PRO3: 'FIIS4A', ING: 'FIIS4A' });
  });
  it('respeta la elección previa si sigue siendo una opción válida', () => {
    expect(defaultsDeConflicto(conflictos, { PRO3: 'INSO3D', ING: 'INSO4A' })).toEqual({ PRO3: 'INSO3D', ING: 'INSO4A' });
  });
  it('vuelve a la primera opción si la elección previa ya no es válida', () => {
    expect(defaultsDeConflicto(conflictos, { PRO3: 'MAIS4A' })).toEqual({ PRO3: 'FIIS4A', ING: 'FIIS4A' });
  });
});
