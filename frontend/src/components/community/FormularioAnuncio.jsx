import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import { Segmentos } from '../common/Piezas.jsx';
import { SemanaGrid } from '../horario/SemanaGrid.jsx';
import BannerGta from './BannerGta.jsx';
import universidad from '../../data/universidad.json';
import { FORMATOS_PADEL, TIPOS, validar } from '../../domain/comunidad/anuncios.js';
import { modosDisponibles, modoPago } from '../../domain/comunidad/pagos.js';
import { clasesQueSolapan } from '../../domain/horario.js';
import { aMin, deMin, DIAS_SEMANA, diaSemana, nombreDia } from '../../domain/fechas.js';
import { corto, euros } from '../../domain/texto.js';
import { useAcademico } from '../../store/SesionContext.jsx';
import { useComunidad } from '../../store/ComunidadContext.jsx';
import { useUi } from '../../store/UiContext.jsx';
import { usePerfil } from '../../hooks/usePerfil.js';

const DURACIONES = [60, 90, 120, 180];
const formatoDuracion = (min) => (min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ' ' + (min % 60) : ''}` : `${min} min`);
const instalacion = (deporte) => universidad.instalaciones.find((i) => i.deporte === deporte);

function borradorInicial(params, perfil, comunidades) {
  const com = comunidades.find((c) => c.id === params.get('comunidad'));
  const tipo = com?.categoria === 'deporte' ? com.id : params.get('tipo') || (com ? 'plan' : 'futbol');
  const hoy = diaSemana();
  return {
    tipo: TIPOS[tipo] ? tipo : 'futbol',
    autor: { ...perfil },
    titulo: '',
    plazas: 5,
    dia: null,
    desde: null,
    hasta: null,
    duracion: 90,
    nota: '',
    comunidad: com?.id || null,
    padel: { formato: 'rivales', pago: 'partes', precio: instalacion('padel')?.precio ?? 5 },
    plan: { categoria: com?.categoria && com.categoria !== 'deporte' ? com.categoria : 'videojuegos', juego: com?.juego || '', modo: '' },
    lugar: com?.juego ? { tipo: 'online', texto: 'Online' } : { tipo: 'uni', texto: 'Cafetería · U-tad' },
    _sugerenciaDia: hoy,
  };
}

/** Formulario para publicar una pachanga, un partido de pádel o un plan, eligiendo la franja sobre tu horario. */
export default function FormularioAnuncio() {
  const m = useAcademico();
  const { comunidades, publicar } = useComunidad();
  const perfil = usePerfil();
  const { avisar } = useUi();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [b, setB] = useState(() => borradorInicial(params, perfil, comunidades));
  const [errores, setErrores] = useState([]);
  const set = (cambios) => { setB((x) => ({ ...x, ...cambios })); setErrores([]); };

  const comunidad = comunidades.find((c) => c.id === b.comunidad);
  const juego = b.plan.juego;
  const comunidadDelJuego = comunidades.find((c) => c.juego && c.juego === juego);
  const modos = comunidadDelJuego?.modos || (juego ? universidad.modosJuego : []);
  const formato = FORMATOS_PADEL[b.padel.formato];

  const elegirFranja = (dia, min) => set({ dia, desde: deMin(min), hasta: deMin(Math.min(min + b.duracion, 23 * 60 + 59)) });
  const fijarFin = (minFin) => {
    if (!b.desde) return;
    const d = minFin - aMin(b.desde);
    if (d >= 15) set({ hasta: deMin(minFin), duracion: d });
  };
  const cambiarDuracion = (d) => set({ duracion: d, ...(b.desde && { hasta: deMin(Math.min(aMin(b.desde) + d, 23 * 60 + 59)) }) });
  const choque = b.dia ? clasesQueSolapan(m.semana, b) : [];
  const nombreAsig = (id) => corto(m.subjects.find((s) => s.id === id) || { n: id });

  const enviar = (e) => {
    e.preventDefault();
    const final = {
      ...b,
      comunidad: b.tipo === 'plan' ? (comunidadDelJuego?.id || b.comunidad || (b.plan.categoria === 'arte' ? 'arte' : b.plan.categoria === 'estudio' ? 'estudio' : null)) : b.tipo,
      plazas: b.tipo === 'padel' ? formato.plazas : Number(b.plazas),
    };
    const errs = validar(final);
    if (errs.length) { setErrores(errs); return; }
    const r = publicar(final, m.semana);
    if (r.error) { setErrores([r.error]); return; }
    avisar('Publicado. Le saldrá a quien tenga ese hueco libre.');
    navigate(`/community?nuevo=${r.anuncio.id}`);
  };

  return (
    <form className="gc-form" onSubmit={enviar}>
      {comunidad?.banner === 'gta6' && <div className="gc-banner"><BannerGta alto={120} /></div>}

      <fieldset>
        <legend>1 · ¿Qué quieres organizar?</legend>
        <div className="gc-opciones">
          {Object.values(TIPOS).map((t) => (
            <button key={t.id} type="button" className="gc-opcion" aria-pressed={b.tipo === t.id} onClick={() => set({ tipo: t.id })}>
              <span aria-hidden="true">{t.emoji}</span>
              <b>{t.id === 'plan' ? 'Un plan' : t.corto}</b>
              <small>{t.id === 'futbol' ? 'Cancha de U-tad · gratis' : t.id === 'padel' ? `Pista ${euros(b.padel.precio)} / hora` : 'Videojuegos, arte, estudio…'}</small>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>2 · Tú</legend>
        <div className="gc-campos">
          <div className="campo"><label htmlFor="gc-nombre">Nombre</label><input id="gc-nombre" value={b.autor.nombre} onChange={(e) => set({ autor: { ...b.autor, nombre: e.target.value } })} /></div>
          <div className="campo"><label htmlFor="gc-curso">Curso</label><input id="gc-curso" value={b.autor.curso} placeholder="4.º MAIS" onChange={(e) => set({ autor: { ...b.autor, curso: e.target.value } })} /></div>
        </div>
      </fieldset>

      <fieldset>
        <legend>3 · Detalles</legend>
        {b.tipo === 'futbol' && (
          <>
            <p className="note" style={{ marginTop: 0 }}>{instalacion('futbol')?.nombre} · {instalacion('futbol')?.jugadores} jugadores en total.</p>
            <Plazas valor={b.plazas} onCambio={(n) => set({ plazas: n })} max={9} etiqueta="¿Cuántos buscas?" />
          </>
        )}
        {b.tipo === 'padel' && (
          <>
            <div className="lbl">¿Cómo estáis?</div>
            <div className="gc-opciones">
              {Object.values(FORMATOS_PADEL).map((f) => (
                <button key={f.id} type="button" className="gc-opcion sm" aria-pressed={b.padel.formato === f.id}
                  onClick={() => set({ padel: { ...b.padel, formato: f.id, pago: f.id !== 'rivales' && b.padel.pago === 'perdedor' ? 'partes' : b.padel.pago } })}>
                  <b>{f.etiqueta}</b><small>{f.texto}</small>
                </button>
              ))}
            </div>
            <div className="lbl">¿Cómo se paga la pista ({euros(b.padel.precio)})?</div>
            <div className="gc-opciones">
              {modosDisponibles(b.padel).map((p) => (
                <button key={p.id} type="button" className="gc-opcion sm" aria-pressed={b.padel.pago === p.id} onClick={() => set({ padel: { ...b.padel, pago: p.id } })}>
                  <b>{p.etiqueta}</b><small>{p.resumen}</small>
                </button>
              ))}
            </div>
            <p className="gc-cuota"><Icon n="euro" />{modoPago(b.padel.pago).condicion(b.padel.precio, formato.jugadores)}</p>
            <p className="note">Los que se unan verán estas condiciones y tendrán que aceptarlas antes.</p>
          </>
        )}
        {b.tipo === 'plan' && (
          <>
            <div className="lbl">Categoría</div>
            <Segmentos etiqueta="Categoría" valor={b.plan.categoria} onCambio={(k) => set({ plan: { ...b.plan, categoria: k, ...(k !== 'videojuegos' && { juego: '', modo: '' }) } })}
              opciones={universidad.categoriasPlan.map((c) => ({ k: c.id, t: `${c.emoji} ${c.nombre}` }))} />
            {b.plan.categoria === 'videojuegos' && (
              <>
                <div className="lbl">Juego</div>
                <Segmentos etiqueta="Juego" valor={juego} onCambio={(k) => set({ plan: { ...b.plan, juego: k, modo: '' } })}
                  opciones={universidad.juegos.map((j) => ({ k: j, t: j }))} />
                {modos.length > 0 && (
                  <>
                    <div className="lbl">Modo</div>
                    <Segmentos etiqueta="Modo" valor={b.plan.modo}
                      onCambio={(k) => set({ plan: { ...b.plan, modo: k }, ...(k === 'En casa de alguien' ? { lugar: { tipo: 'fuera', texto: `Casa de ${b.autor.nombre.split(' ')[0]}` } } : k === 'Online' || k === 'Golpes' ? { lugar: { tipo: 'online', texto: 'Online' } } : {}) })}
                      opciones={modos.map((x) => ({ k: x, t: x }))} />
                  </>
                )}
              </>
            )}
            <div className="campo"><label htmlFor="gc-titulo">Título</label>
              <input id="gc-titulo" value={b.titulo} placeholder={juego ? `${juego}${b.plan.modo ? ' · ' + b.plan.modo.toLowerCase() : ''} con gente de la uni` : 'Ej.: Acuarela en el Retiro'} onChange={(e) => set({ titulo: e.target.value })} />
            </div>
            <div className="lbl">¿Dónde?</div>
            <Segmentos etiqueta="Lugar" valor={b.lugar.tipo === 'fuera' ? 'Fuera de la uni' : b.lugar.texto} onCambio={(k) => { const l = universidad.lugares.find((x) => x.texto === k); set({ lugar: { tipo: l.tipo, texto: l.tipo === 'fuera' ? '' : l.texto } }); }}
              opciones={universidad.lugares.map((l) => ({ k: l.texto, t: l.texto.replace(' · U-tad', '') }))} />
            {b.lugar.tipo === 'fuera' && (
              <div className="campo"><label htmlFor="gc-lugar">Sitio</label><input id="gc-lugar" value={b.lugar.texto} placeholder="Casa de Hugo, Parque del Retiro…" onChange={(e) => set({ lugar: { tipo: 'fuera', texto: e.target.value } })} /></div>
            )}
            <Plazas valor={b.plazas} onCambio={(n) => set({ plazas: n })} max={20} etiqueta="¿Cuántas personas buscas?" />
          </>
        )}
      </fieldset>

      <fieldset>
        <legend>4 · Franja</legend>
        <p className="note" style={{ marginTop: 0 }}>Toca la rejilla donde quieras empezar. Ves tus clases para tenerlas en cuenta; si lo pones en hora de clase, se avisa pero se puede.</p>
        <div className="lbl">Duración</div>
        <Segmentos etiqueta="Duración" valor={b.duracion} onCambio={cambiarDuracion} opciones={DURACIONES.map((d) => ({ k: d, t: formatoDuracion(d) }))} />
        <div className="gc-franja-manual">
          <label>Día <select value={b.dia ?? ''} onChange={(e) => e.target.value && elegirFranja(Number(e.target.value), b.desde ? aMin(b.desde) : 13 * 60)}>
            <option value="">Elige…</option>{DIAS_SEMANA.map((d) => <option key={d.n} value={d.n}>{d.largo}</option>)}
          </select></label>
          <label>Empieza <input type="time" step="900" value={b.desde ?? ''} onChange={(e) => e.target.value && elegirFranja(b.dia || b._sugerenciaDia, aMin(e.target.value))} /></label>
          <label>Acaba <input type="time" step="900" value={b.hasta ?? ''} disabled={!b.desde} onChange={(e) => e.target.value && fijarFin(aMin(e.target.value))} /></label>
          {b.desde && <span className="note">Duración: {formatoDuracion(aMin(b.hasta) - aMin(b.desde))} · también puedes arrastrar el borde de abajo del bloque</span>}
        </div>
        <SemanaGrid semana={m.semana} subjects={m.subjects} alPulsar={elegirFranja} referencia={m.diaClase} etiqueta="Elige la franja"
          bloques={b.dia ? [{ dia: b.dia, desde: b.desde, hasta: b.hasta, tipo: choque.length ? 'seleccion choca' : 'seleccion', alRedimensionar: fijarFin, titulo: `${TIPOS[b.tipo].emoji} Tu ${b.tipo === 'plan' ? 'plan' : TIPOS[b.tipo].corto.toLowerCase()}`, sub: `${b.desde}–${b.hasta}` }] : []} />
        {b.dia && (
          <p className={choque.length ? 'gc-aviso-clase' : 'gc-ok-clase'}>
            {choque.length
              ? <>Tienes clase de {choque.map((c) => `${nombreAsig(c.s)} (${c.h}–${c.f})`).join(' y ')} el {nombreDia(b.dia)}. Puedes publicarlo igualmente.</>
              : <><Icon n="check" />{nombreDia(b.dia)} de {b.desde} a {b.hasta}: no tienes clase.</>}
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend>5 · Algo más (opcional)</legend>
        <div className="campo"><label htmlFor="gc-nota">Nota para los que se unan</label>
          <input id="gc-nota" value={b.nota} maxLength={140} placeholder="Nivel, qué traer, plataforma…" onChange={(e) => set({ nota: e.target.value })} />
        </div>
      </fieldset>

      {errores.length > 0 && <div className="error" role="alert">{errores.map((e) => <p key={e} style={{ margin: 0 }}>{e}</p>)}</div>}
      <p className="gc-publicar">
        <button className="btn" type="submit"><Icon n="check" />Publicar anuncio</button>
        <span className="note">Saldrá en Green Community y en el horario de quien tenga ese hueco libre.</span>
      </p>
    </form>
  );
}

function Plazas({ valor, onCambio, max, etiqueta }) {
  return (
    <div className="gc-plazas-sel">
      <span className="lbl" style={{ margin: 0 }}>{etiqueta}</span>
      <button type="button" className="btn sm dark" aria-label="Una menos" disabled={valor <= 1} onClick={() => onCambio(valor - 1)}>−</button>
      <b aria-live="polite">{valor}</b>
      <button type="button" className="btn sm dark" aria-label="Una más" disabled={valor >= max} onClick={() => onCambio(valor + 1)}>+</button>
    </div>
  );
}
