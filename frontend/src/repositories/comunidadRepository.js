import semilla from '../data/greenCommunity.json';
import { local, CLAVES } from '../services/storage/almacen.js';
import { generarCuadro, marcarGanador } from '../domain/comunidad/torneos.js';

/**
 * Repository de Green Community. Hoy guarda en el navegador (localStorage);
 * cuando haya backend, solo cambia este fichero: la interfaz (cargar / guardar / reiniciar) es la misma.
 */

/** Torneos de la semilla: si están en juego, se sortea el cuadro y se aplican los resultados ya jugados. */
function prepararTorneo(t) {
  if (t.estado === 'inscripcion' || t.cuadro) return { ...t, inscritos: [...t.inscritos] };
  let cuadro = generarCuadro(t.inscritos.map((x) => x.equipo), t.equipos);
  for (const [r, p, g] of t.resultados || []) cuadro = marcarGanador(cuadro, r, p, g);
  const { resultados: _r, ...resto } = t;
  return { ...resto, cuadro };
}

export function estadoInicial() {
  return {
    version: 1,
    comunidades: semilla.comunidades,
    anuncios: semilla.anuncios.map((a) => ({ ...a, apuntados: [...a.apuntados] })),
    torneos: semilla.torneos.map(prepararTorneo),
    seguidas: ['gta6', 'futbol'],
    perfil: null, // {nombre, curso}: se rellena la primera vez que publicas o te unes
  };
}

export function cargar() {
  const guardado = local.leer(CLAVES.comunidad);
  if (!guardado || guardado.version !== 1) return estadoInicial();
  // Las comunidades vienen siempre de la semilla (por si se añaden nuevas); lo demás, de lo guardado
  return { ...estadoInicial(), ...guardado, comunidades: semilla.comunidades };
}

export function guardar(estado) {
  const { comunidades: _c, ...resto } = estado;
  local.guardar(CLAVES.comunidad, resto);
}

export function reiniciar() {
  local.borrar(CLAVES.comunidad);
  return estadoInicial();
}
