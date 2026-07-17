import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { SmoothScroll } from './components/layout/SmoothScroll';
import { PageTransition } from './components/layout/PageTransition';
import { EarlyAccessProvider } from './components/early-access/EarlyAccess';
import Home from './pages/Home';

// Lazy load de las subpáginas para aligerar el bundle inicial.
const Estudiantes = lazy(() => import('./pages/Estudiantes'));
const Empresas = lazy(() => import('./pages/Empresas'));
const PoliticaPrivacidad = lazy(() => import('./pages/PoliticaPrivacidad'));
const Terminos = lazy(() => import('./pages/Terminos'));

export default function App() {
  const location = useLocation();

  return (
    <EarlyAccessProvider>
      <div className="flex min-h-screen flex-col">
        <SmoothScroll />
        <Navbar />

        <div className="flex-1">
          <AnimatePresence mode="wait">
            <Suspense fallback={<div className="min-h-screen" aria-hidden />}>
              <Routes location={location} key={location.pathname}>
                <Route
                  path="/"
                  element={
                    <PageTransition>
                      <Home />
                    </PageTransition>
                  }
                />
                <Route
                  path="/estudiantes"
                  element={
                    <PageTransition>
                      <Estudiantes />
                    </PageTransition>
                  }
                />
                <Route
                  path="/empresas"
                  element={
                    <PageTransition>
                      <Empresas />
                    </PageTransition>
                  }
                />
                <Route
                  path="/politica-de-privacidad"
                  element={
                    <PageTransition>
                      <PoliticaPrivacidad />
                    </PageTransition>
                  }
                />
                <Route
                  path="/terminos"
                  element={
                    <PageTransition>
                      <Terminos />
                    </PageTransition>
                  }
                />
                {/* Fallback: cualquier ruta desconocida vuelve al Home */}
                <Route
                  path="*"
                  element={
                    <PageTransition>
                      <Home />
                    </PageTransition>
                  }
                />
              </Routes>
            </Suspense>
          </AnimatePresence>
        </div>

        <Footer />
      </div>
    </EarlyAccessProvider>
  );
}
