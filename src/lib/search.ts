const STOPWORDS = new Set([
  "de", "la", "el", "en", "y", "que", "para", "con", "los", "las", "un", "una",
  "del", "al", "por", "como", "es", "su", "sus", "se", "lo", "más", "o", "a",
  "the", "for", "and", "with", "of", "to", "in", "on",
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export interface SearchField {
  text: string;
  weight: number;
}

/**
 * Scores a candidate against a free-text query so a full sentence/question
 * ("¿cómo estamos innovando en onboarding con IA?") still surfaces coherent
 * results, not just exact substring matches.
 */
export function scoreFields(query: string, fields: SearchField[]): number {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return 1;

  const normalizedQuery = normalize(query.trim());
  let score = 0;

  for (const field of fields) {
    const normalizedField = normalize(field.text);
    const fieldTokens = new Set(tokenize(field.text));

    if (normalizedQuery.length > 2 && normalizedField.includes(normalizedQuery)) {
      score += field.weight * 3;
    }

    for (const qt of queryTokens) {
      if (fieldTokens.has(qt)) {
        score += field.weight;
      } else {
        for (const ft of fieldTokens) {
          if (ft.length > 3 && qt.length > 3 && (ft.startsWith(qt) || qt.startsWith(ft))) {
            score += field.weight * 0.5;
            break;
          }
        }
      }
    }
  }

  return score;
}

export function smartSearch<T>(
  items: T[],
  query: string,
  toFields: (item: T) => SearchField[],
): T[] {
  const q = query.trim();
  if (q === "") return items;

  return items
    .map((item) => ({ item, score: scoreFields(q, toFields(item)) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item);
}
