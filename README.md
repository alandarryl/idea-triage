# idea-triage

Outil de tri des idées du challenge d'innovation Hexavia, pour Camille (INSKIP).

## Aperçu

- **Application en ligne** : https://idea-triage-sage.vercel.app/ (accès protégé par un mot de passe, communiqué dans l'e-mail de rendu)
- **Dépôt** : https://github.com/alandarryl/idea-triage

| Tableau et filtres | Notation d'une idée | Shortlist et export |
|---|---|---|
| ![Tableau](docs/screenshots/tableau.png) | ![Notation](docs/screenshots/notation.png) | ![Shortlist](docs/screenshots/shortlist.png) |

<!-- [À COMPLÉTER] 3 captures dans docs/screenshots/ (supprimer ce commentaire ensuite) -->

## Lancer l'outil

```bash
git clone https://github.com/alandarryl/idea-triage.git
cd idea-triage
npm install
cp .env.example .env.local   # PowerShell : copy .env.example .env.local
npm run dev                  # http://localhost:3000
```

1. Créer un projet Supabase gratuit, puis exécuter `supabase/schema.sql` dans **SQL Editor → Run**.
2. Renseigner `.env.local` (les noms des variables sont dans `.env.example`) : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (clé **secrète**), `APP_PASSWORD`, et `AI_API_KEY` (vide = IA simulée).
3. Dans l'application, cliquer sur « Importer un fichier CSV » et choisir `idees_hexavia.csv`.
4. `npm test` lance les tests, `npm run build` vérifie la compilation.

## 1. Cadrage

**Le besoin.** Camille a une quarantaine d'idées à départager avant le jury, dans dix jours, et dépouille tout à la main dans Excel : c'est long et sa notation manque de cohérence d'une idée à l'autre. Il lui faut voir toutes les idées et les filtrer, les noter sur la grille du client, obtenir une pré-note de l'IA qu'elle corrige, repérer les doublons et sortir une shortlist d'environ 8 idées.

**Qui l'utilise.** Camille, qui n'est pas technique (aucun réglage, vocabulaire simple), puis ses collègues sur d'autres challenges. Le client ne reçoit que la shortlist exportée.

