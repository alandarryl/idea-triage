import { describe, it, expect } from 'vitest';
import {
  averageRating,
  formatAverage,
  isValidRating,
  validateScoreInput,
} from './scoring';

describe('isValidRating', () => {
  it.each([1, 2, 3, 4, 5])('accepte %d', (value) => {
    expect(isValidRating(value)).toBe(true);
  });

  it.each([0, 6, 3.5, -1, NaN, '3', null, undefined])('refuse %j', (value) => {
    expect(isValidRating(value)).toBe(false);
  });
});

describe('averageRating', () => {
  it('calcule la moyenne des 4 critères', () => {
    expect(
      averageRating({ impact: 4, feasibility: 3, strategic_fit: 5, innovation: 2 }),
    ).toBe(3.5);
  });

  it('renvoie null si un critère manque', () => {
    expect(
      averageRating({ impact: 4, feasibility: null, strategic_fit: 5, innovation: 2 }),
    ).toBeNull();
  });

  it('renvoie null pour une idée non notée', () => {
    expect(
      averageRating({ impact: null, feasibility: null, strategic_fit: null, innovation: null }),
    ).toBeNull();
  });
});

describe('formatAverage', () => {
  it('affiche deux décimales avec la virgule française', () => {
    expect(formatAverage(3.5)).toBe('3,50');
    expect(formatAverage(4)).toBe('4,00');
  });
});

describe('validateScoreInput', () => {
  const valid = {
    idea_id: 'IDEA-001',
    impact: 4,
    feasibility: 3,
    strategic_fit: 5,
    innovation: 2,
    justification: '  Très utile  ',
  };

  it('accepte une note complète et nettoie la justification', () => {
    expect(validateScoreInput(valid)).toEqual({
      ok: true,
      value: { ...valid, justification: 'Très utile' },
    });
  });

  it('accepte une note partielle (critères absents = null)', () => {
    expect(validateScoreInput({ idea_id: 'IDEA-001', impact: 4 })).toEqual({
      ok: true,
      value: {
        idea_id: 'IDEA-001',
        impact: 4,
        feasibility: null,
        strategic_fit: null,
        innovation: null,
        justification: null,
      },
    });
  });

  it('transforme une justification vide en null', () => {
    const result = validateScoreInput({ ...valid, justification: '   ' });
    expect(result.ok && result.value.justification).toBeNull();
  });

  it('refuse une note hors de 1 à 5 ou qui n\'est pas un nombre', () => {
    expect(validateScoreInput({ ...valid, impact: 6 }).ok).toBe(false);
    expect(validateScoreInput({ ...valid, impact: '4' }).ok).toBe(false);
  });

  it('refuse un identifiant manquant', () => {
    expect(validateScoreInput({ ...valid, idea_id: '' }).ok).toBe(false);
  });

  it('refuse un corps qui n\'est pas un objet', () => {
    expect(validateScoreInput(null).ok).toBe(false);
    expect(validateScoreInput('texte').ok).toBe(false);
  });

  it('refuse une justification trop longue', () => {
    expect(validateScoreInput({ ...valid, justification: 'a'.repeat(1001) }).ok).toBe(false);
  });
});