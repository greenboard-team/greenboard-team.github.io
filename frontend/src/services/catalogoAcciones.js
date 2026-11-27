import { corto, num } from '../domain/texto.js';
import { aMin } from '../domain/fechas.js';
import { media } from '../domain/notas.js';
import { sinLeer } from '../repositories/academicoRepository.js';

/**
 * Catálogo de la barra de Inicio: todo lo que se puede pedir escribiendo.
 * Cada acción abre una tarjeta en Inicio (id) o lleva a una pantalla (ruta).
 */
export function catalogo(m, comunidad) {
  const notasDe = (id) => media(m.notas[id] || []);
  return [
    { id: 'padel', tipo: 'Reserva', t: 'Reservar pista de pádel', s: 'Pistas de U-tad, de pago', ico: 'padel', k: 'padel pista deporte jugar raqueta' },
    { id: 'aula', tipo: 'Reserva', t: 'Reservar un aula', s: 'Reserva de Aulas (hoy en Classlife)', ico: 'aula', k: 'aula sala reservar estudiar estudio grupo reserva de aulas' },
    { id: 'justificante', tipo: 'Trámite', t: 'Justificar una falta', s: 'Sube el justificante junto a la falta', ico: 'asis', k: 'justificar justificante falta asistencia faltas medico' },
    { id: 'horario', tipo: 'Horario', t: '¿Dónde tengo clase?', s: 'Tu horario de hoy con los cambios', ico: 'pin', k: 'donde clase aula horario hoy siguiente proxima' },
    { id: 'semana', ruta: '/horario', tipo: 'Horario', t: 'Mi horario de la semana', s: 'Con los planes que caben en tus huecos', ico: 'cal', k: 'horario semana semanal huecos libres planes' },
    { id: 'entregas', tipo: 'Entregas', t: 'Próximas entregas', s: 'Todas tus asignaturas, por fecha', ico: 'doc', k: 'entregas entrega deberes practica tareas' },
    { id: 'matricula', tipo: 'Trámite', t: 'Ver matrícula firmada', s: 'Matrícula 2026/27', ico: 'doc', k: 'matricula certificado documento' },
    // Green Community
    { id: 'gc', ruta: '/community', tipo: 'Community', t: 'Green Community', s: 'Pachangas, pádel, torneos y planes', ico: 'uni', k: 'comunidad community green planes quedar amigos', prio: 10 },
    { id: 'gc-futbol', ruta: '/community?tipo=futbol', tipo: 'Community', t: 'Buscar pachanga de fútbol sala', s: 'Cancha de U-tad · gratis', ico: 'balon', k: 'futbol futbito pachanga cancha partido jugar sala' },
    { id: 'gc-padel', ruta: '/community?tipo=padel', tipo: 'Community', t: 'Buscar pareja o rivales de pádel', s: 'Pista a 5 € · elige cómo se paga', ico: 'padel', k: 'padel pareja rivales partido' },
    { id: 'gc-nuevo', ruta: '/community/nuevo', tipo: 'Community', t: 'Crear un plan o una pachanga', s: 'Elige franja sobre tu horario', ico: 'mas', k: 'crear publicar anuncio organizar plan pachanga quedada' },
    { id: 'gc-torneos', ruta: '/community/torneos', tipo: 'Community', t: 'Torneos de la universidad', s: 'Fútbol sala y pádel con premio', ico: 'trofeo', k: 'torneo campeonato copa liga premio inscripcion bracket' },
    ...comunidad.comunidades.map((c) => ({
      id: 'gc-c-' + c.id, ruta: '/community/c/' + c.id, tipo: 'Community', t: `${c.emoji} ${c.nombre}`, s: `${c.miembros} miembros`,
      ico: c.categoria === 'videojuegos' ? 'mando' : c.categoria === 'arte' ? 'pincel' : 'uni', k: `${c.nombre} ${c.juego || ''} ${(c.modos || []).join(' ')} ${c.categoria}`,
    })),
    ...m.apuntes.map((c) => ({ id: 'com-' + c.id, tipo: 'Estudio', t: c.t, s: c.s, ico: 'libro', k: 'comunidad apuntes repaso apoyo companeros estudio ' + c.t })),
    ...m.subjects.map((s) => ({ id: 'asig-' + s.id, tipo: 'Asignatura', t: s.n, s: s.c, ico: 'libro', k: s.n + ' asignatura' })),
    { id: 'notas', tipo: 'Notas', t: 'Mis calificaciones', s: 'Media de cada asignatura', ico: 'asis', k: 'notas calificaciones media nota examen aprobado', prio: 12 },
    ...m.subjects.map((s) => ({ id: 'notas-' + s.id, tipo: 'Notas', t: 'Notas de ' + corto(s), s: `Media ${num(notasDe(s.id).media)} · evaluado ${notasDe(s.id).evaluado} %`, ico: 'asis', k: 'notas calificaciones media ' + s.n })),
    { id: 'mensajes', tipo: 'Mensajes', t: 'Mensajes', s: 'Chats de clase y de grupo', ico: 'uni', k: 'mensajes chat chats clase grupo hablar escribir', prio: 12 },
    ...m.chats.map((c) => ({ id: 'chat-' + c.id, tipo: 'Chat', t: c.t, s: c.n + ' personas', ico: 'uni', k: 'chat mensajes ' + c.t })),
    ...m.subjects.map((s) => ({ id: 'cont-' + s.id, tipo: 'Contenido', t: 'Guía docente de ' + corto(s), s: 'Contenido por temas', ico: 'libro', k: 'guia docente contenido temas materiales ' + s.n })),
    ...m.subjects.flatMap((s) => (m.contenido[s.id] || []).flatMap((u) => u.items.filter((x) => x.tipo !== 'pronto')
      .map((x) => ({ id: 'cont-' + s.id, tipo: 'Material', t: x.t, s: corto(s) + ' · ' + u.u, ico: 'doc', k: 'apuntes material pdf ' + u.u + ' ' + x.t })))),
  ];
}