**Hypothèses** (je n'ai pas pu poser de questions) :
- Notes entières de 1 à 5 sur 4 critères ; la note globale est la **moyenne simple** (la grille ne donne aucune pondération), calculée seulement quand les 4 critères sont notés.
- `03/10/2026` se lit jour/mois/année. Les budgets libres (`15k€`, `30 000 euros`…) sont convertis en euros ; vide ou illisible = **inconnu** (`null`), `0` = budget réellement nul. Le texte d'origine est conservé.
- Les doublons sont **signalés** avec un score, jamais supprimés : Camille décide.
- Les noms des auteurs sont des données personnelles : visibles dans le détail d'une idée (usage interne, derrière mot de passe), **absents de l'export** destiné au client.
- L'IA est simulée (pas de clé API) ; la clé se renseigne par variable d'environnement.

**Dans la V1** : import CSV, tableau filtrable, notation manuelle, pré-note IA simulée, détection de doublons, shortlist exportable, mot de passe, tests, CI, mise en ligne. **Plus tard** : vrai modèle d'IA, comptes utilisateurs, historique des notes, pondération réglable, plusieurs challenges.

## 2. Conception

**Architecture.** Next.js (App Router) : les pages sont rendues côté serveur et les routes `/api/...` écrivent dans Supabase. Le navigateur n'accède jamais à la base : la sécurité par ligne (RLS) est activée **sans aucune règle d'accès**, et seul le code serveur utilise la clé secrète.

**Modèle de données** (`supabase/schema.sql`) :
- `ideas` : colonnes du CSV + `budget_raw` (texte d'origine), `budget_eur` (nombre ou `null`), `import_warnings`, `shortlisted`.
- `scores` : une ligne par idée, 4 notes (1 à 5, vides tant que non notées), justification, `source` (`ai` ou `manual`).
- `duplicate_pairs` : couple d'idées, score de similarité, statut (`pending`, `confirmed`, `dismissed`).

| Choix | Raison |
|---|---|
| Next.js avec routes API | Cache les clés côté serveur ; une seule application à déployer |
| Supabase (Postgres) | Imposé par la stack d'INSKIP ; contraintes SQL (notes 1 à 5, `idea_a < idea_b`) |
| `budget_raw` + `budget_eur` | On ne perd rien et on peut corriger la conversion plus tard |
| Import par `upsert` sur `id` | Réimporter le fichier ne crée pas de doublons |
| Logique dans `src/lib/` en fonctions pures | Testable sans base ni navigateur |
| Une seule note par idée | Simple pour la V1 (historique dans « Suite ») |
| Mot de passe partagé (`src/proxy.ts`) | Protège pages **et** routes API sans gérer de comptes |

## 3. Construction avec l'IA

**Assistant** : Claude, en conversation guidée étape par étape. [À COMPLÉTER : préciser tout autre assistant utilisé, et pour quelles étapes.] Méthode : petites étapes, un commit par fonctionnalité, **tests écrits avant le code de nettoyage**, `CLAUDE.md` à la racine pour les consignes.

**Prompts les plus utiles** [À ADAPTER avec tes formulations exactes] :
1. « Voici le projet reçu pour un stage… j'ai décidé d'utiliser Next.js et Supabase avec TypeScript… guide-moi tout au long du projet. Qu'en penses-tu et que me proposes-tu ? » (cadrage et plan en 7 étapes)
2. « Je suis à l'aise avec Next.js et Supabase, mais pas avec TypeScript » (explications ciblées sur les types)
3. « Pourquoi as-tu modifié ai-score ? Qu'as-tu changé ? Sois plus claire. » (je garde la main sur ce qui est produit)
4. Prompt de passation (contexte, état, règles, étapes restantes) pour reprendre le travail avec une autre IA.

**Un moment où l'IA s'est trompée.** À l'import, Postgres refusait l'écriture (`42501 : violates row-level security policy`). L'assistant avait jugé que ma clé de 46 caractères était la clé secrète ; en lisant ses 10 premiers caractères (`sb_publish…`), j'ai vu que c'était la clé **publique**, que la RLS bloque justement. J'ai pris la clé secrète. Autres erreurs repérées en relecture : un réimport qui remettait `shortlisted` à `false`, une pré-note IA qui écrasait une note manuelle, et un type de retour qui laissait passer `null` (détecté par `tsc`, pas par les tests).

## 4. Fiabilisation

95 tests (Vitest) sur la logique qui compte :
- **Import** : formats de budget (`15k€`, `30 000 euros`, `0` ≠ inconnu), dates (jour/mois/année, dates impossibles), et le **vrai fichier** (BOM, 40 idées, champs vides à `null`, alertes).
- **Notation** : bornes 1 à 5, moyenne seulement si les 4 critères sont notés, validation côté serveur.
- **Doublons** : accents, mots courants, paires connues du fichier (IDEA-002/014 identiques, IDEA-003/019 probable, IDEA-001/007 et 008/027 à vérifier).
- **IA simulée** : déterministe, notes toujours entre 1 et 5, « Café gratuit » noté plus bas que toutes les autres.
- **Export** : fichier sans noms d'auteurs.

**CI** (GitHub Actions, `.github/workflows/ci.yml`) : à chaque push, installe, lance le lint, les tests et le build. [À VÉRIFIER dans ci.yml] Les clés de la CI sont des valeurs factices.

**Limites connues** : pas de test de l'interface ni des routes API (vérifiées à la main) ; la paire IDEA-017/018 (même sujet reformulé) n'est pas détectée par une comparaison de mots ; un budget écrit `40.000 €` serait mal lu.

## 5. Livraison

- **Configuration** : variables d'environnement (`.env.example`), posées aussi dans Vercel. Aucun secret dans le dépôt ni dans l'historique.
- **Données personnelles** : accès par mot de passe (cookie, routes API en 401 sans connexion), base fermée à la clé publique, noms d'auteurs absents de l'export.
- **Avant de la confier à Camille** : un vrai modèle d'IA n'est pas branché [À VÉRIFIER : `AI_API_KEY` est-elle lue ?] ; le mot de passe est partagé (pas de comptes, pas de limite d'essais, le cookie contient le mot de passe) ; pas d'historique des notes ; pas de sauvegarde automatique de la base.

## 6. Journal

| Quand | Étape |
|---|---|
| 14/11 21:45 | Cadrage, création du dépôt et du projet Next.js |
| 14/11 22:26 | Premier déploiement Vercel (page vide) |
| 15/11 22:13 | `CLAUDE.md` et `.env.example` |
| 15/11 ~22:35 | Schéma Supabase et types TypeScript |
| 16/11 ~05:40 | `parseBudget` et `parseDate`, tests d'abord |
| 16/11 ~05:59 | Parseur CSV testé sur le vrai fichier |
| 16/11 ~06:42 | Connexion Supabase : 40 idées importées |
| 16/11 ~07:12 | Tableau et filtres |
| 16/11 ~07:48 | Déploiement Vercel avec les variables d'environnement |
| 16/11 ~08:08 | Notation manuelle |
| 16/11 [HH:MM] | IA simulée, shortlist et export, mot de passe, CI |
| 16/11 ~13:13 | Tests renforcés (doublons, IA), corrections |
| [JJ/MM HH:MM] | README, captures, vérification finale |

<!-- [À COMPLÉTER] Heures exactes : git log --reverse --format="%ad  %s" --date=format:"%d/%m %H:%M". Temps total travaillé : [X h]. -->

## 7. Suite et questions pour Camille

**Avec une journée de plus** : brancher un vrai modèle d'IA par `AI_API_KEY` ; comptes et droits ; historique des notes ; pondération des critères réglable ; détection de doublons par le sens (et plus seulement par les mots) ; export PDF ; tests de l'interface ; plusieurs challenges ; limiter les essais de connexion.

**Mes questions pour Camille** :
1. Les 4 critères pèsent-ils autant ? Quelle est la définition exacte de chaque note de 1 à 5 ?
2. Quelles sont les priorités stratégiques d'Hexavia (pour juger l'« alignement ») ?
3. Que faire d'un doublon : garder la meilleure version, fusionner les auteurs, avertir ?
4. Comment choisir les 8 idées : seulement la note, ou un équilibre par direction, thème et budget ?
5. Le jury ou le client doivent-ils voir les noms des auteurs ?
6. Combien de temps conserver ces données personnelles ?
7. Quel format d'envoi préfères-tu : CSV, PDF, page imprimable ?
8. Faut-il traduire les idées rédigées en anglais (IDEA-021) ?