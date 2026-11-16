import { NextResponse } from 'next/server';
import { validateScoreInput } from '@/lib/scoring';
import { getSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête illisible.' }, { status: 400 });
  }

  const result = validateScoreInput(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase.from('scores').upsert(
    {
      ...result.value,
      source: 'manual',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'idea_id' },
  );

  if (error) {
    console.error('Échec enregistrement de la note :', error);
    if (error.code === '23503') {
      return NextResponse.json({ error: "Cette idée n'existe pas." }, { status: 404 });
    }
    return NextResponse.json(
      { error: "L'enregistrement de la note a échoué." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}