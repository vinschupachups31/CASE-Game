# PROJET CASE — Synthèse complète

État du projet : septembre 2026. Document de référence pour la suite du développement.

## 1. Vision

**« Une affaire. N'importe où. Ta ville devient la scène de crime. »**

Jeu d'enquête immersif en monde réel (iOS + Android). Le joueur lance une enquête là où il se trouve ; l'app analyse l'environnement et construit l'expérience autour de lui.

Boucle : **MARCHER → OBSERVER → DÉCOUVRIR → INTERROGER → RÉFLÉCHIR → DÉCIDER → SE DÉPLACER**

Principe UX fondamental : **le joueur regarde le monde réel davantage que son téléphone.**
Le téléphone sert de GPS/boussole, caméra, lecteur audio, messagerie, téléphone vers les suspects, carnet, tableau de preuves, interface de confrontation.

## 2. Différenciation

Pas « une enquête avec GPS + IA ». La vraie différenciation :

**ENVIRONNEMENT RÉEL → VARIABLE DE JEU → ÉNIGME → CONSÉQUENCE NARRATIVE**

Exemple : « Trouve autour de toi quelque chose portant une année. » → le joueur photographie `1927` → `WORLD_01 = 1927` → réutilisé pour nommer un fichier (`CALL_1927.dat`), un code, un document, un message, une énigme, une réplique.
Plus tard : `NUMÉRO INCONNU` — « Tu progresses vite. » — « 1927 était une mauvaise idée. »
Dans une autre ville : `1874`. La vérité criminelle reste identique.

## 3. Règle fondamentale

- **A. Vérité de l'affaire — immuable** : responsable, chronologie, mobile, relations, preuves fondamentales, mensonges des suspects.
- **B. Run du joueur — dynamique** : lieux, parcours, variables environnementales, indices obtenus, ordre de découverte, décisions, historique des interrogatoires, mémoire des personnages, challenges utilisés.

## 4. Adaptation à n'importe quel endroit

Le scénario ne dépend jamais d'un lieu précis (« trouve une zone publique ouverte… », pas « va devant la fontaine Dupont »).

Fallbacks : pas de parc → place ; pas de monument → bâtiment public ; peu de POI → observation / orientation / audio ; zone rurale → mairie, église, place, chemin accessible ; environnement pauvre → audio, mémoire, interrogatoire, déduction, timeline, observation.
**Aucune mission ne doit bloquer définitivement une partie.**

## 5. Sécurité

Privilégier : espaces publics, zones accessibles, déplacements piétons, lieux sûrs, pas de propriété privée, pas de traversée dangereuse, fallback possible.
Jamais : intrusion, bâtiments abandonnés, comportement dangereux, imitation d'une véritable autorité policière.

## 6–8. Affaire 001 — « 23:17 »

**Nora Valen**, 32 ans, journaliste, disparue. À 23:17, message programmé :
« Si vous recevez ça, c'est qu'il m'est arrivé quelque chose. Ne faites confiance à personne dans ce dossier. »

| Suspect | Rôle | Affirme | Vérité |
|---|---|---|---|
| **Léo Vasseur** | compagnon / ex | rentré chez lui après l'appel | l'a suivie — **pas responsable** |
| **Sarah Klein** | collègue / meilleure amie | ne sait pas sur quoi Nora enquêtait | lui a fourni les documents, ment pour sa carrière — pas responsable |
| **Marc Delcourt** | source | ne connaît pas Sarah ; oriente vers Léo | **RESPONSABLE** |

**Vérité canonique (aucune IA ne peut la modifier)** :
- Marc est responsable.
- Nora avait découvert Marc.
- Sarah a fourni des documents à Nora.
- Léo a suivi Nora mais n'est pas responsable.
- Marc connaît des informations qu'il prétend ne pas connaître.

## 9. Personnages IA

L'IA n'est **pas** Game Master. Elle improvise formulation, hésitations, réactions, ton. Elle ne peut jamais : modifier un horaire canonique, inventer un suspect / alibi / preuve structurante, changer le coupable, contredire le Case File.

```
CHARACTER: MARC
KNOWN_FACTS: Nora enquêtait sur Marc. Marc était avec Nora à 22:41.
LIES: prétend être chez lui à 22:41. prétend ne pas connaître Sarah.
FORBIDDEN: ne jamais avouer directement. ne jamais inventer une personne. ne jamais modifier les horaires.
OBJECTIVE: convaincre le joueur que Léo est responsable.
```

Aucune clé IA dans l'app mobile : l'IA passe par un backend.

## 10–22. Vertical slice (30–40 min)

