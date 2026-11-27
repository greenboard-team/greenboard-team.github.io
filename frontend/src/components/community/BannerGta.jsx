/**
 * Banner original para la comunidad de GTA VI (atardecer, palmeras y rejilla retro con el sello de U-tad).
 * No usa arte oficial del juego: si queréis una imagen propia, se cambia aquí.
 */
export default function BannerGta({ alto = 180 }) {
  return (
    <svg className="banner-gta" viewBox="0 0 800 220" preserveAspectRatio="xMinYMin slice" style={{ height: alto }} role="img" aria-label="Atardecer con palmeras: comunidad de GTA VI de U-tad">
      <defs>
        <linearGradient id="gta-cielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2B1055" />
          <stop offset=".45" stopColor="#D53F8C" />
          <stop offset=".8" stopColor="#FF9A5A" />
          <stop offset="1" stopColor="#FFD27A" />
        </linearGradient>
        <linearGradient id="gta-sol" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE08A" />
          <stop offset="1" stopColor="#FF5E7E" />
        </linearGradient>
        <linearGradient id="gta-suelo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1A0B33" />
          <stop offset="1" stopColor="#0B0518" />
        </linearGradient>
        <clipPath id="gta-sol-clip"><rect x="0" y="0" width="800" height="150" /></clipPath>
      </defs>
      <rect width="800" height="220" fill="url(#gta-cielo)" />
      <g clipPath="url(#gta-sol-clip)">
        <circle cx="560" cy="140" r="78" fill="url(#gta-sol)" />
        {[104, 116, 127, 137, 146].map((y, i) => <rect key={y} x="470" y={y} width="180" height={3 + i} fill="#D53F8C" opacity=".85" />)}
      </g>
      {/* Skyline */}
      <path d="M0 150V118h30v-14h18v14h22V96h16v22h26v-30h20v30h18v-16h24v16h30v-40h12v40h26v-22h20v22h34v-12h22v12H800v32z" fill="#1A0B33" opacity=".55" />
      {/* Suelo con rejilla */}
      <rect y="150" width="800" height="70" fill="url(#gta-suelo)" />
      {Array.from({ length: 17 }, (_, i) => <line key={'v' + i} x1={400 + (i - 8) * 18} y1="150" x2={400 + (i - 8) * 120} y2="220" stroke="#FF5EBC" strokeOpacity=".5" />)}
      {[156, 166, 180, 198].map((y) => <line key={'h' + y} x1="0" y1={y} x2="800" y2={y} stroke="#FF5EBC" strokeOpacity=".45" />)}
      {/* Palmeras */}
      {[[90, 1], [180, .8], [700, 1.05]].map(([x, s]) => (
        <g key={x} transform={`translate(${x} 150) scale(${s})`} fill="#12061F">
          <path d="M-3 0c4-40 2-70 10-104l5 1c-7 34-5 64-8 103z" />
          <path d="M8-104c-20-14-46-12-62 4 22-6 40-4 58 2zM8-104c-4-22-24-36-46-34 18 8 30 18 42 36zM8-104c14-20 40-24 60-12-22 0-40 4-56 14zM8-104c22-6 46 6 54 26-16-14-34-20-52-22zM8-104c-18 0-38 14-42 34 10-16 24-26 40-30z" />
        </g>
      ))}
      {/* Texto */}
      <text x="40" y="70" className="banner-gta-titulo">GTA VI</text>
      <text x="42" y="98" className="banner-gta-sub">VICE CITY · LAS ROZAS</text>
      <g transform="translate(40 112)">
        <rect width="118" height="26" rx="13" fill="#9BE15D" />
        <text x="59" y="18" textAnchor="middle" className="banner-gta-sello">U-tad edition</text>
      </g>
    </svg>
  );
}
