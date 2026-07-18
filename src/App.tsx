import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { SmoothScroll } from './components/layout/SmoothScroll';
import { PageTransition } from './components/layout/PageTransition';
import { EarlyAccessProvider } from './components/early-access/EarlyAccess';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { useAuth } from './features/auth/AuthProvider';
import { DashboardLayout } from './features/dashboard/DashboardLayout';
import Home from './pages/Home';

// Lazy load de las subpáginas para aligerar el bundle inicial.
const Estudiantes = lazy(() => import('./pages/Estudiantes'));
const Empresas = lazy(() => import('./pages/Empresas'));
const PoliticaPrivacidad = lazy(() => import('./pages/PoliticaPrivacidad'));
const Terminos = lazy(() => import('./pages/Terminos'));

// --- Sistema interno (auth + panel) ---
const Login = lazy(() => import('./features/auth/pages/Login'));
const Register = lazy(() => import('./features/auth/pages/Register'));
const DashboardHome = lazy(() => import('./features/dashboard/DashboardHome'));
const BrowseInternships = lazy(() => import('./features/student/BrowseInternships'));
const MyApplications = lazy(() => import('./features/student/MyApplications'));
const SavedInternships = lazy(() => import('./features/student/SavedInternships'));
const StudentProfileForm = lazy(() => import('./features/student/StudentProfileForm'));
const MyInternships = lazy(() => import('./features/company/MyInternships'));
const InternshipForm = lazy(() => import('./features/company/InternshipForm'));
const InternshipApplicants = lazy(() => import('./features/company/InternshipApplicants'));
const CompanyProfileForm = lazy(() => import('./features/company/CompanyProfileForm'));
const CompanyOverview = lazy(() => import('./features/company/CompanyOverview'));
const CompanyApplications = lazy(() => import('./features/company/CompanyApplications'));
const TalentSearch = lazy(() => import('./features/company/TalentSearch'));
const AmbassadorHome = lazy(() => import('./features/ambassador/AmbassadorHome'));
const AmbassadorLeaderboard = lazy(() => import('./features/ambassador/AmbassadorLeaderboard'));
const AmbassadorProfile = lazy(() => import('./features/ambassador/AmbassadorProfile'));
const AmbassadorDirectory = lazy(() => import('./features/ambassador/AmbassadorDirectory'));
const AmbassadorAnnouncements = lazy(() => import('./features/ambassador/AmbassadorAnnouncements'));
const Novedades = lazy(() => import('./features/posts/Novedades'));
const Explore = lazy(() => import('./features/directory/Explore'));
const StudentCommunities = lazy(() => import('./features/student/StudentCommunities'));
const CommunityDetailPage = lazy(() => import('./pages/CommunityDetailPage'));
const PublicCommunityPage = lazy(() => import('./pages/PublicCommunityPage'));

const fallback = <div className="min-h-screen" aria-hidden />;

export default function App() {
  const location = useLocation();
  // El sistema interno (login y panel) usa su propio layout,
  // sin la Navbar ni el Footer de la landing.
  const isAppArea =
    location.pathname.startsWith('/app') ||
    location.pathname === '/ingresar' ||
    location.pathname === '/registro';

  return (
    <EarlyAccessProvider>
      {isAppArea ? (
        <Suspense fallback={fallback}>
          <Routes>
          <Route path="/ingresar" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            {/* Estudiante */}
            <Route
              path="pasantias"
              element={
                <ProtectedRoute role="estudiante">
                  <BrowseInternships />
                </ProtectedRoute>
              }
            />
            <Route
              path="postulaciones"
              element={
                <ProtectedRoute role="estudiante">
                  <MyApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="guardadas"
              element={
                <ProtectedRoute role="estudiante">
                  <SavedInternships />
                </ProtectedRoute>
              }
            />
            <Route
              path="comunidades"
              element={
                <ProtectedRoute role="estudiante">
                  <StudentCommunities />
                </ProtectedRoute>
              }
            />
            <Route
              path="comunidad/:id"
              element={
                <ProtectedRoute role="estudiante">
                  <CommunityDetailPage />
                </ProtectedRoute>
              }
            />
            {/* Empresa */}
            <Route
              path="inicio"
              element={
                <ProtectedRoute role="empresa">
                  <CompanyOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="mis-pasantias"
              element={
                <ProtectedRoute role="empresa">
                  <MyInternships />
                </ProtectedRoute>
              }
            />
            <Route
              path="postulaciones-recibidas"
              element={
                <ProtectedRoute role="empresa">
                  <CompanyApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="publicar"
              element={
                <ProtectedRoute role="empresa">
                  <InternshipForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="pasantia/:id"
              element={
                <ProtectedRoute role="empresa">
                  <InternshipApplicants />
                </ProtectedRoute>
              }
            />
            <Route
              path="talento"
              element={
                <ProtectedRoute role="empresa">
                  <TalentSearch />
                </ProtectedRoute>
              }
            />
            <Route
              path="embajador"
              element={
                <ProtectedRoute role="embajador">
                  <AmbassadorHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="ranking"
              element={
                <ProtectedRoute role="embajador">
                  <AmbassadorLeaderboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="embajador-perfil"
              element={
                <ProtectedRoute role="embajador">
                  <AmbassadorProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="anuncios"
              element={
                <ProtectedRoute role="embajador">
                  <AmbassadorAnnouncements />
                </ProtectedRoute>
              }
            />
            {/* Novedades y Perfil (ambos roles) */}
            <Route
              path="explorar"
              element={
                <ProtectedRoute>
                  <Explore />
                </ProtectedRoute>
              }
            />
            <Route
              path="novedades"
              element={
                <ProtectedRoute>
                  <Novedades />
                </ProtectedRoute>
              }
            />
            <Route path="perfil" element={<ProfileByRole />} />
          </Route>
        </Routes>
        </Suspense>
      ) : (
        <div className="flex min-h-screen flex-col">
          <SmoothScroll />
          <Navbar />

        <div className="flex-1">
          <AnimatePresence mode="wait">
            <Suspense fallback={fallback}>
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
                  path="/embajadores"
                  element={
                    <PageTransition>
                      <AmbassadorDirectory />
                    </PageTransition>
                  }
                />
                <Route
                  path="/comunidad/:id"
                  element={
                    <PageTransition>
                      <PublicCommunityPage />
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
      )}
    </EarlyAccessProvider>
  );
}

// El perfil se renderiza según el rol del usuario logueado.
function ProfileByRole() {
  return (
    <ProtectedRoute>
      <ProfileSwitch />
    </ProtectedRoute>
  );
}

function ProfileSwitch() {
  const { profile } = useAuth();
  return profile?.role === 'empresa' ? <CompanyProfileForm /> : <StudentProfileForm />;
}
