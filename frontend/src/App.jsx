import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout, { Toast } from './components/layout/Layout.jsx';
import InicioPage from './pages/InicioPage.jsx';
import { AsignaturaPage, AsignaturasPage, CalificacionesPage, EntregasPage, MensajesPage, TramitesPage } from './pages/AcademicoPages.jsx';
import { AjustesPage, EntrarPage, GruposPage } from './pages/CuentaPages.jsx';
import HorarioPage from './pages/HorarioPage.jsx';
import { CommunityPage, ComunidadDetallePage, NuevoAnuncioPage, TorneoPage, TorneosPage } from './pages/CommunityPages.jsx';
import { SesionProvider, useSesion } from './store/SesionContext.jsx';
import { UiProvider } from './store/UiContext.jsx';
import { ComunidadProvider } from './store/ComunidadContext.jsx';

/** Sin sesión (y fuera de la demo) solo se puede entrar; con sesión y sin grupos, elegirlos. */
function Puerta() {
  const { carga } = useSesion();
  return (
    <main className="main" id="view">
      {carga === 'grupos' ? <GruposPage /> : <EntrarPage />}
      <Toast />
    </main>
  );
}

function Rutas() {
  const { puertaAbierta, academico } = useSesion();
  useEffect(() => { document.body.classList.toggle('sin-menu', !puertaAbierta); }, [puertaAbierta]);
  if (!puertaAbierta) return <div className="app"><Puerta /></div>;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/inicio" element={<InicioPage />} />
        <Route path="/horario" element={<HorarioPage />} />
        <Route path="/asig" element={<AsignaturasPage />} />
        <Route path="/asig/:id" element={<AsignaturaPage />} />
        <Route path="/asig/:id/:sub" element={<AsignaturaPage />} />
        <Route path="/notas" element={<CalificacionesPage />} />
        <Route path="/ent" element={<EntregasPage />} />
        <Route path="/msg" element={<MensajesPage />} />
        <Route path="/msg/:id" element={<MensajesPage />} />
        <Route path="/tram" element={<TramitesPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/community/nuevo" element={<NuevoAnuncioPage />} />
        <Route path="/community/c/:id" element={<ComunidadDetallePage />} />
        <Route path="/community/torneos" element={<TorneosPage />} />
        <Route path="/community/torneos/:id" element={<TorneoPage />} />
        {academico?.real && <Route path="/ajustes" element={<AjustesPage />} />}
        <Route path="/com" element={<Navigate to="/community" replace />} />
        <Route path="/demo" element={<Navigate to="/inicio" replace />} />
        <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Route>
      {academico?.real && <Route path="/grupos" element={<div className="app"><main className="main"><GruposPage /></main></div>} />}
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <SesionProvider>
        <UiProvider>
          <ComunidadProvider>
            <Rutas />
          </ComunidadProvider>
        </UiProvider>
      </SesionProvider>
    </HashRouter>
  );
}
