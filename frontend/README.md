# Greenboard · MVP en React (Sprint 3)

Código fuente de la app que se publica en **https://greenboard-team.github.io/mvp/**.
El prototipo de Dmitrii (#42) está portado entero a React + Vite, con **Green Community** como pestaña nueva.

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173  (abre #/demo para los datos de ejemplo)
npm test           # tests de la lógica (Vitest)
npm run lint       # ESLint
npm run build      # compila en ../mvp sin borrar lo que comparte esa carpeta
```

Después de `npm run build`, se hace commit de `mvp/index.html` y `mvp/assets/` y GitHub Pages lo publica.
No se toca nada más de `/mvp/`: presentacion.html, foto.html, pantalla.html, apuntarse/, deck/ y el QR siguen igual.

## Arquitectura

```
src/
├── domain/              Lógica pura, sin React ni navegador → se prueba con tests
│   ├── fechas.js, texto.js, notas.js, busqueda.js
│   ├── horario.js       huecos libres, solapes, franjas
│   └── comunidad/
│       ├── anuncios.js  Factory de anuncios, reglas para unirse, condiciones
│       ├── pagos.js     Strategy: a partes iguales / lo pago yo / paga quien pierda
│       └── torneos.js   bote, inscripción y cuadro de eliminatoria (octavos → final)
├── data/                JSON de ejemplo + universidad.json (configuración por universidad)
├── services/
│   ├── api/GreenboardApi.js        Facade del Worker (/app/*)
│   ├── adapters/webuntisAdapter.js Adapter: WebUntis/Blackboard → modelo de la app
│   ├── storage/almacen.js          acceso seguro a localStorage/sessionStorage
│   └── catalogoAcciones.js         catálogo de la barra de Inicio
├── repositories/        Repository: mismo modelo venga de la demo o de datos reales
│   ├── academicoRepository.js
│   └── comunidadRepository.js      hoy en localStorage; mañana, un backend
├── store/               Estado global: Context + useReducer (Observer)
│   ├── SesionContext.jsx   sesión, demo o datos reales
│   ├── UiContext.jsx       estado de la demo (tarjetas, justificante, chats…)
│   └── ComunidadContext.jsx Green Community
├── hooks/               useAbrir (barra), useInstalar (PWA), usePerfil
├── components/          piezas reutilizables por área (common, layout, inicio, asignaturas, mensajes, horario, community)
└── pages/               una pantalla por ruta (HashRouter: #/inicio, #/horario, #/community…)
```

**Reglas del proyecto**

- Las pantallas no contienen reglas de negocio: llaman a `domain/` o despachan acciones al store.
- El reducer de comunidad solo aplica cambios; si una regla falla (plazas, condiciones sin aceptar, torneo lleno) lanza un error y la pantalla lo enseña.
- Todo es inmutable: unirse, inscribirse o marcar un ganador devuelven un objeto nuevo.
- Para llevar Greenboard a otra universidad se cambia `data/universidad.json`: instalaciones (futbolín, tenis…), lugares, categorías y juegos.

## Patrones de diseño

| Patrón | Dónde | Para qué |
|---|---|---|
| Repository | `repositories/` | Las pantallas piden datos sin saber si vienen de la demo, del Worker o (más adelante) de un backend |
| Adapter | `services/adapters/webuntisAdapter.js` | Traduce WebUntis y Blackboard al modelo de la app |
| Facade | `services/api/GreenboardApi.js` | Un único punto de acceso a la API, con el token y los errores |
| Strategy | `domain/comunidad/pagos.js` | Cada modalidad de pago calcula la cuota y explica sus condiciones |
| Factory | `crearAnuncio()` y `TarjetaInicio` | Construye el objeto o el componente correcto según el tipo |
| Observer | `store/*Context.jsx` | Los componentes se suscriben al estado y se repintan solos |

## Green Community

- **Fútbol sala**: pachangas en la cancha de U-tad; eliges la franja sobre tu horario y cuántos buscas.
- **Pádel** (5 € la pista): busco compañero, somos 2 y buscamos rivales, o busco 3. El pago puede ser a partes iguales, lo paga quien publica o paga quien pierda. Quien se une revisa y acepta las condiciones.
- **Torneos de la universidad**: 4, 8 o 16 equipos, premio (dinero, tarjeta regalo o material) y cuota de inscripción que alimenta el bote. Cuadro de eliminatoria. Con «Ver como: Universidad» se crean torneos, se sortea el cuadro y se marcan los ganadores.
- **Planes**: videojuegos (con comunidad destacada de GTA VI: modo historia, online, misiones, golpes, carreras, en casa de alguien), arte, estudio y quedadas, con categoría y ubicación (online, aula, cafetería, fuera).
- **Horario**: la pestaña Horario pinta en tus huecos los planes que caben, y te unes desde ahí.

Todo lo de Green Community es de ejemplo y se guarda en el navegador. En la demo no se cobra nada.

## Moderación (sin que Secretaría lo revise todo)

Todo anuncio pasa por `services/moderacion/moderadores.js` antes de publicarse, en capas:

1. **Filtro local** (`domain/moderacion/reglas.js` + `data/moderacion.json`): instantáneo y sin red. Normaliza trucos («F0LLA», «fooolla», «f o l l a»), bloquea lo evidente mientras escribes (sexual, insultos, odio, drogas) y manda a revisión lo dudoso (apuestas, alcohol, desnudos artísticos, teléfonos). La universidad edita la lista en el JSON.
2. **Modelo propio** (`modelo/` → `src/data/modeloModeracion.json`, ~220 KB): n-gramas de caracteres + TF-IDF + regresión logística entrenados por el equipo con scikit-learn. Entiende frases que una lista no ve («vamos a reírnos de Hugo», «traed algo para fumar, ya me entendéis») y aguanta trucos («m4tar»). Va dentro de la app: sin servidor, sin descargas, al instante (también avisa mientras escribes). La app replica la inferencia en JS y un test comprueba que da las mismas probabilidades que Python.
   ```bash
   cd frontend/modelo && pip install scikit-learn && python entrenar.py   # reentrena y evalúa
   ```
   Evaluación con plantillas que no vio al entrenar: 76 % de acierto, 0 planes normales bloqueados por error. Los datos son sintéticos: para producción se reentrena con los anuncios que revise Vida universitaria.
   (Opcional) un LLM en un servidor de la universidad (Ollama + Qwen) con `llm.activo` en `data/moderacion.json`.
3. **Revisión humana solo de lo dudoso**: lo marcado y lo que denuncian los alumnos (botón «Denunciar») llega a `#/community/moderacion`. Lo demás se publica solo. Los nombres de equipos de los torneos pasan el mismo filtro.

El LLM opcional iría en un servidor de la universidad (o en el Worker), no en el portátil de cada alumno; el modelo propio ya va dentro de la app.
