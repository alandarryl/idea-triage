import Papa from 'papaparse';
import type { Idea } from './types';
import { parseBudget } from './parseBudget';
import { parseDate } from './parseDate';

export interface ParsedCsv {
  ideas: Idea[];
  errors: string[]; // lignes ignorées, avec la raison
}

// Texte vide ou espaces seulement => null
function emptyToNull(value: string | undefined): string | null {
  const v = (value ?? '').trim();
  return v === '' ? null : v;
}

export function parseIdeasCsv(text: string): ParsedCsv {
  // Retire le BOM (caractère invisible en début de fichier)
  const clean = text.replace(/^\uFEFF/, '');

  const result = Papa.parse<Record<string, string>>(clean, {
    header: true,
    delimiter: ';',
    skipEmptyLines: true,
  });

  const ideas: Idea[] = [];
  const errors: string[] = [];

  result.data.forEach((row, index) => {
    const line = index + 2; // +1 pour l'en-tête, +1 car on compte à partir de 1

    const id = emptyToNull(row.id);
    const firstName = emptyToNull(row.prenom);
    const lastName = emptyToNull(row.nom);
    const direction = emptyToNull(row.direction);
    const title = emptyToNull(row.titre);
    const description = emptyToNull(row.description);

    if (!id || !firstName || !lastName || !direction || !title || !description) {
      errors.push(`Ligne ${line} ignorée : un champ obligatoire est vide.`);
      return;
    }

    const warnings: string[] = [];

    // Date
    const rawDate = (row.date_depot ?? '').trim();
    const submittedAt = parseDate(rawDate);
    if (submittedAt === null) {
      errors.push(`${id} ignorée : date illisible (« ${rawDate} »).`);
      return;
    }
    if (rawDate !== submittedAt) {
      warnings.push(`Date « ${rawDate} » lue au format jour/mois/année.`);
    }

    // Budget
    const budgetRaw = emptyToNull(row.budget_estime);
    const budgetEur = budgetRaw === null ? null : parseBudget(budgetRaw);
    if (budgetRaw !== null && budgetEur === null) {
      warnings.push(`Budget « ${budgetRaw} » non interprété.`);
    }

    ideas.push({
      id,
      submitted_at: submittedAt,
      first_name: firstName,
      last_name: lastName,
      direction,
      site: emptyToNull(row.site),
      theme: emptyToNull(row.theme),
      title,
      description,
      expected_benefits: emptyToNull(row.benefices_attendus),
      budget_raw: budgetRaw,
      budget_eur: budgetEur,
      import_warnings: warnings,
      shortlisted: false,
    });
  });

  return { ideas, errors };
}