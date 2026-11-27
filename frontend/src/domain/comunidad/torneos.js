/**
 * Torneos que organiza la universidad: fútbol sala o pádel, 4/8/16 equipos, eliminatoria directa.
 * El bote = premio base de la universidad + cuota de inscripción × equipos inscritos.
 */

export const TAMANOS = [4, 8, 16];

const NOMBRE_RONDA = { 2: 'Final', 4: 'Semifinales', 8: 'Cuartos', 16: 'Octavos', 32: 'Dieciseisavos' };
export const nombreRonda = (equiposEnRonda) => NOMBRE_RONDA[equiposEnRonda] ?? `Ronda de ${equiposEnRonda}`;

export function bote(t) {
  return (t.premio?.base || 0) + (t.cuota || 0) * t.inscritos.length;
}

export const plazasTorneo = (t) => Math.max(0, t.equipos - t.inscritos.length);

/** Validación de un torneo nuevo (lo crea la universidad). */
export function validarTorneo(t) {
  const e = [];
  if (!t.nombre?.trim()) e.push('Ponle nombre al torneo.');
  if (!TAMANOS.includes(Number(t.equipos))) e.push('El número de equipos tiene que ser 4, 8 o 16.');
  if (!(Number(t.cuota) >= 0)) e.push('La cuota no puede ser negativa.');
  if (!(Number(t.premio?.base) >= 0)) e.push('El premio no puede ser negativo.');
  return e;
}

/** Inscribe un equipo. Devuelve un torneo nuevo o lanza el motivo. */
export function inscribir(t, { equipo, capitan }) {
  if (t.estado !== 'inscripcion') throw new Error('La inscripción está cerrada.');
  if (!equipo?.trim()) throw new Error('Pon el nombre del equipo.');
  if (plazasTorneo(t) === 0) throw new Error('No quedan plazas.');
  if (t.inscritos.some((x) => x.equipo.toLowerCase() === equipo.trim().toLowerCase())) throw new Error('Ya hay un equipo con ese nombre.');
  return { ...t, inscritos: [...t.inscritos, { equipo: equipo.trim(), capitan, mio: true }] };
}

/**
 * Cuadro de eliminatoria. Si faltan equipos, los huecos pasan como «exento» (bye) y avanzan solos.
 * @returns {{nombre:string, partidos:{a:string|null,b:string|null,ganador:string|null}[]}[]}
 */
export function generarCuadro(equipos, tamano) {
  const n = tamano;
  const lista = [...equipos.slice(0, n)];
  while (lista.length < n) lista.push(null);
  // Cabezas de serie repartidas: 1 contra n, 2 contra n-1… para que los exentos no se crucen entre sí.
  const primera = [];
  for (let i = 0; i < n / 2; i++) primera.push({ a: lista[i], b: lista[n - 1 - i], ganador: null });
  const rondas = [{ nombre: nombreRonda(n), partidos: primera }];
  for (let m = n / 2; m >= 2; m /= 2) {
    rondas.push({ nombre: nombreRonda(m), partidos: Array.from({ length: m / 2 }, () => ({ a: null, b: null, ganador: null })) });
  }
  return propagarExentos(rondas);
}

function propagarExentos(rondas) {
  let r = rondas;
  r[0].partidos.forEach((p, i) => {
    if (p.a && !p.b) r = marcarGanador(r, 0, i, p.a);
    else if (!p.a && p.b) r = marcarGanador(r, 0, i, p.b);
  });
  return r;
}

/** Marca el ganador de un partido y lo coloca en la siguiente ronda (inmutable). */
export function marcarGanador(rondas, ronda, partido, ganador) {
  const p = rondas[ronda]?.partidos[partido];
  if (!p) throw new Error('Ese partido no existe.');
  if (ganador !== p.a && ganador !== p.b) throw new Error('El ganador tiene que jugar ese partido.');
  const copia = rondas.map((r) => ({ ...r, partidos: r.partidos.map((x) => ({ ...x })) }));
  copia[ronda].partidos[partido].ganador = ganador;
  const sig = copia[ronda + 1];
  if (sig) {
    const destino = sig.partidos[Math.floor(partido / 2)];
    const lado = partido % 2 === 0 ? 'a' : 'b';
    // Si cambia el ganador, se borra lo que viniera de él en adelante
    if (destino[lado] !== ganador) {
      destino[lado] = ganador;
      destino.ganador = null;
    }
  }
  return copia;
}

export function campeon(rondas) {
  return rondas[rondas.length - 1]?.partidos[0]?.ganador ?? null;
}

/** Cierra la inscripción y sortea el cuadro. */
export function empezar(t) {
  if (t.inscritos.length < 2) throw new Error('Hacen falta al menos 2 equipos.');
  return { ...t, estado: 'en-juego', cuadro: generarCuadro(t.inscritos.map((x) => x.equipo), t.equipos) };
}
