import type { Profile, Role, SubscriptionPlan } from './database.types';

export const FREE_COMPANY_POSTS_PER_MONTH = 3;
export const FREE_COMPANY_APPLICANTS_PER_INTERNSHIP = 10;
export const FREE_STUDENT_CONNECTIONS_PER_MONTH = 5;
export const FREE_STUDENT_APPLICATIONS_PER_MONTH = 5;
export const CONNECTION_USAGE_RESET_AT = '2026-08-24T00:09:25-03:00';

export function activePlan(profile: Profile | null | undefined): SubscriptionPlan {
  if (!profile?.plan || profile.plan === 'free') return 'free';
  if (profile.plan_expires_at && new Date(profile.plan_expires_at).getTime() < Date.now()) return 'free';
  return profile.plan;
}

export function isPro(profile: Profile | null | undefined): boolean {
  return activePlan(profile) === 'pro' || activePlan(profile) === 'enterprise';
}

export function planLabel(plan: SubscriptionPlan, role?: Role): string {
  if (plan === 'free') return 'Gratis';
  if (role === 'embajador' && plan === 'pro') return 'Premium';
  return plan === 'enterprise' ? 'Empresa' : 'Pro';
}

export function planPrice(role: Role, plan: SubscriptionPlan): string {
  if (plan === 'free') return '$0';
  if (role === 'estudiante') return '$7.500/mes';
  if (role === 'embajador') return 'A convenir';
  return plan === 'enterprise' ? 'Desde $223.500/mes' : '$73.500/mes';
}