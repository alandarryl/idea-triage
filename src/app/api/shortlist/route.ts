import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { ideaId, shortlisted } = await request.json() as { ideaId: string; shortlisted: boolean };
    if (!ideaId || typeof shortlisted !== 'boolean') {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from('ideas')
      .update({ shortlisted })
      .eq('id', ideaId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}