import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  MIN_SIMILARITY,
  computeSimilarity,
  detectDuplicates,
  duplicateLevel,
  tokenize,
  type DuplicateInput,
} from './detectDuplicates';
import { parseIdeasCsv } from './parseIdeasCsv';

function makeIdea(id: string, title: string, description: string): DuplicateInput {
  return { id, title, description };
}

describe('tokenize', () => {
  it('ignore les accents, les majuscules et les mots courants', () => {
    const tokens = [...tokenize('Réalité AUGMENTÉE pour les techniciens')].sort();
    expect(tokens).toEqual(['augmentee', 'realite', 'technicien']);
  });

  it('ramène le pluriel au singulier', () => {
    expect(tokenize('capteurs capteur').size).toBe(1);
  });
});

describe('computeSimilarity', () => {
  it('vaut 1 pour deux textes identiques', () => {
    expect(computeSimilarity('Kanban digital', 'Kanban digital')).toBe(1);
  });

  it('ignore accents, majuscules et pluriels', () => {
    expect(computeSimilarity('Réalité augmentée', 'REALITE AUGMENTEE')).toBe(1);
  });

  it('vaut 0 quand rien n\'est en commun', () => {
    expect(computeSimilarity('Café gratuit', 'Ombrières solaires parkings')).toBe(0);
  });

  it('vaut 0 pour un texte vide ou fait uniquement de mots courants', () => {
    expect(computeSimilarity('', 'Kanban digital')).toBe(0);
    expect(computeSimilarity('le la les', 'Kanban digital')).toBe(0);
  });

  it('donne le même résultat dans les deux sens', () => {
    const a = 'Capteurs de vibration sur les compresseurs';
    const b = 'Maintenance prédictive des compresseurs';
    expect(computeSimilarity(a, b)).toBe(computeSimilarity(b, a));
  });
});

describe('duplicateLevel', () => {
  it('classe les scores en trois niveaux', () => {
    expect(duplicateLevel(1)).toBe('identical');
    expect(duplicateLevel(0.9)).toBe('identical');
    expect(duplicateLevel(0.5)).toBe('probable');
    expect(duplicateLevel(0.18)).toBe('probable');
    expect(duplicateLevel(0.17)).toBe('to_check');
    expect(duplicateLevel(MIN_SIMILARITY)).toBe('to_check');
  });
});

describe('detectDuplicates', () => {
  it('renvoie une liste vide avec zéro ou une idée', () => {
    expect(detectDuplicates([])).toEqual([]);
    expect(detectDuplicates([makeIdea('IDEA-001', 'Titre', 'Description')])).toEqual([]);
  });

  it('signale deux idées identiques avec un score de 1', () => {
    const pairs = detectDuplicates([
      makeIdea('IDEA-001', 'Kanban digital', 'Remplacer les cartes papier par des écrans'),
      makeIdea('IDEA-002', 'Kanban digital', 'Remplacer les cartes papier par des écrans'),
    ]);
    expect(pairs).toEqual([{ idea_a: 'IDEA-001', idea_b: 'IDEA-002', similarity: 1 }]);
  });

  it('respecte idea_a < idea_b même si les idées sont données à l\'envers', () => {
    const pairs = detectDuplicates([
      makeIdea('IDEA-009', 'Kanban digital', 'Écrans pour les lignes'),
      makeIdea('IDEA-003', 'Kanban digital', 'Écrans pour les lignes'),
    ]);
    expect(pairs[0].idea_a).toBe('IDEA-003');
    expect(pairs[0].idea_b).toBe('IDEA-009');
  });

  it('ne signale pas deux idées sans rapport', () => {
    const pairs = detectDuplicates([
      makeIdea('IDEA-001', 'Café gratuit', 'Rendre le café gratuit dans les ateliers'),
      makeIdea('IDEA-002', 'Ombrières solaires', 'Couvrir les parkings de panneaux photovoltaïques'),
    ]);
    expect(pairs).toEqual([]);
  });

  it('trie les paires de la plus proche à la moins proche', () => {
    const pairs = detectDuplicates([
      makeIdea('IDEA-001', 'Chatbot RH', 'Répond aux questions sur la paie et les congés'),
      makeIdea('IDEA-002', 'Chatbot RH', 'Répond aux questions sur la paie et les congés'),
      makeIdea('IDEA-003', 'Assistant RH', 'Répond aux questions des salariés sur les congés'),
    ]);
    expect(pairs.length).toBeGreaterThan(1);
    for (let i = 1; i < pairs.length; i++) {
      expect(pairs[i - 1].similarity).toBeGreaterThanOrEqual(pairs[i].similarity);
    }
  });
});

describe('detectDuplicates (40 idées réelles)', () => {
  const csv = readFileSync('src/lib/__fixtures__/idees_hexavia.csv', 'utf-8');
  const { ideas } = parseIdeasCsv(csv);
  const pairs = detectDuplicates(ideas);
  const find = (a: string, b: string) =>
    pairs.find((p) => p.idea_a === a && p.idea_b === b);

  it('trouve IDEA-002 et IDEA-014 (même idée déposée deux fois) : identiques', () => {
    expect(find('IDEA-002', 'IDEA-014')?.similarity).toBe(1);
  });

  it('trouve IDEA-003 et IDEA-019 (chatbot RH) : probable', () => {
    const similarity = find('IDEA-003', 'IDEA-019')?.similarity ?? 0;
    expect(duplicateLevel(similarity)).toBe('probable');
  });

  it('signale IDEA-001 / IDEA-007 (capteurs) et IDEA-008 / IDEA-027 (covoiturage) à vérifier', () => {
    expect(find('IDEA-001', 'IDEA-007')?.similarity).toBeGreaterThanOrEqual(MIN_SIMILARITY);
    expect(find('IDEA-008', 'IDEA-027')?.similarity).toBeGreaterThanOrEqual(MIN_SIMILARITY);
  });

  it('reste raisonnable : pas plus de 10 paires signalées sur 40 idées', () => {
    expect(pairs.length).toBeLessThanOrEqual(10);
  });

  it('respecte idea_a < idea_b pour toutes les paires', () => {
    for (const pair of pairs) {
      expect(pair.idea_a < pair.idea_b).toBe(true);
    }
  });

  it.todo('IDEA-017 / IDEA-018 : même sujet reformulé, non détecté par une simple comparaison de mots');
});