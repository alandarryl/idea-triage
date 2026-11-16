import type { Idea } from './types';

// Seuls ces trois champs servent à comparer : toute idée (avec ou sans note) convient.
export type DuplicateInput = Pick<Idea, 'id' | 'title' | 'description'>;

export interface DuplicateCandidate {
  idea_a: string;
  idea_b: string;
  similarity: number;
}

export type DuplicateLevel = 'identical' | 'probable' | 'to_check';

// En dessous de ce score, une paire n'est pas signalée.
export const MIN_SIMILARITY = 0.12;
const PROBABLE_FROM = 0.18;
const IDENTICAL_FROM = 0.9;

export function duplicateLevel(similarity: number): DuplicateLevel {
  if (similarity >= IDENTICAL_FROM) return 'identical';
  if (similarity >= PROBABLE_FROM) return 'probable';
  return 'to_check';
}

// Mots très courants : ils ne disent rien sur le sujet d'une idée.
const STOP_WORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'en', 'au', 'aux',
  'sur', 'pour', 'par', 'dans', 'avec', 'sans', 'ce', 'cet', 'cette', 'ces', 'qui',
  'que', 'qu', 'est', 'sont', 'on', 'nous', 'nos', 'notre', 'leur', 'leurs', 'se',
  'sa', 'son', 'ses', 'plus', 'moins', 'tout', 'tous', 'toute', 'toutes', 'chaque',
  'entre', 'vers', 'afin', 'si', 'ne', 'pas', 'il', 'elle', 'ils', 'mais', 'comme',
  'peut', 'etre', 'faire', 'mettre', 'permettre', 'aujourd', 'hui',
]);

// Découpe un texte en mots significatifs : sans accents, sans majuscules,
// sans mots courants, avec le pluriel ramené au singulier.
export function tokenize(text: string): Set<string> {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const words = normalized.match(/[a-z0-9]+/g) ?? [];

  const tokens = new Set<string>();
  for (const word of words) {
    if (word.length < 2 || STOP_WORDS.has(word)) continue;
    tokens.add(word.replace(/[sx]$/, ''));
  }
  return tokens;
}

// Similarité de Jaccard : mots communs / mots au total (0 = rien en commun, 1 = identique)
export function computeSimilarity(text1: string, text2: string): number {
  const words1 = tokenize(text1);
  const words2 = tokenize(text2);
  if (words1.size === 0 || words2.size === 0) return 0;

  let common = 0;
  for (const word of words1) {
    if (words2.has(word)) common += 1;
  }
  return common / (words1.size + words2.size - common);
}

export function detectDuplicates(ideas: DuplicateInput[]): DuplicateCandidate[] {
  const results: DuplicateCandidate[] = [];

  for (let i = 0; i < ideas.length; i++) {
    for (let j = i + 1; j < ideas.length; j++) {
      const a = ideas[i];
      const b = ideas[j];
      const similarity = computeSimilarity(
        `${a.title} ${a.description}`,
        `${b.title} ${b.description}`,
      );

      if (similarity >= MIN_SIMILARITY) {
        // La base impose idea_a < idea_b
        const [idea_a, idea_b] = a.id < b.id ? [a.id, b.id] : [b.id, a.id];
        results.push({ idea_a, idea_b, similarity: Number(similarity.toFixed(2)) });
      }
    }
  }

  return results.sort((x, y) => y.similarity - x.similarity);
}