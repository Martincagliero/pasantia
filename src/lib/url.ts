// Normaliza links que el usuario tipeó sin protocolo (ej: "linkedin.com/in/x" -> "https://linkedin.com/in/x").
// Los inputs de link usan type="text" (no "url") porque la validación nativa del navegador
// exige un protocolo explícito y rechazaba links válidos escritos sin "https://".
export function normalizeUrl(input: string): string {
  const v = input.trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export type ProfileLinkKind = 'instagram' | 'linkedin' | 'github' | 'portfolio';

export function normalizeProfileUrl(input: string, kind: ProfileLinkKind): string {
  const value = input.trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;

  const cleanHandle = value.replace(/^@/, '').replace(/^\/+|\/+$/g, '');
  if (kind === 'instagram' && !/[./]/.test(cleanHandle)) return `https://instagram.com/${cleanHandle}`;
  if (kind === 'linkedin' && !/[./]/.test(cleanHandle)) return `https://linkedin.com/in/${cleanHandle}`;
  if (kind === 'github' && !/[./]/.test(cleanHandle)) return `https://github.com/${cleanHandle}`;
  return normalizeUrl(value);
}

export function detectProfileLink(input: string): { kind: ProfileLinkKind; url: string } | null {
  const value = input.trim();
  if (!value) return null;
  const lower = value.toLowerCase();
  const kind: ProfileLinkKind = lower.includes('linkedin.com')
    ? 'linkedin'
    : lower.includes('github.com')
      ? 'github'
      : lower.includes('instagram.com') || value.startsWith('@')
        ? 'instagram'
        : 'portfolio';
  return { kind, url: normalizeProfileUrl(value, kind) };
}

export function profileLinkLabel(input: string, fallback: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('linkedin.com')) return 'LinkedIn';
  if (lower.includes('github.com')) return 'GitHub';
  if (lower.includes('instagram.com') || input.trim().startsWith('@')) return 'Instagram';
  return fallback;
}
