'use client';

import { useMemo, useState } from 'react';
import type { Idea, IdeaWithScore, Score } from '@/lib/types';
import { ScoreForm } from './ScoreForm';
import { ShortlistExportButton } from './ShortlistExportButton';
import { averageRating, formatAverage } from '@/lib/scoring';
import {
  filterIdeas,
  distinctValues,
  EMPTY_FILTERS,
  NOT_SET,
  type IdeaFilters,
} from '@/lib/filterIdeas';

const euro = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

function formatBudget(idea: Idea): string {
  if (idea.budget_eur !== null) return euro.format(idea.budget_eur);
  if (idea.budget_raw !== null) return `« ${idea.budget_raw} »`;
  return '—';
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

function NoteBadge({ score }: { score: Score | null }) {
  const average = score ? averageRating(score) : null;
  if (average === null) {
    return <span className="text-xs text-zinc-400 dark:text-zinc-600">—</span>;
  }
  return (
    <span className="inline-flex items-center font-mono text-xs font-medium text-zinc-900 dark:text-zinc-100">
      {formatAverage(average)}
      <span className="text-[10px] text-zinc-400 ml-0.5">/5</span>
    </span>
  );
}

const inputClass =
  'rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 shadow-2xs transition placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100';

export function IdeasTable({ ideas }: { ideas: IdeaWithScore[] }) {
  const [filters, setFilters] = useState<IdeaFilters>(EMPTY_FILTERS);

  const directions = useMemo(() => distinctValues(ideas.map((i) => i.direction)), [ideas]);
  const themes = useMemo(() => distinctValues(ideas.map((i) => i.theme)), [ideas]);
  const sites = useMemo(() => distinctValues(ideas.map((i) => i.site)), [ideas]);
  const hasMissingTheme = ideas.some((i) => i.theme === null);
  const hasMissingSite = ideas.some((i) => i.site === null);

  const visible = useMemo(() => filterIdeas(ideas, filters), [ideas, filters]);
  const isFiltering = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);
  const scoredCount = ideas.filter(
    (i) => i.score !== null && averageRating(i.score) !== null,
  ).length;

  function update(field: keyof IdeaFilters, value: string) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  async function handleShortlistToggle(ideaId: string, currentStatus: boolean) {
    await fetch('/api/shortlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideaId, shortlisted: !currentStatus }),
    });
    window.location.reload();
  }

  if (ideas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Aucun dossier chargé</p>
        <p className="mt-1 text-xs text-zinc-400">Importez le fichier CSV pour commencer l&apos;instruction.</p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Contrôles de filtrage épurés */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200/80 bg-white p-4 shadow-2xs dark:border-zinc-800/80 dark:bg-zinc-900 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="search"
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
            placeholder="Rechercher par mot-clé…"
            aria-label="Rechercher dans les idées"
            className={`${inputClass} w-64`}
          />
          <select
            value={filters.direction}
            onChange={(e) => update('direction', e.target.value)}
            aria-label="Filtrer par direction"
            className={inputClass}
          >
            <option value="">Toutes les directions</option>
            {directions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={filters.theme}
            onChange={(e) => update('theme', e.target.value)}
            aria-label="Filtrer par thème"
            className={inputClass}
          >
            <option value="">Tous les thèmes</option>
            {themes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
            {hasMissingTheme && <option value={NOT_SET}>Non renseigné</option>}
          </select>
          <select
            value={filters.site}
            onChange={(e) => update('site', e.target.value)}
            aria-label="Filtrer par site"
            className={inputClass}
          >
            <option value="">Tous les sites</option>
            {sites.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
            {hasMissingSite && <option value={NOT_SET}>Non renseigné</option>}
          </select>
          {isFiltering && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
            >
              Réinitialiser
            </button>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800/60 lg:border-t-0 lg:pt-0">
          <span className="text-xs text-zinc-400 font-mono">
            {visible.length} / {ideas.length} dossiers · {scoredCount} notés
          </span>
          <ShortlistExportButton items={ideas} />
        </div>
      </div>

      {/* Tableau minimaliste type reporting de conseil */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-16 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
          Aucun dossier ne correspond aux critères sélectionnés.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-2xs dark:border-zinc-800/80 dark:bg-zinc-900">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-100 bg-zinc-50/50 font-medium text-zinc-400 uppercase tracking-wider dark:border-zinc-800/80 dark:bg-zinc-900/50">
              <tr>
                <th className="w-12 px-4 py-3 text-center">Retenu</th>
                <th className="w-20 px-4 py-3 font-mono">Réf.</th>
                <th className="px-4 py-3">Intitulé du projet</th>
                <th className="px-4 py-3">Direction</th>
                <th className="px-4 py-3">Thème / Site</th>
                <th className="px-4 py-3 text-right">Budget</th>
                <th className="px-4 py-3 text-center">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {visible.map((idea) => (
                <tr key={idea.id} className="group transition hover:bg-zinc-50/60 dark:hover:bg-zinc-800/20">
                  <td className="px-4 py-3.5 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={idea.shortlisted}
                      onChange={() => void handleShortlistToggle(idea.id, idea.shortlisted)}
                      aria-label={`Short-listé l'idée ${idea.id}`}
                      className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-0 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3.5 align-middle font-mono text-zinc-400">{idea.id}</td>
                  <td className="px-4 py-3.5 align-middle">
                    <details className="group/details">
                      <summary className="cursor-pointer list-none font-medium text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300">
                        <div className="flex items-center gap-2">
                          <span>{idea.title}</span>
                          {idea.import_warnings.length > 0 && (
                            <span
                              title={idea.import_warnings.join('\n')}
                              className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-normal text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                            >
                              Anomalie
                            </span>
                          )}
                        </div>
                      </summary>
                      <div className="mt-3 space-y-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
                        <div>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">Description</span>
                          <p className="mt-1 text-zinc-600 dark:text-zinc-400 leading-relaxed">{idea.description}</p>
                        </div>
                        {idea.expected_benefits && (
                          <div>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">Bénéfices attendus</span>
                            <p className="mt-1 text-zinc-600 dark:text-zinc-400">{idea.expected_benefits}</p>
                          </div>
                        )}
                        <div className="text-[11px] text-zinc-400">
                          Porteur : {idea.first_name} {idea.last_name} — Déposé le {formatDate(idea.submitted_at)}
                        </div>
                        <div className="border-t border-zinc-200/60 pt-3 dark:border-zinc-800">
                          <ScoreForm ideaId={idea.id} score={idea.score} />
                        </div>
                      </div>
                    </details>
                  </td>
                  <td className="px-4 py-3.5 align-middle text-zinc-600 dark:text-zinc-400">{idea.direction}</td>
                  <td className="px-4 py-3.5 align-middle">
                    <div className="text-zinc-900 dark:text-zinc-100">{idea.theme ?? <span className="text-zinc-400">—</span>}</div>
                    <div className="text-[11px] text-zinc-400">{idea.site ?? 'Siège'}</div>
                  </td>
                  <td className="px-4 py-3.5 align-middle text-right font-mono text-zinc-600 dark:text-zinc-400">
                    {formatBudget(idea)}
                  </td>
                  <td className="px-4 py-3.5 align-middle text-center">
                    <NoteBadge score={idea.score} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}