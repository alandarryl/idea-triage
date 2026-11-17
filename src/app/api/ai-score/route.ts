import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { scoreIdea } from '@/lib/aiScoring';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête illisible.' }, { status: 400 });
  }

  const input = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const ideaId = input.ideaId;
  const force = input.force === true;

  if (typeof ideaId !== 'string' || ideaId.trim() === '') {
    return NextResponse.json({ error: "L'idée à pré-noter est manquante." }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: idea, error: ideaError } = await supabase
    .from('ideas')
    .select('title, description, budget_eur')
    .eq('id', ideaId)
    .maybeSingle();

  if (ideaError || !idea) {
    return NextResponse.json({ error: 'Idée introuvable.' }, { status: 404 });
  }

  if (!force) {
    const { data: existing } = await supabase
      .from('scores')
      .select('source')
      .eq('idea_id', ideaId)
      .maybeSingle();

    if (existing?.source === 'manual') {
      return NextResponse.json(
        {
          error: 'Cette idée a déjà été notée manuellement.',
          code: 'MANUAL_SCORE_EXISTS',
        },
        { status: 409 },
      );
    }
  }

  const { result: aiResult, mode } = await scoreIdea({
    title: idea.title,
    description: idea.description ?? '',
    budget_eur: idea.budget_eur,
  });

  const { error: scoreError } = await supabase.from('scores').upsert(
    {
      idea_id: ideaId,
      impact: aiResult.impact,
      feasibility: aiResult.feasibility,
      strategic_fit: aiResult.strategic_fit,
      innovation: aiResult.innovation,
      justification: aiResult.justification,
      source: 'ai',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'idea_id' },
  );

  if (scoreError) {
    return NextResponse.json({ error: "L'enregistrement de la pré-note a échoué." }, { status: 500 });
  }

  return NextResponse.json({ success: true, aiResult, mode });
}