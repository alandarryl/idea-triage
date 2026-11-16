import { describe, it, expect } from 'vitest';
import { simulateAiScoring } from './simulateAi';

describe('simulateAiScoring', () => {
  it('should penalize trivial ideas like free coffee', () => {
    const result = simulateAiScoring("Café gratuit pour tous", "Installer des machines à café en libre service.", 5000);
    expect(result.impact).toBe(1);
    expect(result.innovation).toBe(1);
    expect(result.justification).toContain("faible impact");
  });

  it('should return valid scores between 1 and 5 for normal ideas', () => {
    const result = simulateAiScoring("Automatisation des compresseurs", "Maintenance prédictive par capteurs IoT.", 25000);
    expect(result.impact).toBeGreaterThanOrEqual(1);
    expect(result.impact).toBeLessThanOrEqual(5);
    expect(result.feasibility).toBeGreaterThanOrEqual(1);
    expect(result.feasibility).toBeLessThanOrEqual(5);
    expect(typeof result.justification).toBe('string');
  });
});