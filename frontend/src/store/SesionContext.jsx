import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GreenboardApi } from '../services/api/GreenboardApi.js';
import { urlApi } from '../config/api.js';
import { local, sesion, CLAVES } from '../services/storage/almacen.js';
import { academicoDemo, academicoReal } from '../repositories/academicoRepository.js';

/**
 * Sesión y datos académicos.
 * - Sin sesión y fuera de la demo: solo se puede entrar.
 * - Con #demo (o «Ver la demo»): datos de ejemplo.
 * - Con token: datos reales del Worker (WebUntis + Blackboard).
 */
const Ctx = createContext(null);

const enlaceMagico = () => window.location.hash.match(/entrar=([A-Za-z0-9_-]{20,})/)?.[1] ?? null;
/** La demo se pide con #demo / ?demo y se recuerda en la sesión del navegador, para que recargar no la pierda. */
function pideDemo() {
  if (/(^|[#&?/])demo\b/.test(window.location.hash + window.location.search)) sesion.guardar(CLAVES.demo, '1');
  return !!sesion.leerTexto(CLAVES.demo);
}

export const ERR_ENTRAR = {
  correo: 'Tiene que ser tu correo de alumno de U-tad (@live.u-tad.com).',
  codigo: 'Ese código de invitación no es válido.',
  'codigo-usado': 'Ese código ya lo está usando otra persona.',
  espera: 'Demasiados intentos. Prueba dentro de un rato.',
  'sin-correo': 'Para entrar hace falta el código de invitación que te ha dado el equipo.',
  envio: 'No hemos podido mandarte el correo. Prueba otra vez.',
};

export function SesionProvider({ children }) {
  const [token, setToken] = useState(() => local.leerTexto(CLAVES.token));
  const [demo, setDemo] = useState(pideDemo);
  const [carga, setCarga] = useState(null); // null | 'cargando' | 'error' | 'grupos'
  const [real, setReal] = useState(null); // modelo académico real
  const [puerta, setPuerta] = useState({});
  const [enlaceInicial] = useState(enlaceMagico); // se lee antes de que el router toque el hash
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const olvidar = useCallback(() => {
    local.borrar(CLAVES.token);
    setToken(null);
    setReal(null);
    setCarga(null);
  }, []);

  const api = useMemo(() => new GreenboardApi(urlApi(), () => tokenRef.current, olvidar), [olvidar]);

  const cargar = useCallback(async () => {
    setCarga('cargando');
    try {
      const yo = await api.yo();
      if (!yo.grupos.length) {
        setReal(academicoReal(yo, { sesiones: [], cambios: [], grupos: [], generado: Date.now() }, null));
        setCarga('grupos');
        return;
      }
      let bbError = null;
      const [h, bb] = await Promise.all([
        api.horario(),
        yo.blackboard ? api.entregas().catch((e) => { bbError = e.datos?.motivo || e.message; return null; }) : null,
      ]);
      setReal(academicoReal(yo, h, bb, bbError));
      setCarga(null);
    } catch (e) {
      if (e.message !== 'sesion') setCarga('error');
    }
  }, [api]);

  // Arranque: enlace mágico del correo, sesión guardada o demo
  useEffect(() => {
    const enlace = enlaceInicial;
    if (enlace) {
      history.replaceState(null, '', location.pathname + location.search + '#/inicio');
      api.verificar(enlace)
        .then((r) => { local.guardar(CLAVES.token, r.token); setToken(r.token); tokenRef.current = r.token; cargar(); })
        .catch(() => setPuerta({ error: 'Ese enlace ya no vale (dura 15 minutos y sirve una vez). Pide otro.' }));
      return;
    }
    if (!demo && token) cargar();
    // Solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entrar = useCallback(async (correo, codigo) => {
    setPuerta({ correo, enviando: true });
    try {
      const r = await api.entrar(correo, codigo);
      if (r.token) {
        local.guardar(CLAVES.token, r.token);
        tokenRef.current = r.token;
        setToken(r.token);
        setPuerta({});
        await cargar();
        return;
      }
      setPuerta({ correo, ok: `Te hemos mandado un enlace a ${correo}. Ábrelo en este dispositivo (vale 15 minutos).` });
    } catch (e) {
      setPuerta({ correo, error: ERR_ENTRAR[e.message] || 'No se ha podido entrar. Prueba otra vez.' });
    }
  }, [api, cargar]);

  const salir = useCallback(() => { api.salir(); olvidar(); }, [api, olvidar]);
  const verDemo = useCallback(() => { sesion.guardar(CLAVES.demo, '1'); setDemo(true); }, []);
  const dejarDemo = useCallback(() => { sesion.borrar(CLAVES.demo); setDemo(false); }, []);

  const guardarGrupos = useCallback(async (grupos, materias = {}, elegidas = false) => { await api.guardarGrupos(grupos, materias, elegidas); await cargar(); }, [api, cargar]);
  const conectarBB = useCallback(async (url) => { const r = await api.conectarBlackboard(url); await cargar(); return r; }, [api, cargar]);
  const quitarBB = useCallback(async () => { await api.quitarBlackboard().catch(() => {}); await cargar(); }, [api, cargar]);

  const academico = useMemo(() => (demo ? academicoDemo() : real), [demo, real]);
  const puertaAbierta = demo || (!!token && !!real && carga !== 'grupos');

  const valor = useMemo(() => ({
    api, token, demo, carga, puerta, academico, puertaAbierta,
    entrar, salir, verDemo, dejarDemo, cargar, guardarGrupos, conectarBB, quitarBB,
  }), [api, token, demo, carga, puerta, academico, puertaAbierta, entrar, salir, verDemo, dejarDemo, cargar, guardarGrupos, conectarBB, quitarBB]);

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useSesion() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSesion fuera de SesionProvider');
  return c;
}

/** Atajo: el modelo académico (demo o real). Solo se usa dentro de pantallas con la puerta abierta. */
export const useAcademico = () => useSesion().academico;
