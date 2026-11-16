export function parseBudget(raw: string | null): number | null {
  // 1. Pas de texte du tout : budget inconnu
  if (raw === null) return null;

  // 2. Nettoyage du texte
  const cleaned = raw
    .replace(/\(.*?\)/g, '') // retire les parenthèses et ce qu'il y a dedans
    .replace(/\s/g, '')      // retire tous les espaces (même insécables)
    .toLowerCase();          // "12K" devient "12k"

  // 3. Cherche un nombre, suivi éventuellement de la lettre k
  const match = cleaned.match(/(\d+(?:[.,]\d+)?)(k)?/);

  // 4. Aucun chiffre trouvé ("?", "", "à définir") : budget inconnu
  if (!match) return null;

  // 5. Calcul
  const value = parseFloat(match[1].replace(',', '.')); // "1,5" devient 1.5
  const multiplier = match[2] === 'k' ? 1000 : 1;       // "k" veut dire fois 1000
  return Math.round(value * multiplier);
}