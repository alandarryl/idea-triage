import { describe, it, expect } from 'vitest';
import {
  filterIdeas,
  distinctValues,
  EMPTY_FILTERS,
  NOT_SET,
} from './filterIdeas';
import type { Idea } from './types';

function makeIdea(overrides: Partial<Idea> = {}): Idea {
  return {
    id: 'IDEA-000',
    submitted_at: '2026-09-15',
    first_name: 'Prénom',
    last_name: 'Nom',
    direction: 'RH',
    site: 'Lyon',
    theme: 'Process',
    title: 'Titre',
    description: 'Description',
    expected_benefits: null,
    budget_raw: null,
    budget_eur: null,
    import_warnings: [],
    shortlisted: false,
    ...overrides,
  };
}

const ideas = [
  makeIdea({ id: 'IDEA-001', direction: 'RH', theme: 'Process', site: 'Lyon', title: 'Chatbot RH' }),
  makeIdea({
    id: 'IDEA-002',
    direction: 'IT',
    theme: null,
    site: null,
    title: 'Covoiturage',
    description: 'Application pour partager les trajets',
  }),
  makeIdea({ id: 'IDEA-003', direction: 'RH', theme: 'Client', site: 'Lille', title: 'Parrainage' }),
];

const ids = (list: Idea[]) => list.map((i) => i.id);

describe('filterIdeas', () => {
  it('renvoie tout sans filtre', () => {
    expect(ids(filterIdeas(ideas, EMPTY_FILTERS))).toEqual(['IDEA-001', 'IDEA-002', 'IDEA-003']);
  });

  it('filtre par direction', () => {
    const result = filterIdeas(ideas, { ...EMPTY_FILTERS, direction: 'RH' });
    expect(ids(result)).toEqual(['IDEA-001', 'IDEA-003']);
  });

  it('trouve les idées sans thème avec NOT_SET', () => {
    const result = filterIdeas(ideas, { ...EMPTY_FILTERS, theme: NOT_SET });
    expect(ids(result)).toEqual(['IDEA-002']);
  });

  it('trouve les idées sans site avec NOT_SET', () => {
    const result = filterIdeas(ideas, { ...EMPTY_FILTERS, site: NOT_SET });
    expect(ids(result)).toEqual(['IDEA-002']);
  });

  it('cherche dans le titre et la description, sans tenir compte de la casse', () => {
    expect(ids(filterIdeas(ideas, { ...EMPTY_FILTERS, search: 'COVOITURAGE' }))).toEqual(['IDEA-002']);
    expect(ids(filterIdeas(ideas, { ...EMPTY_FILTERS, search: 'trajets' }))).toEqual(['IDEA-002']);
  });

  it('cumule les filtres', () => {
    const result = filterIdeas(ideas, { ...EMPTY_FILTERS, direction: 'RH', site: 'Lille' });
    expect(ids(result)).toEqual(['IDEA-003']);
  });

  it('renvoie une liste vide quand rien ne correspond', () => {
    expect(filterIdeas(ideas, { ...EMPTY_FILTERS, search: 'zzz' })).toEqual([]);
  });
});

describe('distinctValues', () => {
  it('retire les vides et les doublons, et trie', () => {
    expect(distinctValues(['Lyon', null, 'Lille', 'Lyon'])).toEqual(['Lille', 'Lyon']);
  });
});