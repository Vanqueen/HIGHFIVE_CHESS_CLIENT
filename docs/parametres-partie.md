# Paramètres de partie

Cette page décrit les contrôles de configuration affichés avant une partie :
variante, cadence, mode amical ou classé, choix des couleurs et démarrage.

## Parcours concernés

| Parcours | Écran | Adversaire | Classement |
| --- | --- | --- | --- |
| Partie locale | `/computer` | Ordinateur | Toujours amicale |
| Défi en ligne | Espace de jeu, section « Nouveau match » | Joueur recherché ou lien de défi | Classé uniquement pour un joueur connecté sélectionné et une cadence chronométrée |
| Partie invitée | Espace de jeu, section « Inviter un adversaire » | Personne qui consomme le lien | Toujours amicale |
| Matchmaking | Espace de jeu, section « Partie rapide » | Joueur compatible trouvé automatiquement | Attribution des couleurs automatique ; les contrôles de défi ne s’appliquent pas |

Les contrôles de configuration communs sont dans
[`GameSetupControls.tsx`](../src/components/GameSetupControls.tsx). Le choix
de couleur est défini par [`ColorPreferenceSelector.tsx`](../src/components/ColorPreferenceSelector.tsx).

## Variante

La variante affichée est **Standard**, avec les règles classiques des échecs.
Elle est informative et n’est pas modifiable actuellement.

## Cadence et temps de jeu

Les onglets de cadence sont :

- **Illimité** : règle l’horloge initiale à `0` et l’incrément à `0`.
- **Temps réel** : utilise un contrôle avec horloge. Si la partie était illimitée,
  le passage à cet onglet sélectionne `5 + 0` par défaut. Une fois en temps réel,
  l’onglet ne remplace pas le contrôle sélectionné.
- **Correspondance** : affiché désactivé, car ce type de partie n’est pas pris
  en charge.

Les valeurs `n + m` représentent les minutes initiales et les secondes ajoutées
après chaque coup.

| Parcours | Contrôles proposés |
| --- | --- |
| Défi en ligne et partie invitée | `1 + 0`, `3 + 0`, `5 + 0`, `10 + 0`, `15 + 10` |
| Contre l’ordinateur | `1 min`, `3 min`, `5 min`, `10 min`, `15 min`, tous avec incrément nul |

Le choix **Illimité** masque les boutons de temps. En mode local, la cadence
contrôle l’horloge du navigateur. En ligne, les valeurs `initialTimeSeconds` et
`incrementSeconds` sont envoyées lors de la création de la partie.

## Mode de jeu

- **Amical** ne modifie pas l’Elo.
- **Classé** n’est disponible que pour un défi adressé à un compte joueur
  connecté et avec une cadence chronométrée. Un défi ouvert par lien, une partie
  invitée, une partie locale contre l’ordinateur ou une cadence illimitée ne
  peuvent pas être classés.
- La catégorie Elo d’un défi classé est déduite du temps estimé :
  `initialTimeSeconds + incrementSeconds * 40`. Jusqu’à 180 secondes inclus,
  la catégorie est Blitz ; jusqu’à 900 secondes inclus, Rapid ; au-delà,
  Classical.
- Le serveur valide les conditions du mode classé et applique les changements
  Elo lorsque la partie classée est terminée.

## Choix des couleurs

Le sélecteur **Blancs / Couleur aléatoire / Noirs** exprime la couleur souhaitée
pour l’initiateur du défi. Le choix aléatoire est sélectionné par défaut.

- Pour une partie locale, le tirage aléatoire est fait au démarrage de chaque
  partie. Si le joueur prend les Noirs, l’ordinateur joue le premier coup.
- Pour un défi en ligne ou invité, la couleur est attribuée à la création du
  défi. Le participant qui rejoint reçoit la couleur opposée.
- Le serveur réalise le tirage aléatoire des défis, y compris des parties
  anonymes créées par un visiteur non connecté.
- Le matchmaking aléatoire choisit les couleurs séparément ; il ne présente pas
  ce sélecteur.

## Création d’un défi en ligne

Le client envoie à `POST /api/challenges` les réglages du défi :

```json
{
  "invitedUserId": 42,
  "initialTimeSeconds": 300,
  "incrementSeconds": 0,
  "colorPreference": "RANDOM",
  "isRated": true
}
```

`invitedUserId` est omis ou vaut `null` pour créer un défi ouvert à partager par
lien ; les défis ouverts restent amicaux. `colorPreference` accepte `WHITE`,
`BLACK` ou `RANDOM`. `isRated` vaut `false` par défaut. Pour être classé, le
défi doit avoir un destinataire connecté et un temps initial supérieur à zéro.

Le formulaire permet aussi de rechercher un joueur par pseudonyme. Avec un
joueur sélectionné, l’action devient **Défier un ami** ; sans destinataire,
l’action crée un défi ouvert et un lien à partager.

## Création d’une partie invitée

La création d’une partie invitée appelle `POST
/api/invitation-links/anonymous` avec le contrôle de temps et la préférence de
couleur :

```json
{
  "initialTimeSeconds": 300,
  "incrementSeconds": 0,
  "colorPreference": "RANDOM"
}
```

Le créateur reste sur l’écran avec le lien généré. Le plateau est rejoint
ensuite par le destinataire du lien. Les parties anonymes sont amicales et ne
modifient pas l’Elo.

## Partie contre l’ordinateur

La page [`ComputerGamePage.tsx`](../src/pages/ComputerGamePage.tsx) propose aussi
le niveau de l’ordinateur (**Facile**, **Intermédiaire** ou **Difficile**).
Ces parties sont locales et amicales : elles ne sont pas envoyées au serveur et
ne changent pas le classement du joueur.

Trois adversaires d’entraînement affichent un Elo indicatif (800, 1200 ou 1600).
Ces valeurs servent à choisir un niveau de jeu et ne constituent pas une
mesure calibrée de la force de l’ordinateur ; les parties restent locales et
n’affectent jamais l’Elo officiel. L’horloge du joueur comme celle de
l’ordinateur se décrémente pendant le tour actif, y compris pendant le temps
de réflexion de l’ordinateur.

Les joueurs connectés voient leur Elo global près de leur nom. L’Elo est
également visible pour l’adversaire identifié dans les parties en ligne et
l’historique ; il n’est pas affiché pour les participants invités ni pour les
niveaux d’ordinateur sans Elo.

## Styles clair et sombre

Le formulaire conserve la palette verte de l’application. Ses styles dédiés
sont dans [`App.css`](../src/App.css) sous les classes
`.vc-computer-settings`, `.vc-game-setup-*` et `.vc-color-selector`.
Les surcharges `.dark` adaptent les mêmes contrôles au thème sombre.

## Apparence et relecture d’une partie

Le menu **Apparence de l’échiquier** permet de choisir les couleurs du plateau
et le style des pièces. Ce choix est enregistré dans les préférences du joueur
et s’applique aux parties en ligne, contre l’ordinateur et aux parties
consultées dans l’historique. Il reste modifiable pendant une partie.

Les commandes sous le plateau permettent de revenir au début, de parcourir les
coups un par un ou de revenir à la position actuelle. Les coups de l’historique
sont également sélectionnables pour afficher directement la position
correspondante ; une relecture ne modifie pas la partie en cours.
