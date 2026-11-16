import { describe, it, expect } from 'vitest';
import { generateShortlistCsv } from './exportShortlist';
import { IdeaWithScore } from './types';

describe('generateShortlistCsv', () => {
  it('should generate csv without author names', () => {
    const items: IdeaWithScore[] = [
      {
        id: 'IDEA-001',
        submitted_at: '2026-10-01',
        first_name: 'Alice',
        last_name: 'Dupont',
        direction: 'Tech',
        site: 'Paris',
        theme: 'IA',
        title: 'Test Idea',
        description: 'Description test',
        expected_benefits: 'Gain',
        budget_raw: '10000',
        budget_eur: 10000,
        import_warnings: [],
        shortlisted: true,
        score: { idea_id: 'IDEA-001', impact: 4, feasibility: 4, strategic_fit: 4, innovation: 4, justification: null, source: 'manual' }
      }
    ];

    const csv = generateShortlistCsv(items);
    expect(csv).toContain('IDEA-001');
    expect(csv).not.toContain('Alice');
    expect(csv).not.toContain('Dupont');
    expect(csv).toContain('4.00');
  });
});