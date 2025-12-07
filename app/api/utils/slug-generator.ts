import { adjectives, animals } from "./slug-words";

export function generateSlug(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adjective}-${animal}`;
}

export function generateSlugWithNumber(digits: number = 4): string {
  const baseSlug = generateSlug();
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return `${baseSlug}-${randomNumber}`;
}

export function isValidSlug(slug: string): boolean {
  const parts = slug.split("-");
  if (parts.length < 2) {
    return false;
  }
  const adjective = parts[0];
  const animal = parts[1];
  return adjectives.includes(adjective) && animals.includes(animal);
}

export function generateSlugs(
  count: number,
  withNumbers: boolean = false
): string[] {
  const slugs = new Set<string>();
  while (slugs.size < count) {
    const slug = withNumbers ? generateSlugWithNumber() : generateSlug();
    slugs.add(slug);
  }
  return Array.from(slugs);
}
