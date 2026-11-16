import type { Idea } from './types';

// Valeur spéciale du filtre : "afficher les idées dont ce champ est vide"
export const NOT_SET = '__not_set__';

export interface IdeaFilters {
  direction: string; // '' = toutes les directions
  theme: string;     // '' = tous, NOT_SET = thème non renseigné
  site: string;      // '' = tous, NOT_SET = site non renseigné
  search: string;    // texte libre
}

export const EMPTY_FILTERS: IdeaFilters = {
  direction: '',
  theme: '',
  site: '',
  search: '',
};

function matchesOptional(value: string | null, filter: string): boolean {
  if (filter === '') return true;
  if (filter === NOT_SET) return value === null;
  return value === filter;
}

export function filterIdeas<T extends Idea>(ideas: T[], filters: IdeaFilters): T[] {
  const search = filters.search.trim().toLowerCase();

  return ideas.filter((idea) => {
    if (filters.direction !== '' && idea.direction !== filters.direction) {
      return false;
    }
    if (!matchesOptional(idea.theme, filters.theme)) return false;
    if (!matchesOptional(idea.site, filters.site)) return false;

    if (search !== '') {
      const text = `${idea.id} ${idea.title} ${idea.description}`.toLowerCase();
      if (!text.includes(search)) return false;
    }
    return true;
  });
}

// Valeurs distinctes d'une colonne, sans les vides, triées (pour les menus)
export function distinctValues(values: (string | null)[]): string[] {
  const present = values.filter((v): v is string => v !== null);
  return [...new Set(present)].sort((a, b) => a.localeCompare(b, 'fr'));
}