import type { Score } from './types';

export type CriterionKey =
  | 'impact'
  | 'feasibility'
  | 'strategic_fit'
  | 'innovation';

// Les 4 notes d'une idée : un entier de 1 à 5, ou null si pas encore donnée.
// Pick<Score, ...> = "les seuls champs de Score listés ici".
export type Ratings = Pick<Score, CriterionKey>;

export interface ScoreInput extends Ratings {
  idea_id: string;
  justification: string | null;
}

export type ValidationResult =
  | { ok: true; value: ScoreInput }
  | { ok: false; error: string };

export interface Criterion {
  key: CriterionKey;
  label: string;
  hint: string;
}

export const CRITERIA: Criterion[] = [
  {
    key: 'impact',
    label: "Impact pour l'entreprise",
    hint: 'Gain attendu : temps, argent, sécurité, image.',
  },
  {
    key: 'feasibility',
    label: 'Faisabilité',
    hint: 'Facilité de mise en œuvre : budget, technologie, délais.',
  },
  {
    key: 'strategic_fit',
    label: 'Alignement stratégique',
    hint: 'Cohérence avec les priorités du groupe.',
  },
  {
    key: 'innovation',
    label: 'Caractère innovant',
    hint: 'Nouveauté par rapport à ce qui existe déjà.',
  },
];

export const RATING_VALUES = [1, 2, 3, 4, 5];
export const MAX_JUSTIFICATION_LENGTH = 1000;

export function isValidRating(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

// Moyenne simple des 4 critères, ou null si l'un d'eux manque
export function averageRating(ratings: Ratings): number | null {
  const given = CRITERIA.map((c) => ratings[c.key]).filter(
    (v): v is number => v !== null,
  );
  if (given.length !== CRITERIA.length) return null;
  return given.reduce((sum, v) => sum + v, 0) / given.length;
}

export function formatAverage(value: number): string {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Vérifie des données reçues du navigateur (type inconnu) avant de les enregistrer
export function validateScoreInput(raw: unknown): ValidationResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'Données invalides.' };
  }
  const body = raw as Record<string, unknown>;

  if (typeof body.idea_id !== 'string' || body.idea_id.trim() === '') {
    return { ok: false, error: "L'idée à noter est manquante." };
  }

  for (const { key, label } of CRITERIA) {
    const value = body[key];
    if (value !== null && value !== undefined && !isValidRating(value)) {
      return {
        ok: false,
        error: `La note « ${label} » doit être un entier de 1 à 5.`,
      };
    }
  }

  const justification =
    typeof body.justification === 'string' ? body.justification.trim() : '';
  if (justification.length > MAX_JUSTIFICATION_LENGTH) {
    return {
      ok: false,
      error: `La justification ne peut pas dépasser ${MAX_JUSTIFICATION_LENGTH} caractères.`,
    };
  }

  const rating = (value: unknown): number | null =>
    isValidRating(value) ? value : null;

  return {
    ok: true,
    value: {
      idea_id: body.idea_id.trim(),
      impact: rating(body.impact),
      feasibility: rating(body.feasibility),
      strategic_fit: rating(body.strategic_fit),
      innovation: rating(body.innovation),
      justification: justification === '' ? null : justification,
    },
  };
}