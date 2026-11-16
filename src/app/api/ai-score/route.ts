import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { simulateAiScoring } from '@/lib/simulateAi';

export async function POST(request: Request) {
  try {
    const { ideaId } = await request.json() as { ideaId: string };
    if (!ideaId) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    }

    const supabase = getSupabase();
    // Récupérer l'idée pour l'analyse heuristique
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('title, description, budget_eur')
      .eq('id', ideaId)
      .single();

    if (ideaError || !idea) {
      return NextResponse.json({ error: 'Idée introuvable' }, { status: 404 });
    }

    const aiResult = simulateAiScoring(idea.title, idea.description, idea.budget_eur);

    // Enregistrer en base avec source 'ai'
    const { error: scoreError } = await supabase
      .from('scores')
      .upsert({
        idea_id: ideaId,
        impact: aiResult.impact,
        feasibility: aiResult.feasibility,
        strategic_fit: aiResult.strategic_fit,
        innovation: aiResult.innovation,
        justification: aiResult.justification,
        source: 'ai',
        updated_at: new Date().toISOString(),
      });

    if (scoreError) {
      return NextResponse.json({ error: scoreError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, aiResult });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}