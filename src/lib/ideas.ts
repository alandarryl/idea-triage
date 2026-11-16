import { getSupabase } from './supabase';
import type { Idea, IdeaWithScore, Score } from './types';

export async function getIdeasWithScores(): Promise<IdeaWithScore[]> {
  const supabase = getSupabase();

  // Les deux lectures partent en parallèle
  const [ideasResult, scoresResult] = await Promise.all([
    supabase.from('ideas').select('*').order('id'),
    supabase.from('scores').select('*'),
  ]);

  if (ideasResult.error) {
    throw new Error(`Lecture des idées impossible : ${ideasResult.error.message}`);
  }
  if (scoresResult.error) {
    throw new Error(`Lecture des notes impossible : ${scoresResult.error.message}`);
  }

  const scoreByIdea = new Map<string, Score>();
  for (const score of (scoresResult.data ?? []) as Score[]) {
    scoreByIdea.set(score.idea_id, score);
  }

  return ((ideasResult.data ?? []) as Idea[]).map((idea) => ({
    ...idea,
    score: scoreByIdea.get(idea.id) ?? null,
  }));
}