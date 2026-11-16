import { NextResponse } from 'next/server';
import { parseIdeasCsv } from '@/lib/parseIdeasCsv';
import { getSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const text = await request.text();

  if (text.trim() === '') {
    return NextResponse.json({ error: 'Le fichier est vide.' }, { status: 400 });
  }

  const { ideas, errors } = parseIdeasCsv(text);

  if (ideas.length === 0) {
    return NextResponse.json(
      { error: 'Aucune idée valide trouvée dans ce fichier.', skipped: errors },
      { status: 400 },
    );
  }

  // upsert = insère les nouvelles idées, met à jour celles qui existent déjà
  // (même id) : on peut donc réimporter le fichier sans créer de doublons.
  const supabase = getSupabase();
  const { error } = await supabase.from('ideas').upsert(ideas, { onConflict: 'id' });

    if (error) {
    console.error('Échec upsert Supabase :', error);
    return NextResponse.json(
      { error: "L'enregistrement en base a échoué." },
      { status: 500 },
    );
  }

  return NextResponse.json({ imported: ideas.length, skipped: errors });
}