export interface Matchable {
  id: number;
  canonical: string;
  aliases: string[];
}

export function normalizeAnswer(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^the /, "");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Resolve a guess to one answer, or null.
 * Order: exact name/alias → unique surname → small typo on a name, alias or unique surname.
 * Anything ambiguous resolves to null so players never get credited for the wrong entry.
 */
export function matchAnswer<T extends Matchable>(guess: string, entries: T[]): T | null {
  const norm = normalizeAnswer(guess);
  if (!norm) return null;

  const keys: { key: string; entry: T }[] = [];
  for (const e of entries) {
    keys.push({ key: normalizeAnswer(e.canonical), entry: e });
    for (const a of e.aliases) keys.push({ key: normalizeAnswer(a), entry: e });
  }

  const exact = keys.find((k) => k.key === norm);
  if (exact) return exact.entry;

  // Surnames (last word, or last two words for "del Potro"-style names), only when unique.
  const surnameOwners = new Map<string, Set<T>>();
  for (const e of entries) {
    const parts = normalizeAnswer(e.canonical).split(" ");
    if (parts.length < 2) continue;
    const candidates = [parts[parts.length - 1]];
    if (parts.length >= 3) candidates.push(parts.slice(-2).join(" "));
    for (const s of candidates) {
      if (!surnameOwners.has(s)) surnameOwners.set(s, new Set());
      surnameOwners.get(s)!.add(e);
    }
  }
  const surnameHit = surnameOwners.get(norm);
  if (surnameHit) return surnameHit.size === 1 ? [...surnameHit][0] : null;

  for (const [s, owners] of surnameOwners) {
    if (owners.size === 1 && s.length >= 4) keys.push({ key: s, entry: [...owners][0] });
  }

  // Typo tolerance: 1 edit for 5+ chars, 2 edits for 9+ chars.
  if (norm.length < 5) return null;
  let best: T | null = null;
  let bestDist = Infinity;
  let tie = false;
  for (const { key, entry } of keys) {
    if (key.length < 5) continue;
    const allowed = key.length >= 9 ? 2 : 1;
    const d = levenshtein(norm, key);
    if (d > allowed) continue;
    if (d < bestDist) {
      best = entry;
      bestDist = d;
      tie = false;
    } else if (d === bestDist && entry !== best) {
      tie = true;
    }
  }
  return tie ? null : best;
}
