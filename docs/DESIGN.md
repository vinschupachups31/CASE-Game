# CASE — Design system & expérience

Référence : skill `.claude/skills/mobile-app-ui-design` (règles 60/30/10, grille de 8 pt, 4 tailles de police, règle du pic et de la fin).

## Tokens (`src/ui/theme.ts`)
- **Couleurs** : fond presque noir `#07080A`, blanc chaud `#F2EDE4` décliné en opacités (100 / 72 / 46 / 24 %), rouge `#E5484D` réservé au danger, aux alertes et aux contradictions.
- **Typographie** : Instrument Serif (récit, titres, voix), Inter (interface), JetBrains Mono (données uniquement : heures, fichiers, codes).
  Quatre tailles seulement : 56 / 32 / 17 / 12. Deux graisses : 400 / 600.
- **Espacements** : multiples de 8 (4 toléré). Marges latérales de 24.
- **Mouvement** : courbe expo-out `(0.16, 1, 0.3, 1)`, entrées décalées (Reveal), transitions en fondu au noir entre écrans.

## Principes appliqués
- Un écran = une action principale, toujours en bas, à portée du pouce (bouton de 64 pt).
- Le téléphone s’efface pendant la marche : écran « Range ton téléphone », vibration à l’arrivée.
- La voix d’abord : forme d’onde + sous-titres mot à mot, la transcription reste secondaire.
- Le carnet est spatial : 4 nœuds, trait plein = fait établi, pointillé rouge = hypothèse.
- Retours immédiats : notifications en haut d’écran (« Déclaration enregistrée », « Contradiction potentielle ») avec vibrations dédiées.

## Moments clés
- **Pic** : le numéro inconnu. Écran noir, vibration, léger glitch, la valeur trouvée par le joueur soulignée en rouge, puis « Tu as trouvé 1927 il y a 6 min. » et l’appel de Marc qui suit sans transition.
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
