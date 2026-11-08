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

Los 5 primeros tienen plaza; el resto sale como lista de espera. El orden es el de llegada al servidor.

## Operar

Desde esta carpeta, con el `wrangler` del conector (`..\..\..\..\Desktop\Estudios U-tad\connector\node_modules\.bin\wrangler`)
o con `npx wrangler`:

```bash
npx wrangler deploy                       # publicar cambios de src/index.js
npx wrangler secret put ADMIN_TOKEN       # fijar o rotar el token (el actual está en material/pro3alb/mvp-admin-token.txt)
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
