'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CRITERIA,
  MAX_JUSTIFICATION_LENGTH,
  RATING_VALUES,
  averageRating,
  formatAverage,
  type Ratings,
} from '@/lib/scoring';
import type { Score } from '@/lib/types';

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved' }
  | { kind: 'error'; message: string };

export function ScoreForm({ ideaId, score }: { ideaId: string; score: Score | null }) {
  const router = useRouter();
  const [ratings, setRatings] = useState<Ratings>({
    impact: score?.impact ?? null,
    feasibility: score?.feasibility ?? null,
    strategic_fit: score?.strategic_fit ?? null,
    innovation: score?.innovation ?? null,
  });
  const [justification, setJustification] = useState(score?.justification ?? '');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const average = averageRating(ratings);

  async function save() {
    setStatus({ kind: 'saving' });
    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea_id: ideaId, ...ratings, justification }),
      });
      const data: { error?: string } = await response.json();

      if (!response.ok) {
        setStatus({ kind: 'error', message: data.error ?? "L'enregistrement a échoué." });
        return;
      }
      setStatus({ kind: 'saved' });
      router.refresh();
    } catch {
      setStatus({ kind: 'error', message: 'Impossible de joindre le serveur. Réessayez.' });
    }
  }

  async function handleAiPreScore() {
    setStatus({ kind: 'saving' });
    try {
      const res = await fetch('/api/ai-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ kind: 'error', message: data.error ?? "La pré-notation IA a échoué." });
        return;
      }

      window.location.reload();
    } catch {
      setStatus({ kind: 'error', message: 'Impossible de joindre le serveur pour la pré-note.' });
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      className="mt-3 space-y-3 rounded-md border border-black/10 p-3 dark:border-white/20"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs opacity-70">Échelle : 1 = très faible, 5 = très fort.</p>
        <button
          type="button"
          onClick={() => void handleAiPreScore()}
          className="rounded-md border border-blue-600 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
        >
          🤖 Pré-noter par l'IA
        </button>
      </div>

      {CRITERIA.map(({ key, label, hint }) => (
        <fieldset key={key}>
          <legend className="text-sm font-medium">{label}</legend>
          <p className="text-xs opacity-70">{hint}</p>
          <div className="mt-1 flex gap-2">
            {RATING_VALUES.map((value) => (
              <label
                key={value}
                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border text-sm focus-within:ring-2 focus-within:ring-blue-600 ${
                  ratings[key] === value
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-black/20 dark:border-white/25'
                }`}
              >
                <input
                  type="radio"
                  name={`${ideaId}-${key}`}
                  value={value}
                  checked={ratings[key] === value}
                  onChange={() => setRatings((current) => ({ ...current, [key]: value }))}
                  className="sr-only"
                />
                {value}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <div>
        <label htmlFor={`${ideaId}-justification`} className="text-sm font-medium">
          Justification (facultative)
        </label>
        <textarea
          id={`${ideaId}-justification`}
          value={justification}
          onChange={(event) => setJustification(event.target.value)}
          maxLength={MAX_JUSTIFICATION_LENGTH}
          rows={3}
          className="mt-1 w-full rounded-md border border-black/20 bg-transparent p-2 text-sm dark:border-white/25"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status.kind === 'saving'}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {status.kind === 'saving' ? 'Enregistrement…' : 'Enregistrer la note'}
        </button>
        <span className="text-sm">
          Moyenne :{' '}
          {average === null ? (
            <span className="opacity-70">incomplète (notez les 4 critères)</span>
          ) : (
            <strong>{formatAverage(average)} / 5</strong>
          )}
        </span>
        <span aria-live="polite" className="text-sm">
          {status.kind === 'saved' && (
            <span className="text-green-700 dark:text-green-400">Note enregistrée.</span>
          )}
          {status.kind === 'error' && (
            <span className="text-red-700 dark:text-red-400">{status.message}</span>
          )}
        </span>
      </div>
    </form>
  );
}