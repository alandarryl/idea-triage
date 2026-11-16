import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { simulateAiScoring } from './simulateAi';
import { parseIdeasCsv } from './parseIdeasCsv';

describe('simulateAiScoring', () => {
  it('note très bas une idée de confort comme le café gratuit', () => {
    const result = simulateAiScoring('Café gratuit', 'Rendre le café gratuit dans tous les ateliers.', null);
    expect(result.impact).toBe(1);
    expect(result.strategic_fit).toBe(1);
    expect(result.innovation).toBe(1);
  });

  it('donne le même résultat à chaque appel (simulation déterministe)', () => {
    const first = simulateAiScoring('Portail client', 'Suivi en ligne des interventions', 80000);
    const second = simulateAiScoring('Portail client', 'Suivi en ligne des interventions', 80000);
    expect(first).toEqual(second);
  });

  it('adapte la faisabilité au budget', () => {
    const feasibility = (budget: number | null) =>
      simulateAiScoring('Idée', 'Description neutre', budget).feasibility;
    expect(feasibility(80000)).toBe(2);
    expect(feasibility(5000)).toBe(4);
    expect(feasibility(0)).toBe(4);
    expect(feasibility(null)).toBe(3);
    expect(feasibility(50000)).toBe(3);
    expect(feasibility(10000)).toBe(3);
  });

  it('reconnaît un enjeu de sécurité ou de client (impact plus haut)', () => {
    expect(simulateAiScoring('Casque', 'Améliorer la sécurité des ateliers', null).impact).toBe(4);
    expect(simulateAiScoring('Portail', 'Mieux informer le client', null).impact).toBe(4);
    expect(simulateAiScoring('Idée', 'Description neutre', null).impact).toBe(3);
  });

  it('reconnaît le mot IA, mais pas les lettres "ia" au milieu d\'un mot', () => {
    expect(simulateAiScoring('Assistant IA', 'Répond aux questions des salariés', null).innovation).toBe(4);
    expect(simulateAiScoring('Vestiaires', 'Chauffer les vestiaires du site commercial', null).innovation).toBe(3);
  });

  it('fournit toujours une justification', () => {
    expect(simulateAiScoring('Café gratuit', 'Café', null).justification.length).toBeGreaterThan(0);
    expect(simulateAiScoring('Autre', 'Autre idée', 1000).justification.length).toBeGreaterThan(0);
  });
});

describe('simulateAiScoring (40 idées réelles)', () => {
  const csv = readFileSync('src/lib/__fixtures__/idees_hexavia.csv', 'utf-8');
  const { ideas } = parseIdeasCsv(csv);
  const scored = ideas.map((idea) => {
    const r = simulateAiScoring(idea.title, idea.description, idea.budget_eur);
    return { id: idea.id, ratings: [r.impact, r.feasibility, r.strategic_fit, r.innovation] };
  });
  const average = (ratings: number[]) => ratings.reduce((s, v) => s + v, 0) / ratings.length;

  it('donne des notes entières entre 1 et 5 pour chaque critère', () => {
    for (const { ratings } of scored) {
      for (const value of ratings) {
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(5);
      }
    }
  });

  it('note IDEA-015 (café gratuit) plus bas que toutes les autres idées', () => {
    const cafe = scored.find((s) => s.id === 'IDEA-015');
    if (!cafe) throw new Error('IDEA-015 introuvable dans la fixture');
    const cafeAverage = average(cafe.ratings);
    const others = scored.filter((s) => s.id !== 'IDEA-015');
    expect(others.every((s) => average(s.ratings) > cafeAverage)).toBe(true);
  });
});