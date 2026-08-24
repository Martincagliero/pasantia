import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { isPro } from '../../lib/plans';
import { UpgradePrompt } from './UpgradePrompt';

export function PlanGate({ children, title, description }: { children: ReactNode; title: string; description: string }) {
  const { profile } = useAuth();
  if (isPro(profile)) return children;
  return <UpgradePrompt title={title} description={description} />;
}