@AGENTS.md

# idea-triage

Outil interne INSKIP pour trier les idées d'un challenge d'innovation.
Utilisatrice : Camille, consultante, non technique.
Données de test : `idees_hexavia.csv` (40 idées, volontairement imparfaites).

## Stack
Next.js (App Router, dossier `src/`), TypeScript strict, Tailwind,
Supabase (Postgres), Vitest, GitHub Actions, Vercel.

## Commandes
- `npm run dev` : lancer en local
- `npm run lint` : ESLint
- `npx tsc --noEmit` : vérifier les types
- `npm test` : tests Vitest (à configurer)

## Règles de code
- TypeScript strict : pas de `any`. Pour les données externes (CSV, API),
  utiliser `unknown` puis valider.
- Donnée manquante = `null`, jamais `""` ni `0`. Un budget de 0 est un vrai
  budget nul, différent d'un budget inconnu : tester `=== null`,
  jamais `if (budget)`.
- La logique métier (parseBudget, parseDate, similarité, score) est écrite
  en fonctions pures dans `src/lib/`, sans React ni Supabase, avec ses tests
  à côté.
- Code et identifiants en anglais, textes de l'interface en français.

## Méthode de travail
- Petites étapes : une fonctionnalité = un commit (`feat:`, `fix:`, `test:`,
  `chore:`).
- Pour la logique de nettoyage : écrire les tests d'abord, puis le code.
- Le développeur est débutant en TypeScript : expliquer en une ou deux
  phrases toute notion nouvelle.
- Ne pas ajouter de dépendance sans en donner la raison.

## Sécurité et données personnelles
- Aucun secret dans le dépôt : tout passe par `.env.local` (ignoré par git).
  Tenir `.env.example` à jour.
- Les clés secrètes restent côté serveur : jamais de préfixe `NEXT_PUBLIC_`.
- Noms et prénoms des auteurs = données personnelles : absents de l'export
  destiné au client par défaut.

## Hypothèses métier
Voir la partie « Cadrage » du README.