1. **Ouverture** — écran noir, vibration. `DOSSIER REÇU — 29 septembre — 07:42 — NORA VALEN, 32 ans, journaliste, DISPARUE`. Audio : « Si quelqu'un écoute ça… j'avais raison. Quelqu'un ment. Le problème, c'est que je ne sais plus lequel des trois. »
2. **Préparation du terrain** — `4 ZONES PUBLIQUES TROUVÉES / PARCOURS À PIED GÉNÉRÉ / 2 ÉNIGMES ENVIRONNEMENTALES`, durée + distance. Modes : COURT (~20 min, < 1 km), NORMAL (~35 min, ~2 km), IMMERSIF (~60 min, 3–4 km).
3. **Mission 1 — Dernière trace** — « À 21:53, Nora a passé un appel. Retrouvez la zone depuis laquelle il a été émis. » Direction + distance (ex. `620 MÈTRES`), pas de pin. « RANGE TON TÉLÉPHONE » — « CASE vibrera lorsque tu entreras dans la zone de recherche. »
4. **Challenge 1** — « Cherche une année. » Caméra → `ANNÉE DÉTECTÉE 1927 — CONSERVER CETTE PREUVE ?` → `WORLD_01 = 1927`.
5. **Preuve 1** — `CALL_1927.dat` : `21:53:12 — APPEL SORTANT — LÉO VASSEUR — Durée 04:17`. Léo devient interrogeable.
6. **Interrogatoire de Léo** — voice-first (transcription secondaire). Poser une question / présenter une preuve / confronter. Léo : « Je suis rentré chez moi après l'appel. Toute la soirée. » (vérité interne : `LEO_FOLLOWED_NORA = TRUE`).
7. **Sarah** contacte le joueur : « Vous enquêtez sur Nora ? Je pense que Léo vous ment. » Répondre / appeler / ignorer / continuer. Les personnages se souviennent de certaines décisions.
8. **Challenge 2 — WORD_CAPTURE** — Nora : « Le nom était devant moi. » « Trouve un mot d'au moins 6 lettres. » Ex. `PHARMACIE` → 3ᵉ lettre → `WORLD_02 = A` → `1927-A`.
9. **Déblocage de Marc** — un document de Nora utilise `1927-A` et révèle **MARC DELCOURT**.
10. **Carnet / tableau** — apparaît quand le joueur a assez d'infos (Nora, Léo, Sarah, Marc, appel 21:53, documents, messages, contradictions). Liens entre éléments ; distinction `FAIT ÉTABLI` / `HYPOTHÈSE — PREUVES INSUFFISANTES`. Spatial, minimaliste, tactile, premium — pas de mur à 50 fils rouges.
11. **Moment signature** — en marchant : vibration, écran noir, `NUMÉRO INCONNU` — « Tu progresses vite. » — « 1927 était une mauvaise idée. »
12. **Marc appelle** — « Nora était obsédée. Léo la suivait. Vous devriez commencer par lui. » Si « Comment connaissez-vous 1927 ? » → il esquive → `CONTRADICTION POTENTIELLE`.
13. **Fin du chapitre I** — résumé (2 preuves, ≥ 1 variable, 3 suspects, ? contradictions). « Nora était encore vivante à 22:41. La question n'est plus : qui l'a vue ? Mais : qui savait ce qu'elle avait découvert ? »

## 23. Types de challenges

- **Vision** : année, nombre, mot, couleur, forme, lettre, objet, comptage.
- **Espace** : orientation N/S/E/O, marcher une distance, rejoindre une zone, choisir une direction, trouver un espace ouvert.
- **Mémoire** : observer 10 s, comparer, reconnaître une voix, mémoriser, reconstruire une timeline.
- **Déduction** : croiser des témoignages, contradiction, chronologie, preuve ↔ suspect, éliminer un alibi.
- **Interrogatoire** : question libre, confrontation avec preuve, bluff, question chronométrée, choisir quoi révéler.

## 24. Architecture

Expo + React Native + TypeScript (iOS + Android).

```
APP
├── GAME ENGINE       progression, conditions, preuves, contradictions, variables
├── WORLD ENGINE      POI, distance, route, environnement, fallbacks
├── VISION ENGINE     photo → donnée structurée
├── CHARACTER ENGINE  Léo, Sarah, Marc
└── CASE FILE         23:17
```

## 26–31. Existant (repo `vinschupachups31/CASE-Game`)

Déjà en place : config Expo/RN/TS, types, Case File 23:17 (suspects, vérité, preuves), World / Route / Challenge / Character / Interrogation / Game engines, simulateur (profils VILLE DENSE et PETITE VILLE — `1927` vs `1874`, route différente, **Marc reste responsable**), docs produit + protocole de test, vertical slice interactif commencé, prototype UX cliquable de 10 écrans.

Route Engine : types `OPEN_SPACE`, `LANDMARK`, `COMMERCIAL`, `QUIET` ; filtre lieux publics, distance max, diversité ; fonctions narratives `TRACE`, `WORLD_CHALLENGE`, `CONFRONTATION`, `FINALE`.

## 32–33. Direction artistique & UX

Thriller contemporain premium. Fond presque noir, blanc chaud, rouge rare (danger, alerte, critique). Typographie éditoriale, forte, lisible. Minimaliste, beaucoup d'espace, animations discrètes, vibrations importantes, glitch très occasionnel.
Pas de cyberpunk cliché, faux terminal, faux logiciel policier, fils rouges partout, surcharge.

Une action principale par écran. Pas de navigation envahissante en mission. Contrôles gros, lisibles dehors, à une main, accessibles au pouce.

## 34. Validé

Concept, différenciation, monde réel, vérité immuable, run dynamique, affaire 23:17 et ses personnages, Marc responsable, World Engine, variables environnementales, moment signature, IA bornée, Expo/RN/TS, MVP solo, DA générale, rôle du téléphone, fallbacks, première stratégie de monétisation.
