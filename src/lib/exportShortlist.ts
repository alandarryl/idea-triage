import { IdeaWithScore } from './types';

export function generateShortlistCsv(items: IdeaWithScore[]): string {
  const headers = ['ID', 'Direction', 'Theme', 'Titre', 'Description', 'Benefices attendus', 'Budget estime (EUR)', 'Moyenne notes'];
  
  const rows = items.map((item) => {
    const scores = [item.score?.impact, item.score?.feasibility, item.score?.strategic_fit, item.score?.innovation];
    const validScores = scores.filter((s): s is number => s !== null);
    const avg = validScores.length === 4 ? (validScores.reduce((a, b) => a + b, 0) / 4).toFixed(2) : 'Non noté';

    return [
      item.id,
      item.direction,
      item.theme ?? '',
      item.title,
      item.description,
      item.expected_benefits ?? '',
      item.budget_eur?.toString() ?? '',
      avg,
    ];
  });

  const escapeField = (field: string) => `"${field.replace(/"/g, '""')}"`;

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(escapeField).join(';'))
  ].join('\r\n');

  // Ajout du BOM UTF-8 pour Excel
  return '\uFEFF' + csvContent;
}