/** Chips de contexto: cambian con la hora y con tus datos. */
export function chips(m, ui, comunidad, ahora = new Date()) {
  const out = [];
  const sig = m.today.find((c) => aMin(c.f) > m.minutosAhora);
  if (sig) {
    const s = m.subjects.find((x) => x.id === sig.s) || { n: '' };
    out.push({ id: 'horario', t: `${corto(s)} · ${m.finde ? 'lun ' : ''}${sig.h} · ${sig.a}`, ico: 'pin', por: sig.changed ? 'aula nueva' : 'siguiente' });
  }
  if (!ui.justificado && !ui.noJustificada) out.push({ id: 'justificante', t: 'Subir justificante', ico: 'asis', rojo: true, por: '1 falta' });
  const gta = comunidad.comunidades.find((c) => c.id === 'gta6');
  if (gta) out.push({ id: 'gc-c-gta6', ruta: '/community/c/gta6', t: 'GTA VI con gente de la uni', ico: 'mando', por: 'nuevo' });
  out.push({ id: 'gc-futbol', ruta: '/community?tipo=futbol', t: 'Pachanga en tu hueco', ico: 'balon', por: 'community' });
  const vie = ahora.getDay() === 5;
  out.push({ id: 'padel', t: vie && ahora.getHours() >= 12 ? 'Reservar pádel esta tarde' : 'Reservar pádel el viernes', ico: 'padel', q: vie ? 'pádel hoy' : 'pádel viernes' });
  out.push({ id: 'aula', t: 'Reservar aula para estudiar', ico: 'aula' });
  out.push({ id: 'com-apuntes', t: 'Apuntes de Análisis III', ico: 'libro', por: 'estudio' });
  const nl = sinLeer(m, ui.leidos);
  if (nl) out.push({ id: 'mensajes', t: `Mensajes · ${nl} sin leer`, ico: 'uni' });
  if (m.notas.aiii) out.push({ id: 'notas-aiii', t: 'Nota nueva: Asistencia', ico: 'asis', por: 'Análisis III' });
  return out;
}
