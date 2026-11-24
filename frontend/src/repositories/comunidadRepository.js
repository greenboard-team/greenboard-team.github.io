import semilla from '../data/greenCommunity.json';
import { local, CLAVES } from '../services/storage/almacen.js';
import { generarCuadro, marcarGanador } from '../domain/comunidad/torneos.js';
import { analizar } from '../domain/moderacion/reglas.js';
import moderacion from '../data/moderacion.json';

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
    moderacion: { bloqueados: 0, publicadosSolos: 0, revisados: 0 },
    perfil: null, // {nombre, curso}: se rellena la primera vez que publicas o te unes
  };
}

export function cargar() {
  const guardado = local.leer(CLAVES.comunidad);
  if (!guardado || guardado.version !== 1) return estadoInicial();
  // Las comunidades vienen siempre de la semilla (por si se añaden nuevas); lo demás, de lo guardado
  const estado = { ...estadoInicial(), ...guardado, comunidades: semilla.comunidades };
  // Anuncios guardados antes de que existiera el filtro: si hoy se bloquearían, se retiran
  estado.anuncios = estado.anuncios.map((a) => (a.mio && a.estado !== 'retirado' && analizar(textoDe(a), moderacion).veredicto === 'bloquear'
    ? { ...a, estado: 'retirado', moderacion: { ...analizar(textoDe(a), moderacion), retiradoAlCargar: true } } : a));
  return estado;
}

const textoDe = (a) => [a.titulo, a.nota, a.lugar?.texto, a.plan?.modo].filter(Boolean).join('. ');

export function guardar(estado) {
  const { comunidades: _c, ...resto } = estado;
  local.guardar(CLAVES.comunidad, resto);
}

export function reiniciar() {
  local.borrar(CLAVES.comunidad);
  return estadoInicial();
}
