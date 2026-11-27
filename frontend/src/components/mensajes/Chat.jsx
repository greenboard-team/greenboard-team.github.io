import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import { useAcademico } from '../../store/SesionContext.jsx';
import { useUi } from '../../store/UiContext.jsx';
import { useAbrir } from '../../hooks/useAbrir.js';
import { revisarAlMomento } from '../../services/moderacion/moderadores.js';

export function mensajesDe(chat, propios = []) {
  return [...chat.msgs, ...propios];
}

/** Conversación con caja para escribir. Tus mensajes se quedan en este navegador. */
export function Chat({ id }) {
  const m = useAcademico();
  const { ui, dispatch } = useUi();
  const [texto, setTexto] = useState('');
  const bloqueado = texto.trim().length > 3 && revisarAlMomento(texto).veredicto === 'bloquear';
  const caja = useRef(null);
  const c = m.chats.find((x) => x.id === id);
  const msgs = c ? mensajesDe(c, ui.chats[id]) : [];

  useEffect(() => { dispatch({ type: 'leido', id }); }, [id, dispatch]);
  useEffect(() => { if (caja.current) caja.current.scrollTop = caja.current.scrollHeight; }, [msgs.length]);

  if (!c) return null;
  const enviar = (e) => {
    e.preventDefault();
    const t = texto.trim();
    if (!t || bloqueado) return;
    const h = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    dispatch({ type: 'mensaje', id, msg: { de: 'Tú', h, txt: t, yo: true } });
    setTexto('');
  };
  return (
    <>
      <div className="chat" ref={caja}>
        {msgs.map((x, i) => (
          <div key={i} className={`msg ${x.yo ? 'yo' : ''}`}>
            {!x.yo && <b>{x.de}</b>}
            <p>{x.txt}</p>
            <small>{x.h}</small>
          </div>
        ))}
      </div>
      <form className="enviarmsg" onSubmit={enviar}>
        <input value={texto} onChange={(e) => setTexto(e.target.value)} autoComplete="off" placeholder="Escribe un mensaje" aria-label={`Mensaje para ${c.t}`} />
        <button className="btn sm" aria-label="Enviar" disabled={bloqueado}>Enviar</button>
      </form>
      {bloqueado && <p className="gc-moderacion bloquea" role="status" style={{ marginTop: 8 }}>Ese mensaje no se puede enviar en un chat de la universidad.</p>}
    </>
  );
}

/** Lista de chats. En una tarjeta de Inicio se abren allí; en Mensajes, en su pantalla. */
export function ListaChats({ enTarjeta }) {
  const m = useAcademico();
  const { ui } = useUi();
  const navigate = useNavigate();
  const abrir = useAbrir();
  return m.chats.map((c) => {
    const nl = ui.leidos[c.id] ? 0 : c.sinLeer;
    const ult = mensajesDe(c, ui.chats[c.id]).slice(-1)[0];
    return (
      <button key={c.id} className="fila fila-e fila-chat" onClick={() => (enTarjeta ? abrir('chat-' + c.id) : navigate('/msg/' + c.id))}>
        <span className="ic"><Icon n="uni" /></span>
        <div><b>{c.t}</b><small>{ult.yo ? 'Tú: ' : ult.de + ': '}{ult.txt}</small></div>
        {nl ? <span className="pill late">{nl}</span> : <span className="note">{c.n} pers.</span>}
      </button>
    );
  });
}
