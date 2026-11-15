## 1. Cadrage

**Le besoin de Camille.** Camille, consultante chez INSKIP, accompagne le
groupe industriel Hexavia sur son challenge d'innovation. Elle a 40 idées à
départager avant le jury, dans dix jours, et dépouille tout à la main dans
Excel. C'est long, et sa notation manque de cohérence d'une idée à l'autre.
Il lui faut un outil pour voir toutes les idées, les noter sur la grille du
client, repérer les doublons et sortir une shortlist d'environ 8 idées.

**Qui l'utilise.** Camille d'abord : elle n'est pas technique, donc aucun
réglage ni vocabulaire informatique. Ensuite ses collègues d'INSKIP, sur
d'autres challenges. Le client reçoit seulement la shortlist exportée.

**Hypothèses** (je n'ai pas pu poser de questions à Camille) :
- Les notes sont des entiers de 1 à 5. La note globale est la moyenne des
  4 critères, à poids égal, car la grille du client ne donne aucune
  pondération.
- Une date ambiguë comme `03/10/2026` se lit jour/mois/année (format français).
- Les budgets saisis librement sont convertis en euros (`15k€` → 15 000).
  Un budget vide ou `?` est « inconnu » ; `0` est un vrai budget nul.
  La valeur brute est conservée à côté de la valeur nettoyée.
- Les doublons sont signalés avec un score de similarité, jamais supprimés
  automatiquement : seule Camille décide.
- Les noms des auteurs sont des données personnelles : visibles dans l'outil
  (usage interne), absents de l'export envoyé au client par défaut.
- L'IA est simulée (pas de clé API) : la clé se configure par variable
  d'environnement pour brancher un vrai modèle plus tard.

**Dans la V1.**
1. Import du CSV et tableau filtrable (direction, thème, site)
2. Notation sur 4 critères, avec pré-note de l'IA simulée corrigible
3. Détection des doublons (similarité de texte)
4. Shortlist d'environ 8 idées, exportable
→ Application en ligne, tests sur la logique qui compte, CI.

**Ce qui attend.** Comptes utilisateurs et droits, plusieurs challenges en
parallèle (réutilisation), vraie IA, pondération des critères réglable,
historique des modifications de notes.