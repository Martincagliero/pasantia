import type { Profile, Role, SubscriptionPlan } from './database.types';

export const FREE_COMPANY_POSTS_PER_MONTH = 3;
export const FREE_STUDENT_CONNECTIONS_PER_MONTH = 5;

export function activePlan(profile: Profile | null | undefined): SubscriptionPlan {
  if (!profile?.plan || profile.plan === 'free') return 'free';
  if (profile.plan_expires_at && new Date(profile.plan_expires_at).getTime() < Date.now()) return 'free';
  return profile.plan;
}

export function isPro(profile: Profile | null | undefined): boolean {
  return activePlan(profile) === 'pro' || activePlan(profile) === 'enterprise';
}

export function planLabel(plan: SubscriptionPlan): string {
  return plan === 'enterprise' ? 'Empresa' : plan === 'pro' ? 'Pro' : 'Gratis';
}

export function planPrice(role: Role, plan: SubscriptionPlan): string {
  if (plan === 'free') return 'USD 0';
  if (role === 'estudiante') return 'USD 5/mes';
  return plan === 'enterprise' ? 'Desde USD 149/mes' : 'USD 49/mes';
}