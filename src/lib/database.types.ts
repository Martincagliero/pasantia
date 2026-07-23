// Tipos del dominio del sistema interno + tipado mínimo de la base de datos.
// Si más adelante generás tipos con `supabase gen types`, podés reemplazar este archivo.

export type Role = 'estudiante' | 'empresa' | 'embajador';

export type ApplicationStatus =
  | 'pendiente'
  | 'vista'
  | 'aceptada'
  | 'rechazada'
  | 'en_revision'
  | 'entrevista'
  | 'prueba_tecnica'
  | 'seleccionado';

export type Modality = 'presencial' | 'remoto' | 'hibrido';

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  email: string;
  created_at: string;
}

export interface StudentProfile {
  id: string;
  avatar_url: string | null;
  verified: boolean;
  verification_requested: boolean;
  university: string | null;
  career: string | null;
  year: string | null;
  area: string | null;
  skills: string[] | null;
  availability: string | null;
  bio: string | null;
  cv_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  phone: string | null;
  location: string | null;
  gpa: string | null;
  transcript_url: string | null;
  github_url: string | null;
  instagram_url: string | null;
  is_public: boolean;
}

export interface CompanyProfile {
  id: string;
  avatar_url: string | null;
  verified: boolean;
  verification_requested: boolean;
  company_name: string | null;
  industry: string | null;
  size: string | null;
  website: string | null;
  description: string | null;
}

export type AmbassadorOrgType =
  | 'centro_estudiantes'
  | 'agrupacion'
  | 'secretaria_empleo'
  | 'facultad'
  | 'carrera'
  | 'cuenta_instagram'
  | 'comunidad'
  | 'otro';

export interface AmbassadorProfile {
  id: string;
  org_name: string | null;
  org_type: AmbassadorOrgType | null;
  university: string | null;
  instagram_url: string | null;
  reach: string | null;
  description: string | null;
  logo_url: string | null;
  verified: boolean;
  verification_requested: boolean;
  created_at: string;
}

export interface Internship {
  id: string;
  company_id: string;
  title: string;
  description: string;
  area: string;
  modality: Modality;
  location: string | null;
  requirements: string | null;
  is_active: boolean;
  created_at: string;
  /** Nombre de la empresa cargado a mano (pasantías publicadas por embajadores). */
  company_name: string | null;
  /** Imagen opcional de la pasantía. */
  image_url: string | null;
}

/** Pasantía con datos de la empresa que la publicó (join). */
export interface InternshipWithCompany extends Internship {
  company: Pick<CompanyProfile, 'company_name' | 'industry'> | null;
}

export interface Application {
  id: string;
  internship_id: string;
  student_id: string;
  status: ApplicationStatus;
  message: string | null;
  is_favorite: boolean;
  created_at: string;
}

/** Postulación con datos de la pasantía (para la vista del estudiante). */
export interface ApplicationWithInternship extends Application {
  internship: InternshipWithCompany | null;
}

/** Postulación con datos del estudiante (para la vista de la empresa). */
export interface ApplicationWithStudent extends Application {
  student: (Profile & StudentProfile) | null;
}

/** Categorías de publicación del panel de Novedades. */
export type PostCategory = 'novedad' | 'proyecto' | 'busqueda' | 'recurso';

/** Publicación del panel de Novedades (la pueden crear estudiantes y empresas). */
export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_role: Role;
  title: string;
  body: string;
  category: PostCategory;
  link_url: string | null;
  created_at: string;
}

export interface AmbassadorPost {
  id: string;
  ambassador_id: string;
  title: string;
  description: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Community {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  members_count: number;
  created_at: string;
  updated_at: string;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  student_id: string;
  joined_at: string;
}

export interface CommunityInternship {
  id: string;
  community_id: string;
  internship_id: string;
  published_at: string;
}

/** Anuncio/proyecto compartido dentro de una comunidad (estilo LinkedIn). */
export interface CommunityPost {
  id: string;
  community_id: string;
  author_id: string;
  author_name: string;
  author_role: Role;
  content: string;
  link_url: string | null;
  created_at: string;
}

export type ReportTargetType = 'internship' | 'community_post' | 'profile';

export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  details: string | null;
  status: 'pendiente' | 'revisado' | 'descartado';
  created_at: string;
}

/** Relación "seguir" (unidireccional): follower_id sigue a following_id. */
export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

// --- Tipado genérico para el cliente de Supabase ---
// Mantenido intencionalmente simple; el SDK igual funciona sin tipos exhaustivos.
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, 'id' | 'role' | 'full_name' | 'email'>;
        Update: Partial<Profile>;
      };
      student_profiles: {
        Row: StudentProfile;
        Insert: Partial<StudentProfile> & Pick<StudentProfile, 'id'>;
        Update: Partial<StudentProfile>;
      };
      company_profiles: {
        Row: CompanyProfile;
        Insert: Partial<CompanyProfile> & Pick<CompanyProfile, 'id'>;
        Update: Partial<CompanyProfile>;
      };
      internships: {
        Row: Internship;
        Insert: Partial<Internship> &
          Pick<Internship, 'company_id' | 'title' | 'description' | 'area' | 'modality'>;
        Update: Partial<Internship>;
      };
      applications: {
        Row: Application;
        Insert: Partial<Application> & Pick<Application, 'internship_id' | 'student_id'>;
        Update: Partial<Application>;
      };
      reports: {
        Row: Report;
        Insert: Partial<Report> &
          Pick<Report, 'reporter_id' | 'target_type' | 'target_id' | 'reason'>;
        Update: Partial<Report>;
      };
      follows: {
        Row: Follow;
        Insert: Partial<Follow> & Pick<Follow, 'follower_id' | 'following_id'>;
        Update: Partial<Follow>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
