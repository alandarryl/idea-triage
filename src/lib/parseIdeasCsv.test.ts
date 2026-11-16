import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { parseIdeasCsv } from './parseIdeasCsv';

const csv = readFileSync('src/lib/__fixtures__/idees_hexavia.csv', 'utf-8');

describe('parseIdeasCsv (fichier réel)', () => {
  const { ideas, errors } = parseIdeasCsv(csv);
  const byId = (id: string) => ideas.find((i) => i.id === id);

  it('lit les 40 idées sans erreur', () => {
    expect(ideas).toHaveLength(40);
    expect(errors).toEqual([]);
  });

  it('lit bien la première colonne malgré le BOM', () => {
    expect(byId('IDEA-001')).toBeDefined();
  });

  it('convertit la date française d\'IDEA-033 et la signale', () => {
    expect(byId('IDEA-033')?.submitted_at).toBe('2026-10-03');
    expect(byId('IDEA-033')?.import_warnings).toHaveLength(1);
  });

  it('nettoie le budget et garde le texte d\'origine', () => {
    expect(byId('IDEA-002')?.budget_eur).toBe(15000);
    expect(byId('IDEA-002')?.budget_raw).toBe('15k€');
  });

  it('distingue budget nul (0), vide (null) et illisible (null + alerte)', () => {
    expect(byId('IDEA-011')?.budget_eur).toBe(0);
    expect(byId('IDEA-007')?.budget_eur).toBeNull();
    expect(byId('IDEA-010')?.budget_eur).toBeNull();
    expect(byId('IDEA-010')?.import_warnings).toHaveLength(1);
  });

  it('transforme les champs vides en null', () => {
    expect(byId('IDEA-015')?.theme).toBeNull();
    expect(byId('IDEA-040')?.site).toBeNull();
    expect(byId('IDEA-019')?.expected_benefits).toBeNull();
  });

  it('garde intacte la description très longue d\'IDEA-023', () => {
    expect(byId('IDEA-023')?.description.length).toBeGreaterThan(800);
  });
});

describe('parseIdeasCsv (cas limites)', () => {
  const header =
    'id;date_depot;prenom;nom;direction;site;theme;titre;description;benefices_attendus;budget_estime';

  it('ignore une ligne sans titre et la signale', () => {
    const r = parseIdeasCsv(`${header}\nIDEA-900;2026-09-15;A;B;RH;Siège;Process;;desc;gain;1k`);
    expect(r.ideas).toHaveLength(0);
    expect(r.errors).toHaveLength(1);
  });

  it('renvoie une liste vide pour un fichier sans données', () => {
    expect(parseIdeasCsv(header).ideas).toEqual([]);
  });
});