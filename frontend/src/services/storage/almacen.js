/**
 * Acceso seguro a localStorage / sessionStorage (Safari en privado y algunos iframes lanzan excepciones).
 * Un único punto de entrada para toda la app: si mañana guardamos en el backend, se cambia aquí.
 */
function crear(tipo) {
  const zona = () => {
    try {
      return window[tipo];
    } catch {
      return null;
    }
  };
  return {
    leer(clave, porDefecto = null) {
      try {
        const v = zona()?.getItem(clave);
        return v == null ? porDefecto : JSON.parse(v);
      } catch {
        return porDefecto;
      }
    },
    leerTexto(clave) {
      try {
        return zona()?.getItem(clave) ?? null;
      } catch {
        return null;
      }
    },
    guardar(clave, valor) {
      try {
        zona()?.setItem(clave, typeof valor === 'string' ? valor : JSON.stringify(valor));
      } catch {
        /* sin almacenamiento: la demo sigue funcionando en memoria */
      }
    },
    borrar(clave) {
      try {
        zona()?.removeItem(clave);
      } catch {
        /* nada */
      }
    },
  };
}

export const local = crear('localStorage');
export const sesion = crear('sessionStorage');

export const CLAVES = {
  estadoDemo: 'gb-mvp2',
  token: 'gb-token',
  demo: 'gb-demo',
  api: 'gb-api',
  instalarCerrado: 'gb-instalar-cerrado',
  comunidad: 'gb-green-community-v1',
  perfil: 'gb-perfil',
};
