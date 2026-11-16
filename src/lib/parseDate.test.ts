import { describe, it, expect } from 'vitest';
import { parseDate } from './parseDate';

describe('parseDate', () => {
  it.each([
    ['2026-09-15', '2026-09-15'],
    ['03/10/2026', '2026-10-03'],     // format français : jour/mois/année
    ['3/10/2026', '2026-10-03'],      // sans zéro devant
    ['  2026-09-15  ', '2026-09-15'], // espaces autour
    ['29/02/2028', '2028-02-29'],     // 2028 est bissextile
  ])('lit %j comme %j', (raw, expected) => {
    expect(parseDate(raw)).toBe(expected);
  });

  it.each([null, '', 'hier', '31/02/2026', '2026-13-01', '15/09/26'])(
    'renvoie null (date invalide) pour %j',
    (raw) => {
      expect(parseDate(raw)).toBeNull();
    },
  );
});