# CASE

**Une affaire. N'importe où. Ta ville devient la scène de crime.**

Vertical slice de l'affaire 001 **23:17** : chapitre I (enquête terrain) et chapitre II (note de Nora, Sarah, Marc, accusation, verdict).

## Principe
La vérité criminelle est immuable. Le World Engine adapte les lieux et certaines énigmes au monde réel du joueur.

## MVP
- briefing 23:17
- génération de run adaptative
- challenge environnemental
- preuves
- suspects
- interrogatoire contrôlé
- contradiction
- accusation

## Lancer
```bash
npm install
npx expo start      # puis scanner le QR code avec Expo Go (iOS / Android)
npm run web         # version navigateur
npm run demo        # page HTML autonome : dist-demo/case-demo.html
npm test            # moteurs (Vitest)
npm run typecheck   # TypeScript
```

Sur téléphone, CASE lit ton vrai terrain : GPS + lieux publics OpenStreetMap (sans clé ni compte), boussole et distance en direct, vibration à l'arrivée dans la zone. Sans localisation, sans réseau ou sur le web sans autorisation, l'enquête bascule automatiquement sur un environnement simulé (ville dense, petite ville, zone rurale). La partie est sauvegardée : on la reprend depuis l'écran d'accueil. Le chapitre II ouvre au 07:42 suivant, avec une notification du téléphone.

## Architecture
```
app/index.tsx                chef d’orchestre : polices, transitions, notifications
src/ui/                      design system (theme, kit, motion, haptics, icons) + écrans
src/
├── types/case.ts            Case File : vérité immuable (types)
├── types/run.ts             Run : état dynamique du joueur + événements
├── cases/23-17.ts           Affaire 001, déclarative et gelée (deepFreeze)
└── engine/
    ├── gameEngine.ts        reducer pur : captures, déblocages, messages, contradictions, accusation
    ├── conditions.ts        conditions déclaratives (preuve, variable, flag, déclaration…)
    ├── templates.ts         {WORLD_01}, {WORLD_02}, {CODE} → valeurs du joueur
    ├── worldEngine.ts       lieux publics sûrs → parcours, modes, fallbacks sur place
    ├── challengeEngine.ts   validation année / mot / nombre → variable
    ├── interrogationEngine  réponses locales déterministes issues du Case File
    ├── characterEngine.ts   contexte borné pour une IA backend + garde-fou des réponses
    ├── notebook.ts          carnet : FAIT ÉTABLI vs HYPOTHÈSE
    ├── profile.ts           profil d’enquêteur, texte de partage, rendez-vous 07:42
    ├── geo.ts               distance, cap, aiguille relative à la boussole
    ├── places.ts            lieux publics réels (OpenStreetMap / Overpass), filtre de sécurité
    ├── appearance.ts        portraits découverts au fil de l’enquête
    └── simulator.ts         partie scriptée dans plusieurs environnements
```

Test fondamental (`tests/engine.test.ts`) : la même affaire jouée en ville dense (`1927-A`), petite ville (`1874-U`) et zone rurale (fallbacks) produit des parcours et variables différents, et **Marc reste responsable** partout.

Design system, moments clés et leviers de rétention : voir `docs/DESIGN.md`.
