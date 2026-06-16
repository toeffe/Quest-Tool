/**
 * Identifier helpers. Minecraft namespaces, function names and (by our
 * convention) entity tags must be lowercase and contain only [a-z0-9_].
 */

/** Generate a short unique id for internal use (not Minecraft-facing). */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/**
 * Convert arbitrary text into a safe Minecraft identifier: lowercase, spaces and
 * punctuation collapsed to underscores, leading digits prefixed.
 */
export function toIdentifier(input: string, fallback = 'item'): string {
  let id = (input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!id) id = fallback;
  if (/^[0-9]/.test(id)) id = `q_${id}`;
  return id;
}

/** Ensure an identifier is unique within a set of taken identifiers. */
export function uniqueIdentifier(base: string, taken: Set<string>): string {
  let candidate = base;
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `${base}_${n++}`;
  }
  return candidate;
}
