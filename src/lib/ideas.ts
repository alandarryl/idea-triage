import { getSupabase } from './supabase';
import type { Idea } from './types';

export async function getIdeas(): Promise<Idea[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('ideas').select('*').order('id');

  if (error) {
    throw new Error(`Lecture des idées impossible : ${error.message}`);
  }
  // `as Idea[]` : on affirme à TypeScript la forme des lignes de la base
  return (data ?? []) as Idea[];
}