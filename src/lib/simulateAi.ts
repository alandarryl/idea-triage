// Résultat de la simulation : les 4 notes sont toujours présentes (jamais null)
export interface AiScoring {
  impact: number;
  feasibility: number;
  strategic_fit: number;
  innovation: number;
  justification: string;
}

export function simulateAiScoring(title: string, description: string, budgetEur: number | null): AiScoring {
  const text = (title + ' ' + description).toLowerCase();

  if (text.includes('café') || text.includes('machine à café') || text.includes('baby-foot')) {
    return {
      impact: 1,
      feasibility: 5,
      strategic_fit: 1,
      innovation: 1,
      justification: "Idée à faible impact stratégique et peu innovante, malgré une faisabilité élevée."
    };
  }

    let impact = 3;
    let feasibility = 3;
    const strategic_fit = 3;
    let innovation = 3;

  if (text.includes('client') || text.includes('chiffre d\'affaires') || text.includes('productivité') || text.includes('sécurité')) {
    impact = 4;
  }
  if (/\bia\b/.test(text) || text.includes('automatisation') || text.includes('plateforme') || text.includes('capteurs')) {
    innovation = 4;
  }
  if (budgetEur !== null && budgetEur > 50000) {
    feasibility = 2;
  } else if (budgetEur !== null && budgetEur < 10000) {
    feasibility = 4;
  }

  const clamp = (n: number) => Math.max(1, Math.min(5, n)) as 1 | 2 | 3 | 4 | 5;

  return {
    impact: clamp(impact),
    feasibility: clamp(feasibility),
    strategic_fit: clamp(strategic_fit),
    innovation: clamp(innovation),
    justification: "Pré-note générée automatiquement par heuristique (mots-clés et budget). Ajustable par le jury."
  };
}