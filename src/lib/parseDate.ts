export function parseDate(raw: string | null): string | null {
  if (raw === null) return null;
  const text = raw.trim();

  let year: number;
  let month: number;
  let day: number;

  // Format "2026-09-15" ou format français "03/10/2026"
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const fr = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else if (fr) {
    day = Number(fr[1]);
    month = Number(fr[2]);
    year = Number(fr[3]);
  } else {
    return null; // format non reconnu
  }

  // Vérifie que la date existe vraiment (refuse le 31 février, le mois 13...)
  const date = new Date(Date.UTC(year, month - 1, day));
  const exists =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  if (!exists) return null;

  // Reconstruit le texte au format AAAA-MM-JJ
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}