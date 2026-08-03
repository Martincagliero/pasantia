// Normaliza links que el usuario tipeó sin protocolo (ej: "linkedin.com/in/x" -> "https://linkedin.com/in/x").
// Los inputs de link usan type="text" (no "url") porque la validación nativa del navegador
// exige un protocolo explícito y rechazaba links válidos escritos sin "https://".
export function normalizeUrl(input: string): string {
  const v = input.trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}
