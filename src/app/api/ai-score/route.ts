import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { simulateAiScoring } from '@/lib/simulateAi';

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

  // 1. L'idée existe-t-elle ?
  const { data: idea, error: ideaError } = await supabase
    .from('ideas')
    .select('title, description, budget_eur')
    .eq('id', ideaId)
    .maybeSingle();

  if (ideaError) {
    console.error('Lecture idée échouée :', ideaError);
    return NextResponse.json({ error: 'La lecture de l\'idée a échoué.' }, { status: 500 });
  }
  if (!idea) {
    return NextResponse.json({ error: 'Idée introuvable.' }, { status: 404 });
  }

  // 2. On ne remplace pas une note manuelle sans confirmation explicite
  if (!force) {
    const { data: existing, error: existingError } = await supabase
      .from('scores')
      .select('source')
      .eq('idea_id', ideaId)
      .maybeSingle();

    if (existingError) {
      console.error('Lecture note échouée :', existingError);
      return NextResponse.json({ error: 'La lecture de la note a échoué.' }, { status: 500 });
    }
    if (existing?.source === 'manual') {
      return NextResponse.json(
        {
          error:
            'Cette idée a déjà été notée manuellement : la pré-note de l\'IA la remplacerait.',
          code: 'MANUAL_SCORE_EXISTS',
        },
        { status: 409 },
      );
    }
  }

  // 3. Pré-note et enregistrement avec la source 'ai'
  const aiResult = simulateAiScoring(idea.title, idea.description, idea.budget_eur);

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
    console.error('Enregistrement de la pré-note échoué :', scoreError);
    return NextResponse.json(
      { error: "L'enregistrement de la pré-note a échoué." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, aiResult });
}