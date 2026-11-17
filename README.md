# idea-triage

Outil de tri des idées du challenge d'innovation Hexavia, pour Camille (INSKIP).

## Aperçu

- **Application en ligne** : https://idea-triage-sage.vercel.app/ (accès protégé par un mot de passe, communiqué dans l'e-mail de rendu)
- **Dépôt** : https://github.com/alandarryl/idea-triage


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

**Assistants.** Claude a été mon assistant principal : cadrage, plan, code des modules, tests et revue. Gemini a produit une première version de la route de pré-notation par IA ; je l'ai relue, puis remplacée par une version restructurée (validation stricte de la réponse, délai maximum, repli sur la simulation).

**Méthode.** Travail par petites étapes, un commit par fonctionnalité, tests écrits avant le code de nettoyage des données, `CLAUDE.md` à la racine pour fixer les règles (pas de `any`, donnée manquante = `null`, logique pure dans `src/lib/`). Avant chaque commit : tests, `tsc`, lint et build.

**Les cinq usages les plus utiles**

1. **Cadrage et faisabilité.** J'ai soumis le sujet complet en détaillant mon niveau (à l'aise avec Next.js et Supabase, débutant en TypeScript) et mes contraintes de temps, puis demandé un planning réaliste et une analyse de faisabilité. L'assistant a proposé un découpage en étapes alignées sur les sept critères d'évaluation, avec les choix à arbitrer et ce qu'il fallait laisser hors de la V1.
2. **Tests pour chaque module de `src/lib/`.** Pour chaque fonction (budgets, dates, CSV, filtres, notation, doublons, IA simulée, export), j'ai demandé une suite de tests couvrant les cas limites, écrite avant ou avec le code. Le projet compte 95 tests.
3. **Diagnostic des erreurs.** Je collais le résultat des tests, de `tsc` ou du build et je demandais d'identifier la cause et de me l'expliquer, pas seulement de corriger. C'est ainsi que j'ai compris, par exemple, qu'un test peut passer alors que le typage est faux, car Vitest ne vérifie pas les types.
4. **Code ciblé sur des parties précises.** Interface de base (tableau, formulaire de notation), routes API (import, notes, pré-note, shortlist), accès par mot de passe. Je demandais le fichier complet, puis je relisais chaque modification avant de l'intégrer.
5. **Notes de passation.** À chaque étape, un résumé structuré : contexte, état d'avancement, règles du projet, étapes restantes. Il permet de reprendre le travail sans perdre le fil, y compris avec un autre assistant.

**Là où l'IA s'est trompée, et ce que j'ai fait.**
- **Erreur d'appréciation sur une clé d'accès.** L'import était refusé par la base (`42501`, règle de sécurité par ligne). L'assistant avait estimé, d'après sa longueur, que ma clé était la clé secrète. En vérifiant moi-même son début (`sb_publish…`), j'ai constaté que c'était la clé publique, que la base bloque volontairement. J'ai utilisé la bonne clé, et le choix de la clé fait maintenant partie de la documentation.
- **Fausses alertes.** Deux fois, l'assistant a signalé une page ou des routes manquantes en lisant une sortie tronquée. Après vérification sur la sortie complète, rien ne manquait. Depuis, je lui fournis la sortie entière avant de conclure.
- **Comportements non voulus dans le code proposé.** À la relecture, j'ai repéré : un réimport du fichier qui remettait la sélection de la shortlist à zéro ; une pré-note de l'IA qui pouvait écraser une note saisie à la main ; un type qui acceptait une valeur absente là où une note était attendue (signalé par `tsc`, pas par les tests). Chacun a été corrigé et couvert par un test.

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
| 14/11 17:45 | Cadrage, création du dépôt et du projet Next.js |
| 14/11 18:26 | Premier déploiement Vercel (page vide) |
| 15/11 14:13 | `CLAUDE.md` et `.env.example` |
| 15/11 ~14:35 | Schéma Supabase et types TypeScript |
| 15/11 ~15:40 | `parseBudget` et `parseDate`, tests d'abord |
| 16/11 ~10:59 | Parseur CSV testé sur le vrai fichier |
| 16/11 ~11:42 | Connexion Supabase : 40 idées importées |
| 16/11 ~12:12 | Tableau et filtres |
| 16/11 ~12:48 | Déploiement Vercel avec les variables d'environnement |
| 16/11 ~13:08 | Notation manuelle |
| 16/11 13:50 | IA simulée, shortlist et export, mot de passe, CI |
| 16/11 ~14:13 | Tests renforcés (doublons, IA), corrections |
| 16/11 ~15:13 | README, captures, vérification finale |


## 7. Suite et questions pour Camille

**Ce que j'ai volontairement laissé de côté dans la V1**

- **Formulaire d'ajout d'une idée.** Les idées arrivent par le fichier CSV du client, et l'import accepte un second passage sans créer de doublons : une idée tardive s'ajoute en complétant le fichier et en le réimportant. Un formulaire deviendrait utile si des collègues saisissent des idées directement, ce qui n'est pas le cas ici.
- **Suppression d'une idée.** Non retenue : l'action est irréversible pour une utilisatrice non technique, et une idée supprimée réapparaîtrait au prochain import du fichier. Le bon outil est plutôt un **statut « écartée »** (réversible, conservé dans l'historique), à prévoir dans la suite.

**Avec une journée de plus** (par ordre de priorité)

1. **Fiabilité et sécurité** : comptes et droits individuels à la place du mot de passe partagé ; limitation des essais de connexion ; sauvegarde automatique de la base.
2. **Travail de Camille** : statut « écartée » et formulaire d'ajout ; historique des notes (qui a changé quoi, quand) ; pondération des critères réglable ; plusieurs challenges dans le même outil.
3. **Qualité de l'analyse** : détection de doublons par le sens et plus seulement par les mots (la paire IDEA-017/018 en est la limite connue) ; [vrai modèle d'IA branché par `AI_API_KEY` avec repli sur la simulation, déjà prévu dans le code ; à reformuler selon l'état de la branche] ; traduction des idées en anglais (IDEA-021).
4. **Restitution** : export PDF ou page imprimable de la shortlist ; tests de l'interface et des routes API.

**Mes questions pour Camille**

1. Les 4 critères pèsent-ils autant ? Quelle est la définition exacte de chaque note de 1 à 5 ?
2. Quelles sont les priorités stratégiques d'Hexavia (pour juger l'« alignement ») ?
3. Que faire d'un doublon : garder la meilleure version, fusionner les auteurs, avertir ?
4. Comment choisir les 8 idées : seulement la note, ou un équilibre par direction, thème et budget ?
5. Le jury ou le client doivent-ils voir les noms des auteurs ?
6. Combien de temps conserver ces données personnelles ?
7. Quel format d'envoi préfères-tu : CSV, PDF, page imprimable ?
8. Faut-il traduire les idées rédigées en anglais (IDEA-021) ?
9. Après le premier import, les idées seront-elles ajoutées une à une par des collègues, ou toujours par fichier ? (Cela décide si le formulaire d'ajout est nécessaire.)
10. Faut-il pouvoir écarter une idée sans la perdre, par exemple pour garder la trace de ce qui a été refusé et pourquoi ?
