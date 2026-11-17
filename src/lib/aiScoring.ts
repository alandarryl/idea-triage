import { simulateAiScoring } from '@/lib/simulateAi';
import type { AiScoring } from '@/lib/simulateAi';

export type AiMode = 'ai' | 'simulated';

export interface IdeaForAi {
  title: string;
  description: string;
  budget_eur: number | null;
}

const isRating = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5;

export function parseAiResponse(text: string): AiScoring | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;

  if (
    !isRating(o.impact) ||
    !isRating(o.feasibility) ||
    !isRating(o.strategic_fit) ||
    !isRating(o.innovation) ||
    typeof o.justification !== 'string' ||
    o.justification.trim() === ''
  ) {
    return null;
  }
  return {
    impact: o.impact,
    feasibility: o.feasibility,
    strategic_fit: o.strategic_fit,
    innovation: o.innovation,
    justification: o.justification.trim().slice(0, 1000),
  };
}

async function callRealAi(idea: IdeaForAi, apiKey: string): Promise<AiScoring | null> {
  const budget = idea.budget_eur === null ? 'inconnu' : `${idea.budget_eur} euros`;
  const prompt =
    `Tu aides un consultant à trier des idées d'innovation. Note l'idée ci-dessous de 1 à 5 ` +
    `(entiers) sur : impact, feasibility, strategic_fit, innovation. ` +
    `Réponds UNIQUEMENT par un JSON valide : ` +
    `{"impact":n,"feasibility":n,"strategic_fit":n,"innovation":n,"justification":"2 phrases en français"}.\n\n` +
    `Titre : ${idea.title}\nDescription : ${idea.description}\nBudget : ${budget}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!response.ok) throw new Error(`Réponse IA ${response.status}`);

  interface GeminiResponse {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  }

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  return typeof text === 'string' ? parseAiResponse(text) : null;
}

export async function scoreIdea(
  idea: IdeaForAi,
): Promise<{ result: AiScoring; mode: AiMode }> {
  const apiKey = process.env.AI_API_KEY?.trim();

  if (apiKey) {
    try {
      const result = await callRealAi(idea, apiKey);
      if (result) return { result, mode: 'ai' };
      console.error('Réponse IA inutilisable, repli sur la simulation.');
    } catch (error) {
      console.error('Appel IA échoué, repli sur la simulation :', error);
    }
  }
  return {
    result: simulateAiScoring(idea.title, idea.description, idea.budget_eur),
    mode: 'simulated',
  };
}