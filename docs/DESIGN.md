# CASE — Design system & expérience

Référence : skill `.claude/skills/mobile-app-ui-design` (règles 60/30/10, grille de 8 pt, 4 tailles de police, règle du pic et de la fin).

## Tokens (`src/ui/theme.ts`)
- **Couleurs** : fond presque noir `#07080A`, blanc chaud `#F2EDE4` décliné en opacités (100 / 72 / 46 / 24 %), rouge `#E5484D` réservé au danger, aux alertes et aux contradictions.
- **Typographie** : Instrument Serif (récit, titres, voix), Inter (interface), JetBrains Mono (données uniquement : heures, fichiers, codes).
  Quatre tailles seulement : 56 / 32 / 17 / 12. Deux graisses : 400 / 600.
- **Espacements** : multiples de 8 (4 toléré). Marges latérales de 24.
- **Mouvement** : courbe expo-out `(0.16, 1, 0.3, 1)`, entrées décalées (Reveal), transitions en fondu au noir entre écrans.

## Couche de mouvement (`src/ui/fx.tsx`, Reanimated 4)
Tout tourne sur le fil d'interface, à la fréquence de l'écran, et se fige si le téléphone demande de réduire les animations.
- **Ambiance** : grain de film animé, deux halos qui dérivent lentement, vignettage. L'ambiance suit l'histoire : sombre pendant les appels et au viseur, rouge dans les moments de tension (numéro inconnu, Marc, accusation).
- **Transitions** : fondu avec profondeur par défaut ; coupe franche avec flash rouge pour ce qui doit surprendre (numéro inconnu, appel de Marc, SMS anonyme) ; flash blanc pour une découverte (preuves, détection) ; lent pour les fins.
- **Titres** : lignes qui montent derrière un masque, comme un générique.
- **Données** : heures, codes et fichiers se déchiffrent (caractères aléatoires qui se fixent de gauche à droite).
- **Cartes** : inclinaison 3D avec le gyroscope (la souris sur le web) et reflet qui glisse.
- **Boutons** : reflet qui balaie, rebond à l'appui. L'accusation se confirme par **appui long** : la jauge rouge se remplit, les vibrations s'accélèrent.
- **Portraits** : un nouveau détail se développe comme un Polaroid (flash puis rebond) ; halo qui respire pendant qu'on parle ou qu'on sonne.
- **Notifications** : verre dépoli, arrivée en ressort.

## Principes appliqués
- Un écran = une action principale, toujours en bas, à portée du pouce (bouton de 64 pt).
- Le téléphone s’efface pendant la marche : écran « Range ton téléphone », vibration à l’arrivée.
- La voix d’abord : forme d’onde + sous-titres mot à mot, la transcription reste secondaire.
- Le carnet est spatial : 4 nœuds, trait plein = fait établi, pointillé rouge = hypothèse.
- Retours immédiats : notifications en haut d’écran (« Déclaration enregistrée », « Contradiction potentielle ») avec vibrations dédiées.

## Portraits découverts (`src/ui/portraits.tsx`, `src/engine/appearance.ts`)
Silhouettes sans visage, éclairées par la gauche comme une photo de dossier. Nora est connue dès le dossier (écharpe rouge) ; le numéro inconnu reste un « ? » rouge.
Les suspects **se découvrent** : chacun commence en silhouette nue, puis gagne trois calques (coiffure, haut, accessoire). Chaque détail vient d'une source concrète, déclarée dans le Case File (`appearance`) :

| Suspect | Coiffure | Haut | Accessoire |
|---|---|---|---|
| Léo | photo de contact floue (preuve 01) | sweat gris : Sarah, si on lui a répondu | écouteurs : l'appel, s'il se confie |
| Sarah | photo de profil (son message) | badge de presse : ses aveux | lunettes : note de Nora (preuve 03) |
| Marc | tempes grises : sa voix | costume, cravate : archives du journal | montre en or : Inès (mode normal et +) |

Certains détails récompensent un choix (répondre à Sarah, mettre Léo en confiance) ; les modes longs en révèlent plus. Chaque découverte déclenche une notification « Portrait de Léo · Sweat gris à capuche ». L'écran d'appel affiche « PORTRAIT 2/3 » et les détails connus ; au verdict, le portrait de l'accusé apparaît en entier.

## Modes longs (`STAGE_MODE` dans `src/ui/flow.ts`)
Les étapes absentes du mode choisi sont sautées automatiquement. Plus long = plus d'histoire, même vérité.

| Étape | Mode | Contenu |
|---|---|---|
| SMS anonyme | normal + | fausse piste vers Léo (envoyée par Marc, expliquée au verdict) |
| Témoin Paul | immersif | le gardien a vu un jeune homme en sweat gris partir derrière Nora → **contradiction établie contre Léo**, qui reste innocent |
| Ticket de caisse | normal + | Café du Marché, 22:34, deux cafés |
| Témoin Inès | normal + | un homme calme, la cinquantaine, une belle montre → détail du portrait de Marc |
| Mission 5 · nombre | immersif | WORLD_03 : un nombre de la rue du joueur ouvre la clé USB de Nora (« Transmis par : S.K. ») |
| Emails supprimés | immersif | fausse piste vers Sarah, expliquée au verdict |

Les témoins se joignent par téléphone et parlent ligne par ligne (voix enregistrées quand elles existeront, sous-titres sinon). Au verdict, chaque fausse piste suivie est expliquée.

## Moments clés
- **Pic** : le numéro inconnu. Écran noir, vibration, léger glitch, la valeur trouvée par le joueur soulignée en rouge, puis « Tu as trouvé 1927 il y a 6 min. » et l’appel de Marc qui suit sans transition.
- **Verdict** (chapitre II) : le joueur choisit une personne **et** une preuve. Bonne personne + contradiction établie = accusation retenue ; bonne personne sur une esquive ou une intuition = accusation fragile ; mauvaise personne = on révèle ce qu’elle cachait. La vérité (chronologie 21:53 · 22:41 · 23:17) est révélée dans tous les cas, et le vote scellé du chapitre I est dévoilé.
- **Fin** : carte « Ta ville a écrit 1927-A » avec le profil d’enquêteur, compteurs animés, phrase de clôture, vote scellé et compte à rebours vers le chapitre II.

## Rétention et partage
1. **Code de ville à partager** : chaque ville produit un code différent (`1927-A`, `1874-U`…). Le partage pose la question « Et ta ville, elle a écrit quoi ? », ce qui pousse à comparer entre joueurs.
2. **Profil d’enquêteur** : L’Œil, L’Improvisateur, Le Confesseur ou Le Marcheur. On partage quelque chose sur soi, pas une statistique de l’app.
3. **Vote scellé** : « Qui soupçonnes-tu ? » est enregistré et sera révélé au chapitre II. On veut savoir si on avait raison.
4. **Rendez-vous quotidien** : le chapitre suivant ouvre à 07:42, l’heure de réception du dossier, avec un compte à rebours.
5. **Personnages qui se souviennent** : ignorer Sarah est enregistré (« Sarah s’en souviendra. »).

## À venir
- Lecture automatique des photos (Vision Engine) : aujourd’hui, le joueur recopie ce qu’il voit sous l’objectif.
- GPS et boussole réels. L’arrivée en zone est simulée.
- Voix réelles des personnages et IA côté serveur.
- Notifications système pour le rendez-vous de 07:42.
- Comparaison des codes et des votes entre joueurs (nécessite un serveur ; aucune statistique inventée d’ici là).
