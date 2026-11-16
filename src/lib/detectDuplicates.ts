import { Idea } from './types';

export interface DuplicateCandidate {
  idea_a: string;
  idea_b: string;
  similarity: number;
}

// Similarité Jaccard simple sur les mots (titre + description)
function computeSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().match(/\w+/g) || []);
  const words2 = new Set(text2.toLowerCase().match(/\w+/g) || []);

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

export function detectDuplicates(ideas: Idea[]): DuplicateCandidate[] {
  const results: DuplicateCandidate[] = [];

  for (let i = 0; i < ideas.length; i++) {
    for (let j = i + 1; j < ideas.length; j++) {
      const a = ideas[i];
      const b = ideas[j];
      const textA = `${a.title} ${a.description}`;
      const textB = `${b.title} ${b.description}`;

      const similarity = computeSimilarity(textA, textB);

      // Seuil minimal pour retenir une paire potentielle (ex: > 0.25)
      if (similarity >= 0.25) {
        // Respect de la règle idea_a < idea_b
        const [idea_a, idea_b] = a.id < b.id ? [a.id, b.id] : [b.id, a.id];
        results.push({ idea_a, idea_b, similarity: Number(similarity.toFixed(2)) });
      }
    }
  }

  return results.sort((x, y) => y.similarity - x.similarity);
}