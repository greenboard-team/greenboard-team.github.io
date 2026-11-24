import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../common/Icon.jsx';
import { buscar, resaltar } from '../../domain/busqueda.js';
import { catalogo, chips } from '../../services/catalogoAcciones.js';
import { useAcademico } from '../../store/SesionContext.jsx';
import { useComunidad } from '../../store/ComunidadContext.jsx';
import { useUi } from '../../store/UiContext.jsx';
import { useAbrir } from '../../hooks/useAbrir.js';

function Resaltado({ t, q }) {
  return resaltar(t, q).map((p, i) => (p.m ? <mark key={i}>{p.t}</mark> : <span key={i}>{p.t}</span>));
}

/** La barra de Inicio (Ctrl+K o «/»): sugerencias en vivo, teclado y frases como «pádel viernes a las 19». */
export function BarraComandos() {
  const m = useAcademico();
  const comunidad = useComunidad();
  const { ui } = useUi();
  const abrir = useAbrir();
  const [q, setQ] = useState('');
  const [abierta, setAbierta] = useState(false);
  const [sel, setSel] = useState(0);
  const input = useRef(null);

  const acciones = useMemo(() => catalogo(m, comunidad), [m, comunidad]);
  const listaChips = chips(m, ui, comunidad);
  const opciones = q.trim()
    ? buscar(acciones, q).map((a) => ({ a, q }))
    : listaChips.map((c) => ({ a: acciones.find((x) => x.id === c.id), q: c.q, chip: c })).filter((o) => o.a);

  useEffect(() => {
    const atajo = (e) => {
      const enCampo = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !enCampo)) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener('keydown', atajo);
    return () => document.removeEventListener('keydown', atajo);
  }, []);

  const elegir = (i) => {
    const o = opciones[i];
    if (!o) return;
    setQ('');
    setAbierta(false);
    input.current?.blur();
    abrir(o.a, o.q);
  };

  const teclas = (e) => {
    if (e.key === 'ArrowDown') { setSel((s) => Math.min(s + 1, opciones.length - 1)); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { setSel((s) => Math.max(s - 1, 0)); e.preventDefault(); }
    else if (e.key === 'Enter') { elegir(sel); e.preventDefault(); }
    else if (e.key === 'Escape') { setQ(''); setAbierta(false); input.current?.blur(); }
  };

  return (
    <>
      <div className="cmd" id="cmd">
        <div className="cmd-box">
          <Icon n="buscar" />
          <input
            ref={input} id="q" type="search" autoComplete="off" value={q}
            placeholder="Busca o pide algo: «pachanga miércoles», «pádel viernes»"
            aria-label="Busca o pide algo" role="combobox" aria-expanded={abierta} aria-controls="sug"
            onFocus={() => { setSel(0); setAbierta(true); }}
            onBlur={() => setTimeout(() => setAbierta(false), 120)}
            onChange={(e) => { setQ(e.target.value); setSel(0); setAbierta(true); }}
            onKeyDown={teclas}
          />
          <span className="kbd">Ctrl K</span>
        </div>
        <div className="sug" id="sug" role="listbox" hidden={!abierta}>
          {!opciones.length ? (
            <p className="note" style={{ padding: 10 }}>Nada con «{q}». Prueba «pádel», «pachanga», «GTA», «aula» o una asignatura.</p>
          ) : (
            <>
              <div className="sug-h">{q.trim() ? 'Resultados' : 'Para ahora'}</div>
              {opciones.map((o, i) => (
                <button key={o.a.id + i} className="op" role="option" aria-selected={i === sel} onMouseDown={(e) => e.preventDefault()} onClick={() => elegir(i)}>
                  <span className="ic"><Icon n={o.a.ico} /></span>
                  <span className="tx"><b><Resaltado t={o.chip ? o.chip.t : o.a.t} q={q} /></b><small>{o.a.s}</small></span>
                  <span className="tipo">{o.a.tipo}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
      <div className="chips" id="chips" aria-label="Sugerencias para ahora">
        {listaChips.map((c) => (
          <button key={c.id} className={`chip ${c.rojo ? 'rojo' : ''}`} onClick={() => abrir(c, c.q)}>
            <Icon n={c.ico} />{c.t}{c.por && <span className="por"> · {c.por}</span>}
          </button>
        ))}
      </div>
    </>
  );
}
