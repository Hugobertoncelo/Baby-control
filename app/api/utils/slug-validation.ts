export const RESERVED_URLS = [
  "account",
  "api",
  "coming-soon",
  "family-manager",
  "family-select",
  "setup",
  "sphome",
  "login",
  "auth",
  "context",
  "globals",
  "layout",
  "metadata",
  "page",
  "template",
] as const;

export function isReservedSlug(slug: string): boolean {
  return RESERVED_URLS.includes(slug.toLowerCase() as any);
}

export function validateSlug(slug: string): {
  isValid: boolean;
  error?: string;
} {
  if (!slug || slug.trim() === "") {
    return { isValid: false, error: "O slug não pode ser vazio" };
  }
  const slugPattern = /^[a-z0-9-]+$/;
  if (!slugPattern.test(slug)) {
    return {
      isValid: false,
      error: "O slug só pode conter letras minúsculas, números e hífens",
    };
  }
  if (slug.length < 3) {
    return { isValid: false, error: "O slug deve ter pelo menos 3 caracteres" };
  }
  if (slug.length > 50) {
    return { isValid: false, error: "O slug deve ter menos de 50 caracteres" };
  }
  if (isReservedSlug(slug)) {
    return {
      isValid: false,
      error: "Esta URL é reservada pelo sistema e não pode ser usada",
    };
  }
  return { isValid: true };
}
