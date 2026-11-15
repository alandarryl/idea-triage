import { describe, it, expect } from 'vitest';
import { parseBudget } from './parseBudget';

describe('parseBudget', () => {
  it.each([
    ['40 000 €', 40000],
    ['15k€', 15000],
    ['35k', 35000],
    ['30 000 euros', 30000],
    ['80 000 € (déplacement des machines et formation)', 80000],
    ['environ 20 000', 20000],
    ['1,5k€', 1500],
    ['12K', 12000],
    ['40\u00a0000 €', 40000],   // espace insécable
    ['40\u202f000 €', 40000],   // espace fine insécable
  ])('lit %j comme %d', (raw, expected) => {
    expect(parseBudget(raw)).toBe(expected);
  });

  it.each([null, '', '   ', '?', 'à définir'])(
    'renvoie null (budget inconnu) pour %j',
    (raw) => {
      expect(parseBudget(raw)).toBeNull();
    },
  );

  it('distingue un budget nul (0) d\'un budget inconnu (null)', () => {
    expect(parseBudget('0')).toBe(0);
    expect(parseBudget('0 €')).toBe(0);
    expect(parseBudget('')).toBeNull();
  });
});