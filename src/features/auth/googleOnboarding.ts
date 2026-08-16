import type { Role } from '../../lib/database.types';

const GOOGLE_ONBOARDING_KEY = 'pasantia_google_onboarding';

interface PendingGoogleOnboarding {
  role?: Role;
}

export function savePendingGoogleOnboarding(role?: Role) {
  sessionStorage.setItem(GOOGLE_ONBOARDING_KEY, JSON.stringify({ role }));
}

export function readPendingGoogleOnboarding(): PendingGoogleOnboarding | null {
  try {
    const stored = sessionStorage.getItem(GOOGLE_ONBOARDING_KEY);
    return stored ? (JSON.parse(stored) as PendingGoogleOnboarding) : null;
  } catch {
    return null;
  }
}

export function clearPendingGoogleOnboarding() {
  sessionStorage.removeItem(GOOGLE_ONBOARDING_KEY);
}