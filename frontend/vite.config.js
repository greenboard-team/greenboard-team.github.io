import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// La app se publica en https://greenboard-team.github.io/mvp/ (GitHub Pages, rama main).
// `npm run build` deja el resultado en ../mvp sin borrar lo que comparte esa carpeta
// (presentacion.html, foto.html, pantalla.html, apuntarse/, deck/, qr…).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../mvp',
    emptyOutDir: false,
    assetsDir: 'assets',
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
