/** Iconos de trazo (mismo estilo que el mock-up). */
const P = {
  buscar: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  cerrar: <path d="M6 6l12 12M18 6L6 18" />,
  aviso: <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM16 8a5 5 0 0 1 0 8" />,
  cal: <><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M3 9h18M8 2v4M16 2v4" /></>,
  doc: <><path d="M14 3H6v18h12V7z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></>,
  pin: <><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  check: <path d="M5 12l5 5 9-10" />,
  asis: <><path d="M9 11l3 3 8-8" /><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" /></>,
  uni: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c3 0 6 1.8 6 5.5" /></>,
  padel: <><ellipse cx="10" cy="9" rx="6" ry="7" /><path d="M14 14l6 6" /><circle cx="19" cy="5" r="1.5" /></>,
  aula: <><path d="M3 21V8l9-5 9 5v13" /><path d="M9 21v-6h6v6" /></>,
  libro: <><path d="M4 4h10a4 4 0 0 1 4 4v13H8a4 4 0 0 1-4-4z" /><path d="M4 17a4 4 0 0 1 4-4h10" /></>,
  reloj: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  chispa: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />,
  balon: <><circle cx="12" cy="12" r="9" /><path d="M12 7l4 3-1.5 4.5h-5L8 10z" /><path d="M12 3v4M16 10l4.5-1.5M14.5 14.5l2.5 4M9.5 14.5l-2.5 4M8 10L3.5 8.5" /></>,
  mando: <><path d="M6 8h12a4 4 0 0 1 4 4v1a4 4 0 0 1-7 2.6L14 15h-4l-1 .6A4 4 0 0 1 2 13v-1a4 4 0 0 1 4-4z" /><path d="M7 11v3M5.5 12.5h3M16 12h.01M18 13.5h.01" /></>,
  pincel: <><path d="M18 3l3 3-9 9-3-3z" /><path d="M9 12c-3 0-5 2-5 5 0 1.5-1 2.5-2 3 3 1 7 0 8-3" /></>,
  trofeo: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" /></>,
  mas: <path d="M12 5v14M5 12h14" />,
  euro: <path d="M17 6.5A6 6 0 1 0 17 17.5M5 10h8M5 14h8" />,
  estrella: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  flecha: <path d="M5 12h14M13 6l6 6-6 6" />,
};

export default function Icon({ n, className = 'i' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      {P[n] ?? P.chispa}
    </svg>
  );
}
