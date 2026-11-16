import { describe, it, expect } from 'vitest';
import { detectDuplicates } from './detectDuplicates';
import { Idea } from './types';

describe('detectDuplicates', () => {
  it('should detect similar ideas based on text overlap', () => {
    const ideas: Idea[] = [
      {
        id: 'IDEA-001',
        submitted_at: '2026-10-01',
        first_name: 'Alice',
        last_name: 'Dupont',
        direction: 'Tech',
        site: 'Paris',
        theme: 'IA',
        title: 'Chatbot RH interne',
        description: 'Mise en place d\'un chatbot pour répondre aux questions RH des salariés.',
        expected_benefits: 'Gain de temps',
        budget_raw: '10000',
        budget_eur: 10000,
        import_warnings: [],
        shortlisted: false,
      },
      {
        id: 'IDEA-003',
        submitted_at: '2026-10-02',
        first_name: 'Bob',
        last_name: 'Martin',
        direction: 'RH',
        site: 'Lyon',
        theme: 'RH',
        title: 'Assistant RH virtuel',
        description: 'Un chatbot pour automatiser les réponses aux questions RH des collaborateurs.',
        expected_benefits: 'Productivité',
        budget_raw: '12000',
        budget_eur: 12000,
        import_warnings: [],
        shortlisted: false,
      },
    ];

    const pairs = detectDuplicates(ideas);
    expect(pairs.length).toBeGreaterThan(0);
    expect(pairs[0].idea_a).toBe('IDEA-001');
    expect(pairs[0].idea_b).toBe('IDEA-003');
    expect(pairs[0].similarity).toBeGreaterThan(0.25);
  });
});