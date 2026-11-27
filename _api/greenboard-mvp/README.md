# greenboard-mvp · API de la lista de prueba del MVP

Guarda quién se apunta desde `greenboard-team.github.io/mvp/` (QR de la diapositiva 9 del Sprint 2) y se la sirve a
la pantalla de clase `mvp/pantalla.html`. Es un Cloudflare Worker con un Durable Object; vive en la cuenta de
Cloudflare de Dmitrii y esta carpeta no la publica GitHub Pages (empieza por `_`).

URL: `https://greenboard-mvp.utad-study-connector.workers.dev`

| Método y ruta | Qué hace |
|---|---|
| `GET /lista` | `{plazas: 5, total, personas: [{n, id, nombre, avatar, ts, plaza}]}`. Sin correos. La pantalla la consulta cada 1,5 s. |
| `POST /apuntarse` | Cuerpo `{nombre, avatar (1-10), correo?, id?}`. Devuelve `{ok, n, plaza, id}`; si el `id` o el nombre ya estaban, el puesto que ya tenía (`repetido: true`). Máximo 80 personas. |
| `GET /lista?completo=1` | Igual que `/lista` pero con los correos. Cabecera `Authorization: Bearer <ADMIN_TOKEN>`. |
| `POST /reset` | Vacía la lista (para el ensayo y antes de la clase). Misma cabecera. |
| `POST /foto` | Cuerpo: la imagen (jpeg/png/webp, máx. 4 MB). Cabecera `X-Equipo: <EQUIPO_CODE>` (código corto que teclea el equipo en `mvp/foto.html`, o tecla U en `presentacion.html`). |
| `GET /foto` · `GET /foto/meta` | La foto del equipo tal cual, y `{hay, ts, tipo, bytes}`. La pantalla la comprueba cada 6 s y la pone de fondo con un velo verde. |
| `DELETE /foto` | Quita la foto. `Authorization: Bearer <ADMIN_TOKEN>`. |

Los 5 primeros tienen plaza; el resto sale como lista de espera. El orden es el de llegada al servidor.

## Datos reales de la app (`/mvp/`, solo alumnos de U-tad)

`src/cuentas.js`, en el mismo Worker, con su propio Durable Object (`Cuentas`). Todo va bajo `/app/` y pide la
cabecera `Authorization: Bearer <token>` de una sesión, salvo entrar. Sin sesión, la página pública no ve nada real.

| Método y ruta | Qué hace |
|---|---|
| `POST /app/entrar` | `{correo, codigo}`. El correo tiene que ser `@live.u-tad.com` (`DOMINIOS`). Con un código de `INVITE_CODES` devuelve `{token}`; cada código queda ligado al primer correo que lo usa. Sin código y con `RESEND_API_KEY` + `MAIL_FROM`, manda un enlace mágico (15 min, un uso). |
| `POST /app/verificar` | `{enlace}` del correo mágico -> `{token}`. |
| `GET /app/yo` · `POST /app/salir` | Tu correo, tus grupos y si tienes Blackboard conectado · cerrar sesión. |
| `GET /app/grupos` · `PUT /app/grupos` | Los grupos de WebUntis con clase · guardar los tuyos (1-8; puedes tener clase en varios grupos, p. ej. por optativas o cambio de titulación). |
| `GET /app/horario` | Tus clases de las próximas semanas (grupos juntos, sin duplicar) y sus cambios. |
| `GET /app/aulas?dia=AAAA-MM-DD&desde=HH:MM&hasta=HH:MM` | Aulas sin clase en ese hueco, y hasta qué hora siguen libres. |
| `PUT /app/blackboard` · `DELETE` | `{url}` del calendario de Blackboard (Calendario -> ⚙ -> Compartir calendario). Solo `https://u-tad.blackboard.com/webapps/calendar/calendarFeed/<token>/learn.ics`; se prueba antes de guardarlo. Es un secreto de cada alumno: no se registra en logs ni se devuelve nunca. |
| `GET /app/entregas` | Tu calendario de Blackboard leído en el momento, partido en entregas y eventos. |
| `GET /app/admin/codigos` | `Authorization: Bearer <ADMIN_TOKEN>`. Cada código vigente (enmascarado: `gb-x…`) con el correo que lo usa, sus grupos y su último acceso. |
| `DELETE /app/admin/usuario?correo=` | Misma cabecera. Borra los datos de esa persona (grupos, enlace de Blackboard), sus sesiones y la unión con su código. |

