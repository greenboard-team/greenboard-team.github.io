/**
 * Patrón Facade: un único cliente para el Worker greenboard-mvp (/app/*).
 * Las pantallas no saben de fetch, cabeceras ni tokens: llaman a métodos con nombre.
 */
export class ErrorApi extends Error {
  constructor(codigo, datos = {}, estado = 0) {
    super(codigo);
    this.codigo = codigo;
    this.datos = datos;
    this.estado = estado;
  }
}

export class GreenboardApi {
  /**
   * @param {string} base URL del Worker
   * @param {() => string|null} token función que devuelve el token actual
   * @param {() => void} alCaducar se llama si el Worker dice que la sesión ya no vale
   */
  constructor(base, token, alCaducar = () => {}) {
    this.base = base;
    this.token = token;
    this.alCaducar = alCaducar;
  }

  async pedir(ruta, { method = 'GET', body } = {}) {
    const t = this.token();
    const r = await fetch(this.base + '/app' + ruta, {
      method,
      headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401 && j.error === 'sesion') {
      this.alCaducar();
      throw new ErrorApi('sesion', j, 401);
    }
    if (!r.ok) throw new ErrorApi(j.error || 'http', j, r.status);
    return j;
  }

  entrar(correo, codigo) { return this.pedir('/entrar', { method: 'POST', body: { correo, codigo } }); }
  verificar(enlace) { return this.pedir('/verificar', { method: 'POST', body: { enlace } }); }
  yo() { return this.pedir('/yo'); }
  horario() { return this.pedir('/horario'); }
  entregas() { return this.pedir('/entregas'); }
  grupos() { return this.pedir('/grupos'); }
  asignaturas(grupos) { return this.pedir(`/asignaturas?grupos=${encodeURIComponent(grupos.join(','))}`); }
  guardarGrupos(grupos, materias = {}, elegidas = false) { return this.pedir('/grupos', { method: 'PUT', body: { grupos, materias, elegidas } }); }
  conectarBlackboard(url) { return this.pedir('/blackboard', { method: 'PUT', body: { url } }); }
  quitarBlackboard() { return this.pedir('/blackboard', { method: 'DELETE' }); }
  aulasLibres(dia, desde, hasta) { return this.pedir(`/aulas?dia=${dia}&desde=${desde}&hasta=${hasta}`); }

  salir() {
    const t = this.token();
    if (t) fetch(this.base + '/app/salir', { method: 'POST', headers: { Authorization: 'Bearer ' + t } }).catch(() => {});
  }
}
