# CASE

**Une affaire. N'importe où. Ta ville devient la scène de crime.**

Vertical slice de l'affaire 001 **23:17**.

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
npx expo start      # app (ou: npm run web)
npm test            # moteurs (Vitest)
npm run typecheck   # TypeScript
```

Le prototype inclut un mode de simulation (ville dense, petite ville, zone rurale) afin de tester le moteur sans GPS ni caméra réels.

## Architecture
```
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
    └── simulator.ts         partie scriptée dans plusieurs environnements
```

Test fondamental (`tests/engine.test.ts`) : la même affaire jouée en ville dense (`1927-A`), petite ville (`1874-U`) et zone rurale (fallbacks) produit des parcours et variables différents, et **Marc reste responsable** partout.
