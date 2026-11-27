/**
 * Grupo por defecto para cada conflicto, respetando la elección previa si sigue siendo válida.
 * Así, volver a Grupos para añadir otro grupo no pisa lo que el alumno ya había elegido.
 *
 * @param {{clave:string, opciones:{grupo:string}[]}[]} conflictos
 * @param {Record<string,string>} anteriores
 * @returns {Record<string,string>}
 */
export function defaultsDeConflicto(conflictos, anteriores = {}) {
  const out = {};
  for (const c of conflictos) {
    const previo = anteriores[c.clave];
    out[c.clave] = c.opciones.some((o) => o.grupo === previo) ? previo : c.opciones[0].grupo;
  }
  return out;
}
