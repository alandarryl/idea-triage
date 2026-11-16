'use client';

import { useMemo, useState } from 'react';
import type { Idea } from '@/lib/types';
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
  if (idea.budget_raw !== null) return `Non interprété (« ${idea.budget_raw} »)`;
  return 'Non renseigné';
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

const selectClass =
  'rounded-md border border-black/20 bg-transparent px-3 py-2 text-sm dark:border-white/25';

export function IdeasTable({ ideas }: { ideas: Idea[] }) {
  const [filters, setFilters] = useState<IdeaFilters>(EMPTY_FILTERS);

  const directions = useMemo(() => distinctValues(ideas.map((i) => i.direction)), [ideas]);
  const themes = useMemo(() => distinctValues(ideas.map((i) => i.theme)), [ideas]);
  const sites = useMemo(() => distinctValues(ideas.map((i) => i.site)), [ideas]);
  const hasMissingTheme = ideas.some((i) => i.theme === null);
  const hasMissingSite = ideas.some((i) => i.site === null);

  const visible = useMemo(() => filterIdeas(ideas, filters), [ideas, filters]);
  const isFiltering = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  function update(field: keyof IdeaFilters, value: string) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  if (ideas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-black/20 p-10 text-center dark:border-white/25">
        <p className="font-medium">Aucune idée pour l&apos;instant.</p>
        <p className="mt-1 text-sm opacity-70">
          Importez le fichier CSV exporté du formulaire pour commencer.
        </p>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
          placeholder="Rechercher dans les idées…"
          aria-label="Rechercher dans les idées"
          className={`${selectClass} w-64`}
        />
        <select
          value={filters.direction}
          onChange={(e) => update('direction', e.target.value)}
          aria-label="Filtrer par direction"
          className={selectClass}
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
          className={selectClass}
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
          className={selectClass}
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
            className="text-sm underline"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      <p className="mb-2 text-sm opacity-70">
        {visible.length} idée(s) affichée(s) sur {ideas.length}
      </p>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-black/10 p-6 text-center dark:border-white/20">
          Aucune idée ne correspond à ces filtres.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/20">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/5 dark:bg-white/10">
              <tr>
                <th className="px-3 py-2 font-medium">N°</th>
                <th className="px-3 py-2 font-medium">Idée</th>
                <th className="px-3 py-2 font-medium">Direction</th>
                <th className="px-3 py-2 font-medium">Site</th>
                <th className="px-3 py-2 font-medium">Thème</th>
                <th className="px-3 py-2 font-medium">Budget</th>
                <th className="px-3 py-2 font-medium">Déposée le</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((idea) => (
                <tr key={idea.id} className="border-t border-black/10 align-top dark:border-white/20">
                  <td className="whitespace-nowrap px-3 py-2 opacity-70">{idea.id}</td>
                  <td className="px-3 py-2">
                    <details>
                      <summary className="cursor-pointer font-medium">
                        {idea.title}
                        {idea.import_warnings.length > 0 && (
                          <span
                            title={idea.import_warnings.join('\n')}
                            className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-normal text-amber-900"
                          >
                            à vérifier
                          </span>
                        )}
                      </summary>
                      <div className="mt-2 max-w-prose space-y-2">
                        <p>{idea.description}</p>
                        <p>
                          <span className="font-medium">Bénéfices attendus : </span>
                          {idea.expected_benefits ?? 'Non renseigné'}
                        </p>
                        <p className="opacity-70">
                          Déposée par {idea.first_name} {idea.last_name}
                        </p>
                        {idea.import_warnings.map((w) => (
                          <p key={w} className="text-amber-700 dark:text-amber-400">⚠ {w}</p>
                        ))}
                      </div>
                    </details>
                  </td>
                  <td className="px-3 py-2">{idea.direction}</td>
                  <td className="px-3 py-2">{idea.site ?? <span className="opacity-60">Non renseigné</span>}</td>
                  <td className="px-3 py-2">{idea.theme ?? <span className="opacity-60">Non renseigné</span>}</td>
                  <td className="whitespace-nowrap px-3 py-2">{formatBudget(idea)}</td>
                  <td className="whitespace-nowrap px-3 py-2">{formatDate(idea.submitted_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}