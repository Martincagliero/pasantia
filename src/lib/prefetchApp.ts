import type { Role } from './database.types';

type Loader = () => Promise<unknown>;

const routeLoaders: Record<string, Loader> = {
  '/app/pasantias': () => import('../features/student/BrowseInternships'),
  '/app/postulaciones': () => import('../features/student/MyApplications'),
  '/app/guardadas': () => import('../features/student/SavedInternships'),
  '/app/comunidades': () => import('../features/student/StudentCommunities'),
  '/app/promotores': () => import('../features/student/Promoters'),
  '/app/perfil': () => import('../features/student/StudentProfileForm'),
  '/app/inicio': () => import('../features/company/CompanyOverview'),
  '/app/mis-pasantias': () => import('../features/company/MyInternships'),
  '/app/postulaciones-recibidas': () => import('../features/company/CompanyApplications'),
  '/app/talento': () => import('../features/company/TalentSearch'),
  '/app/embajador': () => import('../features/ambassador/AmbassadorHome'),
  '/app/anuncios': () => import('../features/ambassador/AmbassadorAnnouncements'),
  '/app/ranking': () => import('../features/ambassador/AmbassadorLeaderboard'),
  '/app/embajador-perfil': () => import('../features/ambassador/AmbassadorProfile'),
  '/app/novedades': () => import('../features/posts/Novedades'),
  '/app/explorar': () => import('../features/directory/Explore'),
  '/app/ayuda': () => import('../features/help/HelpCenter'),
  '/app/admin': () => import('../features/admin/AdminPanel'),
};

const roleRoutes: Record<Role, string[]> = {
  estudiante: [
    '/app/pasantias',
    '/app/postulaciones',
    '/app/guardadas',
    '/app/comunidades',
    '/app/promotores',
    '/app/perfil',
  ],
  empresa: [
    '/app/inicio',
    '/app/mis-pasantias',
    '/app/postulaciones-recibidas',
    '/app/talento',
    '/app/perfil',
  ],
  embajador: ['/app/embajador', '/app/anuncios', '/app/ranking', '/app/embajador-perfil'],
};

const loaded = new Set<string>();

export function prefetchAppRoute(path: string): void {
  const normalized = path.split('?')[0];
  const loader = routeLoaders[normalized];
  if (!loader || loaded.has(normalized)) return;
  loaded.add(normalized);
  void loader().catch(() => loaded.delete(normalized));
}

export function prefetchRoleRoutes(role: Role, isAdmin = false): void {
  const paths = [...roleRoutes[role], '/app/novedades', '/app/explorar', '/app/ayuda'];
  if (isAdmin) paths.push('/app/admin');
  paths.forEach(prefetchAppRoute);
}
