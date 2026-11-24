// Tras `vite build`, borra de ../mvp/assets los ficheros de builds anteriores que ya no usa index.html
// (la carpeta no se vacía entera porque /mvp comparte espacio con la presentación y el formulario del QR).
import { readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const mvp = new URL('../../mvp/', import.meta.url).pathname;
const assets = join(mvp, 'assets');
const vivos = new Set();
const pendientes = ['index.html'];
while (pendientes.length) {
  const f = pendientes.pop();
  const texto = readFileSync(join(mvp, f), 'utf8');
  for (const [, nombre] of texto.matchAll(/assets\/([\w.-]+\.(?:js|css))/g)) {
    if (!vivos.has(nombre)) { vivos.add(nombre); pendientes.push('assets/' + nombre); }
  }
  for (const [, nombre] of texto.matchAll(/["'`]\.\/([\w.-]+\.(?:js|css))["'`]/g)) {
    if (!vivos.has(nombre)) { vivos.add(nombre); pendientes.push('assets/' + nombre); }
  }
}
for (const f of readdirSync(assets)) if (!vivos.has(f)) { rmSync(join(assets, f)); console.log('borrado', f); }
