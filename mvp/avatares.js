// Diez avatares de Greenboard, en SVG, para la lista de prueba del MVP.
// Uso: avatarSVG(n, tamañoPx) -> cadena SVG. n va de 1 a 10. Mismo fichero en la página de registro y en la pantalla.
// Estilo: ilustración plana y amable. Cada avatar es un círculo pastel con un personaje distinto (piel, pelo,
// complementos). Pensado para leerse a 40 px en la lista y a 140 px en la pantalla proyectada.
(function () {
  const TINTA = "#262833"; // ojos, bocas, gafas: mismo color y grosor en los diez

  // Paleta: fondo pastel (armoniza con el verde #123B2C y con blanco; el lima de marca aparece una sola vez),
  // piel, pelo, ropa y, si hace falta, un color de complemento (gorra, cascos, pañuelo, gorro).
  const AVATARES = [
    { nombre: "Nube",   fondo: "#BFD8F7", piel: "#7A4A2E", pelo: "#1E1510", ropa: "#F2A33A", peinado: "afro",    ojos: "puntos",  boca: "sonrisa", rubor: "suave", orejas: false },
    { nombre: "Lima",   fondo: "#9BE15D", piel: "#E8B88A", pelo: "#6B4226", ropa: "#2F5D50", peinado: "mono",    ojos: "puntos",  boca: "pequena", rubor: "si",    extra: "gafas" },
    { nombre: "Tiza",   fondo: "#FFD3B4", piel: "#F6D3B5", pelo: "#4A3324", ropa: "#3E6FB5", peinado: "corto",   ojos: "puntos",  boca: "risa",    rubor: "si",    extra: "barba" },
    { nombre: "Pixel",  fondo: "#DCCBF4", piel: "#C98A5E", pelo: "#241A14", ropa: "#F0B74A", peinado: "gorra",   ojos: "puntos",  boca: "ladeada", rubor: "si",    acc: "#2E5E8C" },
    { nombre: "Menta",  fondo: "#B9EBC6", piel: "#F8DCC4", pelo: "#B5542D", ropa: "#D9637A", peinado: "largo",   ojos: "puntos",  boca: "sonrisa", rubor: "si",    extra: "pecas" },
    { nombre: "Eco",    fondo: "#FFE59A", piel: "#5A3620", pelo: "#141010", ropa: "#3B6FD9", peinado: "rapado",  ojos: "felices", boca: "pequena", rubor: "suave", extra: "cascos", acc: "#ECE8DF" },
    { nombre: "Brisa",  fondo: "#F9C6DC", piel: "#F2C9A2", pelo: "#1A1A1E", ropa: "#4F8A6B", peinado: "coleta",  ojos: "felices", boca: "risa",    rubor: "si" },
    { nombre: "Sol",    fondo: "#C9CFF5", piel: "#EFC19B", pelo: "#E3AE3A", ropa: "#E07A5F", peinado: "melena",  ojos: "puntos",  boca: "sonrisa", rubor: "si",    orejas: false },
    { nombre: "Luna",   fondo: "#F9B8AE", piel: "#B8794F", pelo: "#2A1A14", ropa: "#1F4F4C", peinado: "hiyab",   ojos: "puntos",  boca: "sonrisa", rubor: "si",    acc: "#2C6E6A", orejas: false },
    { nombre: "Chispa", fondo: "#AEE4E8", piel: "#F4CFB4", pelo: "#B0471F", ropa: "#E0556B", peinado: "gorro",   ojos: "puntos",  boca: "ooh",     rubor: "si",    acc: "#3D5A80", orejas: false },
  ];

  function oscurecer(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
    return "#" + ((1 << 24) + (c((n >> 16) & 255) << 16) + (c((n >> 8) & 255) << 8) + c(n & 255)).toString(16).slice(1);
  }

  // Contorno "nube": elipse con bultos redondeados (rizos, afro).
  function nube(cx, cy, rx, ry, n, k) {
    let d = "";
    for (let i = 0; i <= n; i++) {
      const t = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const px = (cx + rx * Math.cos(t)).toFixed(1), py = (cy + ry * Math.sin(t)).toFixed(1);
      if (i === 0) { d = `M${px} ${py}`; continue; }
      const tm = t - Math.PI / n;
      const qx = (cx + rx * (1 + k) * Math.cos(tm)).toFixed(1), qy = (cy + ry * (1 + k) * Math.sin(tm)).toFixed(1);
      d += `Q${qx} ${qy} ${px} ${py}`;
    }
    return d + "Z";
  }

  // Geometría común. Cabeza centrada en x=50: frente en y=27, mentón en y=75.5, mejillas en x=28..72.
  const CARA   = "M50 27C62 27 72 37 72 50C72 60 66 70 58 73.5C53 75.5 47 75.5 42 73.5C34 70 28 60 28 50C28 37 38 27 50 27Z";
  const CUELLO = "M42 62H58V84H42Z";
  const CUERPO = "M2 100C5 86 18 80 36 79C40 84 45 86 50 86C55 86 60 84 64 79C82 80 95 86 98 100Z";
  // Casquete de pelo: empieza en (26,52), rodea la cabeza y vuelve a (74,52). Cada peinado añade su línea de nacimiento.
  const CASCO  = "M26 52C26 35 36 23 50 23C64 23 74 35 74 52";

  // Cada peinado devuelve { atras, delante }: lo que va detrás de la cara y lo que va encima.
  const PEINADOS = {
    afro: (p) => ({
      atras: `<path d="${nube(50, 41, 30, 26, 11, 0.28)}" fill="${p}"/>`,
      delante: `<path d="M26 54C26 36 35 23 50 23C65 23 74 36 74 54Q72 42 65 42Q60 47 55 42Q50 47 45 42Q40 47 35 42Q28 42 26 54Z" fill="${p}"/>`,
    }),
    mono: (p) => ({
      atras: "",
      delante: `<path d="${CASCO}C73 43 66 38 57 39C53 36 47 36 43 39C34 38 27 43 26 52Z" fill="${p}"/>` +
               `<ellipse cx="50" cy="18.5" rx="9.5" ry="9" fill="${p}"/>`,
    }),
    corto: (p) => ({
      atras: "",
      delante: `<path d="M26 52C26 35 36 23 50 23C56 22.5 61 23 65 26C72 31 74 42 74 52C74 45 69 40 62 40C56 38 50 42 46 40C40 38 33 40 29 45C27.5 47 26 50 26 52Z" fill="${p}"/>`,
    }),
    gorra: (p, acc) => ({
      atras: "",
      delante: `<path d="M26 56C26 44 36 34 50 34C64 34 74 44 74 56C73 48 66 46 60 46L40 46C34 46 27 48 26 56Z" fill="${p}"/>` +
               `<path d="M25 45C25 29 36 20 50 20C64 20 75 29 75 45Z" fill="${acc}"/>` +
               `<path d="M50 20.5V44" stroke="${oscurecer(acc, 0.8)}" stroke-width="1.4"/>` +
               `<path d="M24 44.5C36 40.5 64 40.5 76 44.5L89 48C91 50 89.5 53.5 86 52.5L76 50C64 47 36 47 25 49C22 49.3 21.5 45.5 24 44.5Z" fill="${oscurecer(acc, 0.8)}"/>` +
               `<circle cx="50" cy="20.5" r="2.2" fill="${oscurecer(acc, 0.8)}"/>`,
    }),
    largo: (p) => ({
      atras: `<path d="M21 88C21 72 20 58 20 50C20 33 33 23 50 23C67 23 80 33 80 50C80 58 79 72 79 88C77 92 69 92 67 88L67 72C67 64 62 62 50 62C38 62 33 64 33 72L33 88C31 92 23 92 21 88Z" fill="${p}"/>`,
      delante: `<path d="${CASCO}C72 44 64 35 52 34L50 33L48 34C36 35 28 44 26 52Z" fill="${p}"/>`,
    }),
    rapado: (p) => ({
      atras: "",
      delante: `<path d="M27 52C27 36 36 25 50 25C64 25 73 36 73 52C72 46 66 41.5 60 41L40 41C34 41.5 28 46 27 52Z" fill="${p}"/>`,
    }),
    coleta: (p, acc, ropa) => ({
      atras: `<path d="M56 27C64 15 80 17 83 30C86 44 82 62 74 72C77 58 75 46 69 38C65 32 60 30 56 27Z" fill="${p}"/>`,
      delante: `<path d="${CASCO}C74 44 71 37 64 35C55 33 44 44 37 46C32 47.5 28 50 26 52Z" fill="${p}"/>` +
               `<ellipse cx="68" cy="21.5" rx="3.4" ry="2.6" transform="rotate(35 68 21.5)" fill="${ropa}"/>`,
    }),
    melena: (p) => ({
      atras: `<path d="M22 56C20 36 32 22 50 22C68 22 80 36 78 56C78 68 74 76 66 77.5L34 77.5C26 76 22 68 22 56Z" fill="${p}"/>`,
      delante: `<path d="${CASCO}L73 47.5C71 42.5 66 41.5 60 42.5L40 43.5C34 43 29 43.5 27 47.5Z" fill="${p}"/>`,
    }),
    hiyab: (p, acc) => ({
      atras: `<path d="M-2 100C4 82 12 66 22 56L78 56C88 66 96 82 102 100Z" fill="${oscurecer(acc, 0.82)}"/>`,
      delante: `<path fill-rule="evenodd" d="M50 19C67 19 81 32 81 50C81 72 70 87 50 89C30 87 19 72 19 50C19 32 33 19 50 19ZM50 35C62 35 70.5 43 70.5 53C70.5 65 62 74.5 50 76C38 74.5 29.5 65 29.5 53C29.5 43 38 35 50 35Z" fill="${acc}"/>` +
               `<path d="M50 35C62 35 70.5 43 70.5 53C70.5 65 62 74.5 50 76C38 74.5 29.5 65 29.5 53C29.5 43 38 35 50 35Z" fill="none" stroke="${oscurecer(acc, 1.25)}" stroke-width="2.6"/>`,
    }),
    gorro: (p, acc) => ({
      atras: "",
      delante: `<path d="M23 49C18 52 17 58 20 62C22 65 26 65 28 62C31 64 33 60 31 57L31 49Z" fill="${p}"/>` +
               `<path d="M77 49C82 52 83 58 80 62C78 65 74 65 72 62C69 64 67 60 69 57L69 49Z" fill="${p}"/>` +
               `<path d="M23 46C22 30 34 16 52 17C66 18 78 28 77 46Z" fill="${acc}"/>` +
               `<rect x="21" y="38" width="58" height="11.5" rx="5.5" fill="${oscurecer(acc, 0.82)}"/>` +
               `<circle cx="53" cy="15" r="6.5" fill="#F6EBD9"/>`,
    }),
  };

  const OJOS = {
    puntos:  `<circle cx="41" cy="52.5" r="2.7" fill="${TINTA}"/><circle cx="59" cy="52.5" r="2.7" fill="${TINTA}"/>`,
    felices: `<path d="M37 53.5Q41 48.5 45 53.5M55 53.5Q59 48.5 63 53.5" fill="none" stroke="${TINTA}" stroke-width="2.6" stroke-linecap="round"/>`,
  };
  const BOCAS = {
    sonrisa: `<path d="M43 64.5Q50 71.5 57 64.5" fill="none" stroke="${TINTA}" stroke-width="2.6" stroke-linecap="round"/>`,
    pequena: `<path d="M45.5 65Q50 69.5 54.5 65" fill="none" stroke="${TINTA}" stroke-width="2.6" stroke-linecap="round"/>`,
    ladeada: `<path d="M44 65.5Q50 70.5 57 64.5" fill="none" stroke="${TINTA}" stroke-width="2.6" stroke-linecap="round"/>`,
    risa:    `<path d="M42 64C44 73.5 56 73.5 58 64Z" fill="${TINTA}"/><path d="M44.5 64.5H55.5C55 67.5 53 68 50 68C47 68 45 67.5 44.5 64.5Z" fill="#fff"/>`,
    ooh:     `<ellipse cx="50" cy="66.5" rx="3" ry="3.6" fill="${TINTA}"/>`,
  };

  function extras(tipo, a) {
    switch (tipo) {
      case "gafas":
        return `<g fill="#fff" fill-opacity=".22" stroke="${TINTA}" stroke-width="2.2" stroke-linecap="round">` +
               `<circle cx="41.5" cy="52.5" r="7.5"/><circle cx="58.5" cy="52.5" r="7.5"/>` +
               `<path d="M49 52.5H51M34 51.5L28 50M66 51.5L72 50" fill="none"/></g>`;
      case "cascos":
        return `<path d="M25 52C25 31 36 21 50 21C64 21 75 31 75 52" fill="none" stroke="${a.acc}" stroke-width="4.5" stroke-linecap="round"/>` +
               `<rect x="18.5" y="44" width="11" height="17" rx="5" fill="${a.acc}"/><rect x="70.5" y="44" width="11" height="17" rx="5" fill="${a.acc}"/>` +
               `<rect x="21" y="47" width="6" height="11" rx="3" fill="${oscurecer(a.acc, 0.8)}"/><rect x="73" y="47" width="6" height="11" rx="3" fill="${oscurecer(a.acc, 0.8)}"/>`;
      case "pecas": {
        const c = oscurecer(a.piel, 0.72);
        return `<g fill="${c}" opacity=".85"><circle cx="35" cy="58.5" r="1.1"/><circle cx="38.5" cy="61.5" r="1.1"/><circle cx="33.5" cy="62.5" r="1"/>` +
               `<circle cx="65" cy="58.5" r="1.1"/><circle cx="61.5" cy="61.5" r="1.1"/><circle cx="66.5" cy="62.5" r="1"/></g>`;
      }
      default:
        return "";
    }
  }

  function avatarSVG(n, size) {
    const i = Math.min(Math.max(Number(n) || 1, 1), AVATARES.length) - 1;
    const a = AVATARES[i];
    const sombra = oscurecer(a.piel, 0.8);
    const cejas = (a.pelo === "#141010" || a.pelo === "#1A1A1E" || a.pelo === "#1E1510") ? "#2A2A2E" : oscurecer(a.pelo, 0.9);
    const peinado = PEINADOS[a.peinado](a.pelo, a.acc, a.ropa);
    const id = "gbav" + (i + 1) + "_" + String(size || "a").replace(/[^A-Za-z0-9]/g, "_");

    const cuerpo = `<path d="${CUERPO}" fill="${a.ropa}"/>`;
    const cuello = `<path d="${CUELLO}" fill="${sombra}"/>`;
    const orejas = a.orejas === false ? "" :
      `<ellipse cx="27" cy="52" rx="4.6" ry="5.6" fill="${a.piel}"/><ellipse cx="73" cy="52" rx="4.6" ry="5.6" fill="${a.piel}"/>` +
      `<circle cx="25.6" cy="52.6" r="1.9" fill="${sombra}" opacity=".55"/><circle cx="74.4" cy="52.6" r="1.9" fill="${sombra}" opacity=".55"/>`;
    const cara = `<path d="${CARA}" fill="${a.piel}"/>`;
    const barba = a.extra === "barba" ?
      `<path d="M27 52C27 63 33 73 41.5 76.5C47 78.8 53 78.8 58.5 76.5C67 73 73 63 73 52C72 59 67 63 61 63.5C57 61.5 43 61.5 39 63.5C33 63 28 59 27 52Z" fill="${a.pelo}"/>` : "";
    const rubor = a.rubor === "suave" ?
      `<g fill="#FF6B6B" opacity=".22"><ellipse cx="37" cy="60.5" rx="4" ry="2.4"/><ellipse cx="63" cy="60.5" rx="4" ry="2.4"/></g>` :
      `<g fill="#F06A6A" opacity=".38"><ellipse cx="37" cy="60.5" rx="4" ry="2.4"/><ellipse cx="63" cy="60.5" rx="4" ry="2.4"/></g>`;
    const rasgos =
      `<path d="M37 46.5Q41 43.5 45 46.5M55 46.5Q59 43.5 63 46.5" fill="none" stroke="${cejas}" stroke-width="2.2" stroke-linecap="round"/>` +
      OJOS[a.ojos] +
      `<path d="M50.5 54C52.5 57.5 52.5 60 49 60.5" fill="none" stroke="${sombra}" stroke-width="2" stroke-linecap="round"/>` +
      rubor + (a.extra === "pecas" ? extras("pecas", a) : "") + BOCAS[a.boca];
    const encima = (a.extra === "gafas" || a.extra === "cascos") ? extras(a.extra, a) : "";

    const s = size ? ` width="${size}" height="${size}"` : "";
    return `<svg viewBox="0 0 100 100"${s} role="img" aria-label="Avatar ${a.nombre}" xmlns="http://www.w3.org/2000/svg">` +
      `<circle cx="50" cy="50" r="50" fill="${a.fondo}"/>` +
      `<clipPath id="${id}"><circle cx="50" cy="50" r="50"/></clipPath><g clip-path="url(#${id})">` +
      cuerpo + peinado.atras + cuello + orejas + cara + barba + rasgos + peinado.delante + encima +
      `</g></svg>`;
  }

  window.AVATARES = AVATARES;
  window.avatarSVG = avatarSVG;
})();