Los datos salen del pipeline de Dmitrii (repo privado *Estudios U-tad*): `python -m utad fetch-groups` exporta cada
día el horario de **todos** los grupos de WebUntis (3 semanas, con los cambios respecto a la exportación anterior)
a `groups.json`, y `rooms.json` ya tenía la ocupación de las aulas. Los dos se publican en su gist secreto, que el
Worker lee con el secreto `DATA_BASE`.

**Retirar el acceso a una persona:** quita su código de `INVITE_CODES` (`wrangler secret put` con la lista sin él). Sus
sesiones abiertas dejan de valer en la siguiente petición y el código ya no sirve para entrar. Para borrar además sus
datos: `DELETE /app/admin/usuario?correo=…`.

Secretos nuevos (una vez, antes del primer `wrangler deploy` con esto):

```bash
npx wrangler secret put DATA_BASE       # https://gist.githubusercontent.com/<usuario>/<gist>/raw (el GIST_BASE del conector)
npx wrangler secret put INVITE_CODES    # los 5 códigos de material/pro3alb/mvp-invite-codes.txt (fuera del repo), en una línea
# Solo si se activa el enlace mágico por correo (hace falta una cuenta de envío y un dominio verificado):
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put MAIL_FROM       # "Greenboard <hola@dominio-verificado>"
```

Probar en local: `.dev.vars` (no se sube) con `DATA_BASE=http://127.0.0.1:8790`, `INVITE_CODES=…` y
`BB_HOSTS=127.0.0.1:8790`, `npx wrangler dev --port 8787`, y abrir la página con `?api=http://127.0.0.1:8787`.
Tests de las funciones puras: `node --test test/cuentas.test.mjs`.

## Operar

Desde esta carpeta, con el `wrangler` del conector (`..\..\..\..\Desktop\Estudios U-tad\connector\node_modules\.bin\wrangler`)
o con `npx wrangler`:

```bash
npx wrangler deploy                       # publicar cambios de src/index.js
npx wrangler secret put ADMIN_TOKEN       # fijar o rotar el token (el actual está en material/pro3alb/mvp-admin-token.txt)
npx wrangler secret put EQUIPO_CODE       # código del equipo para subir la foto (mismo fichero)
npx wrangler tail                         # ver peticiones en directo
```

Vaciar la lista antes de la presentación (PowerShell):

```powershell
$t = Get-Content "C:\Users\Dmitrii\Desktop\Estudios U-tad\material\pro3alb\mvp-admin-token.txt"
Invoke-RestMethod -Method Post -Uri https://greenboard-mvp.utad-study-connector.workers.dev/reset -Headers @{Authorization="Bearer $t"}
```

Descargar la lista con correos después de la clase:

```powershell
Invoke-RestMethod -Uri "https://greenboard-mvp.utad-study-connector.workers.dev/lista?completo=1" -Headers @{Authorization="Bearer $t"} | ConvertTo-Json -Depth 4
```

## En clase

La presentación entera está en `mvp/presentacion.html`: las 22 diapositivas como imagen (la 4 con sus 12 clics,
la 8 con el vídeo) y la 9 es la pantalla en directo. Teclas: → / espacio / clic siguiente, ← anterior, F pantalla
completa, B pantalla en negro, 1-9 ir a esa diapositiva. Con eso Juan no cambia de ventana.


1. Abrir `https://greenboard-team.github.io/mvp/presentacion.html` en el navegador del PC del aula y pulsar `F`.
   Si se prefiere PowerPoint, `pantalla.html` sola sirve como diapositiva 9 (Alt+Tab al llegar).
2. Los que escanean entran en `/mvp/`, ponen nombre, eligen avatar y aparecen en la pantalla con animación.
3. Si la lista no responde, la pantalla sigue mostrando el QR y avisa abajo a la derecha en ámbar.
