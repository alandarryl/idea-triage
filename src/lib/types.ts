export type ScoreSource = 'ai' | 'manual';
export type DuplicateStatus = 'pending' | 'confirmed' | 'dismissed';

export interface Idea {
  id: string;
  submitted_at: string;            // 'YYYY-MM-DD'
  first_name: string;
  last_name: string;
  direction: string;
  site: string | null;
  theme: string | null;
  title: string;
  description: string;
  expected_benefits: string | null;
  budget_raw: string | null;
  budget_eur: number | null;
  import_warnings: string[];
  shortlisted: boolean;
}

export interface Score {
  idea_id: string;
  impact: number | null;
  feasibility: number | null;
  strategic_fit: number | null;
  innovation: number | null;
  justification: string | null;
  source: ScoreSource;
}

export interface DuplicatePair {
  id: number;
  idea_a: string;
  idea_b: string;
  similarity: number;
  status: DuplicateStatus;
}


// Une idée avec sa note (null tant qu'elle n'a pas été notée)
export type IdeaWithScore = Idea & { score: Score | null };