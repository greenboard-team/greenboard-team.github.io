import { useState } from 'react';
import Icon from '../common/Icon.jsx';
import { TIPOS, emojiDe, FORMATOS_PADEL, condiciones, estaCompleto, estoyApuntado, miCuota, plazasLibres } from '../../domain/comunidad/anuncios.js';
import { modoPago } from '../../domain/comunidad/pagos.js';
import { tengoClase } from '../../domain/horario.js';
import { nombreDia } from '../../domain/fechas.js';
import { euros, iniciales, plural } from '../../domain/texto.js';
import { useComunidad } from '../../store/ComunidadContext.jsx';
import { useAcademico } from '../../store/SesionContext.jsx';
import { useUi } from '../../store/UiContext.jsx';
import { usePerfil } from '../../hooks/usePerfil.js';

const capital = (s) => s.replace(/^./, (c) => c.toUpperCase());

export function Etiquetas({ a }) {
  const m = useAcademico();
  const cabe = !tengoClase(m.semana, a);
  return (
    <div className="gc-etiquetas">
      {a.tipo === 'padel' && <span className="gc-tag"><Icon n="euro" />{modoPago(a.padel.pago).etiqueta}</span>}
      {a.tipo === 'padel' && <span className="gc-tag">{FORMATOS_PADEL[a.padel.formato].etiqueta}</span>}
      {a.plan?.juego && <span className="gc-tag"><Icon n="mando" />{a.plan.juego}{a.plan.modo ? ' · ' + a.plan.modo : ''}</span>}
      {a.lugar.tipo === 'online' && <span className="gc-tag">Online</span>}
      {cabe ? <span className="gc-tag ok"><Icon n="check" />Cabe en tu horario</span> : <span className="gc-tag aviso">Tienes clase a esa hora</span>}
      {a.enClase && !a.mio && <span className="gc-tag aviso" title="Quien publica tiene clase a esa hora">Lo puso en hora de clase</span>}
    </div>
  );
}

/** Tarjeta de un anuncio de Green Community. */
export function TarjetaAnuncio({ a, alUnirse }) {
  const perfil = usePerfil();
  const { dispatch, comunidades } = useComunidad();
  const { avisar } = useUi();
  const libres = plazasLibres(a);
  const apuntado = estoyApuntado(a, perfil.nombre);
  const total = a.plazas;
  return (
    <article className={`gc-anuncio tipo-${a.tipo} ${estaCompleto(a) ? 'completo' : ''}`} id={'gc-' + a.id}>
      <div className="gc-anuncio-h">
        <span className="gc-emoji" aria-hidden="true">{emojiDe(a, comunidades)}</span>
        <div>
          <span className="gc-tipo">{a.plan?.categoria === 'arte' ? 'Arte y diseño' : a.plan ? 'Plan' : TIPOS[a.tipo].corto}</span>
          <h4>{a.titulo}</h4>
        </div>
      </div>
      <p className="gc-cuando"><Icon n="cal" />{capital(nombreDia(a.dia))} · {a.desde}–{a.hasta}</p>
      <p className="gc-cuando"><Icon n="pin" />{a.lugar.texto}</p>
      <Etiquetas a={a} />
      <div className="gc-plazas" aria-label={`${a.apuntados.length} de ${total} plazas cubiertas`}>
        {Array.from({ length: total }, (_, i) => <span key={i} className={i < a.apuntados.length ? 'llena' : ''} />)}
        <small>{libres ? `Faltan ${plural(libres, 'persona')}` : 'Completo'}</small>
      </div>
      <div className="gc-anuncio-pie">
        <span className="gc-autor"><span className="avatar sm">{iniciales(a.autor.nombre)}</span>{a.autor.nombre}<small>{a.autor.curso}</small></span>
        {a.mio ? (
          <button className="linkbtn" onClick={() => { dispatch({ type: 'borrar', id: a.id }); avisar('Anuncio retirado'); }}>Retirar mi anuncio</button>
        ) : apuntado ? (
          <span className="gc-dentro"><span className="pill ok"><Icon n="check" />Apuntado</span>
            <button className="linkbtn" onClick={() => { dispatch({ type: 'salirse', id: a.id, nombre: perfil.nombre }); avisar('Te has salido'); }}>Salirme</button></span>
        ) : (
          <button className="btn sm" disabled={!libres} onClick={() => alUnirse(a)}>{libres ? 'Unirme' : 'Completo'}</button>
        )}
      </div>
    </article>
  );
}

/** Diálogo para unirse: condiciones que hay que revisar y aceptar antes (pago incluido). */
export function DialogoUnirse({ a, alCerrar }) {
  const { hacer, comunidades } = useComunidad();
  const perfil = usePerfil();
  const { avisar } = useUi();
  const [acepta, setAcepta] = useState(false);
  const [error, setError] = useState(null);
  if (!a) return null;
  const cuota = miCuota(a);
  const unirme = () => {
    const e = hacer({ type: 'unirse', id: a.id, persona: perfil, acepta });
    if (e) { setError(e); return; }
    avisar(`Te has unido: ${a.titulo}`);
    alCerrar(true);
  };
  return (
    <div className="gc-velo" role="presentation" onClick={() => alCerrar(false)}>
      <div className="gc-dialogo" role="dialog" aria-modal="true" aria-labelledby="gc-dlg-t" onClick={(e) => e.stopPropagation()}>
        <div className="tarj-h">
          <span className="ic">{emojiDe(a, comunidades)}</span>
          <h4 id="gc-dlg-t">{a.titulo}<small>Publicado por {a.autor.nombre} · {a.autor.curso}</small></h4>
          <button className="cerrar" aria-label="Cerrar" onClick={() => alCerrar(false)}><Icon n="cerrar" /></button>
        </div>
        <div className="lbl">Condiciones</div>
        <ul className="gc-condiciones">{condiciones(a).map((c) => <li key={c}>{c}</li>)}</ul>
        {a.tipo === 'padel' && (
          <p className="gc-cuota"><Icon n="euro" />{cuota ? <>Tu parte: <b>{euros(cuota)}</b>{a.padel.pago === 'perdedor' && ' solo si perdéis'}</> : <>Tú no pagas nada</>}<span className="demo-flag">en la demo no se cobra</span></p>
        )}
        <label className="gc-acepto">
          <input type="checkbox" checked={acepta} onChange={(e) => { setAcepta(e.target.checked); setError(null); }} />
          He revisado las condiciones y las acepto
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <p style={{ margin: '14px 0 0', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn" disabled={!acepta} onClick={unirme}>Unirme como {perfil.nombre.split(' ')[0]}</button>
          <button className="linkbtn" onClick={() => alCerrar(false)}>Ahora no</button>
        </p>
      </div>
    </div>
  );
}

/** Lista de anuncios con su diálogo de unirse. */
export function ListaAnuncios({ anuncios, vacio = 'No hay nada con esos filtros. ¡Crea tú el primero!' }) {
  const [abierto, setAbierto] = useState(null);
  if (!anuncios.length) return <p className="note gc-vacio">{vacio}</p>;
  return (
    <>
      <div className="gc-lista">{anuncios.map((a) => <TarjetaAnuncio key={a.id} a={a} alUnirse={setAbierto} />)}</div>
      <DialogoUnirse a={abierto} alCerrar={() => setAbierto(null)} />
    </>
  );
}
