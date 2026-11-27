/**
 * Media ponderada de lo ya publicado y nota acumulada sobre 10.
 * @param {{t:string,p:number,n:number|null}[]} lista partes de la evaluación (p = peso en %)
 */
export function media(lista = []) {
  const hechas = lista.filter((x) => x.n != null);
  const peso = hechas.reduce((a, x) => a + x.p, 0);
  const suma = hechas.reduce((a, x) => a + x.n * x.p, 0);
  return { media: peso ? suma / peso : null, evaluado: peso, acumulada: suma / 100 };
}

export const tieneNotaNueva = (lista = []) => lista.some((x) => x.nuevo);
