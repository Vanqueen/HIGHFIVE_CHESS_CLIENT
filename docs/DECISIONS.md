# Décisions techniques et produit

N'ajouter que les décisions durables. Ne pas y enregistrer chaque modification mineure.

## Format
### AAAA-MM-JJ — Titre court
- Contexte :
- Décision :
- Raisons :
- Conséquences / compromis :
- Zones concernées :

### 2026-10-25 — Documentation initiale du dépôt (constat, pas une nouvelle décision)
- Contexte : première initialisation de `docs/PROJECT.md`, `docs/DESIGN.md` et `docs/DECISIONS.md` ; les entrées ci-dessous consignent des décisions déjà prises dans le code existant, repérées lors de cette analyse.
- Décision : documenter ces choix tels qu'implémentés, sans les modifier.
- Raisons : respecter la consigne « ne rien deviner, ne pas refondre » pour cette première étape.
- Conséquences / compromis : les dates ci-dessous sont la date de documentation, pas la date de décision d'origine (inconnue).
- Zones concernées : ensemble du frontend `HIGHFIVE_CHESS_CLIENT`.

### 2026-10-25 — Authentification par JWT access/refresh avec file d'attente de requêtes
- Contexte : `src/axios.ts` intercepte les réponses `401` et tente un rafraîchissement automatique du token.
- Décision : les tokens d'accès/rafraîchissement sont stockés en `localStorage` (`accessToken`, `refreshToken`, `authUser`) ; une seule requête de rafraîchissement est menée à la fois (verrou `isRefreshing`), les requêtes concurrentes sont mises en file (`failedQueue`) puis rejouées avec le nouveau token.
- Raisons : éviter les rafraîchissements multiples en parallèle et garantir qu'une session expirée redirige vers `/auth`.
- Conséquences / compromis : stockage du token en `localStorage` (exposé au XSS) plutôt qu'en cookie httpOnly ; en cas d'échec du rafraîchissement, tout l'état d'auth local est purgé et l'utilisateur est redirigé.
- Zones concernées : `src/axios.ts`, `src/context/AuthContext.tsx`, `src/features/authSlice.tsx`.

### 2026-10-25 — Parties invitées (sans compte) via session dédiée
- Contexte : `src/guestSession.ts` et les routes `/guest-game/:token`, `/challenge-link/:token` permettent de jouer sans compte.
- Décision : une session invité (id de partie, participant, couleur, token) est stockée en `sessionStorage` (et non `localStorage`), validée strictement à la lecture (types, entiers sûrs, présence du token).
- Raisons : permettre de jouer sans inscription tout en gardant la session limitée à l'onglet/la fenêtre courante (`sessionStorage`).
- Conséquences / compromis : la session invité ne survit pas à la fermeture de l'onglet ; elle coexiste avec l'état d'authentification normal et conditionne le routage public/protégé dans `src/routes/index.tsx`.
- Zones concernées : `src/guestSession.ts`, `src/routes/index.tsx`, `src/axios.ts` (injection du token invité sur les routes `/games/guest/:id`).

### 2026-10-25 — Gestion d'état hybride : Redux Toolkit encapsulé par des Context React
- Contexte : `src/store/store.ts` définit un store Redux Toolkit (slices `auth`, `counter`) ; `AuthContext` consomme ce store via `useDispatch`/`useSelector` et expose une API par hook (`useAuth`) plutôt que d'exposer Redux directement aux pages.
- Décision : Redux Toolkit reste la source de vérité pour l'état d'authentification, mais les composants interagissent avec lui via des Context dédiés (`AuthContext`, `SocketContext`, `ChessAppearanceContext`, `NavigationContext`), pas directement via `useSelector`/`useDispatch` dans les pages.
- Raisons : non documentées explicitement dans le code ; probablement pour isoler les pages de l'implémentation Redux.
- Conséquences / compromis : deux mécanismes d'état coexistent (Redux + Context) ; toute nouvelle fonctionnalité d'état global doit choisir lequel des deux patterns suivre pour rester cohérente.
- Zones concernées : `src/store/store.ts`, `src/features/authSlice.tsx`, `src/context/AuthContext.tsx`.

### 2026-10-25 — Préférences d'apparence de l'échiquier persistées côté client
- Contexte : `src/chess/chessAppearance.ts` définit 4 thèmes de plateau (`forest`, `walnut`, `slate`, `midnight`) et, à l'origine, 2 styles de pièces (`sculpted`, `classic`) ; `ChessAppearanceContext` persiste le choix en `localStorage` sous la clé `chessarena-board-appearance`.
- Décision : la préférence visuelle de l'échiquier est individuelle (par navigateur), pas liée au compte utilisateur côté serveur.
- Raisons : non documentées explicitement ; probablement simplicité (pas de synchronisation multi-appareil nécessaire pour ce réglage).
- Conséquences / compromis : la préférence ne suit pas l'utilisateur d'un appareil à l'autre.
- Zones concernées : `src/chess/chessAppearance.ts`, `src/context/ChessAppearanceContext.tsx`, `src/components/ChessBoardPreferences.tsx`, `src/components/ColorPreferenceSelector.tsx`.
- **Correction (2026-10-26)** : la validation de lecture n'acceptait que `"classic"` et neutralisait silencieusement `"sculpted"` au rechargement. Remplacée par `isPieceStyle()`, qui valide contre la liste réelle des styles. Voir l'entrée « Jeu de pièces réaliste » ci-dessous pour le contexte de cette correction.

### 2026-10-26 — Jeu de pièces réaliste « Kaneo » en style par défaut
- Contexte : le plateau n'affichait que des glyphes Unicode (rendu dépendant de la police système) ou un style « sculpted » dessiné à la main, stylisé plutôt que réaliste. Demande explicite d'un rendu de pièces plus réaliste, avec une référence visuelle précise (capture d'écran d'un plateau proche du set « Neo » de chess.com).
- Décision : ajout d'un troisième style `"realistic"` (pas de nouvelle dépendance npm — les librairies de plateau complet comme `chessground`/`react-chessboard` ont été écartées : réécriture complète du plateau déjà custom, et `chessground` est sous licence GPL-3.0, copyleft à risque). `"realistic"` est le style par défaut (`DEFAULT_PREFERENCES.pieceStyle`).
  - Premier essai : le jeu « Cburnett » (set par défaut de Lichess/Wikipedia, CC BY-SA 3.0) — look reconnu mais trop plat/2D par rapport à la référence demandée.
  - Choix retenu : le jeu **« Kaneo »** ([Kadagaden/chess-pieces](https://github.com/Kadagaden/chess-pieces), licence CC BY 4.0), explicitement conçu par son auteur comme une alternative libre « inspirée des pièces Neo de chess.com » — proche du rendu glossy/contours épais demandé, sans réutiliser les fichiers propriétaires de chess.com (non réutilisables).
- Raisons : correspondre à la référence visuelle donnée par le produit, sans dépendance supplémentaire ni réécriture du composant `ChessBoard.tsx` existant, et sans risque de licence (ni copyleft GPL, ni réutilisation d'assets propriétaires chess.com).
- Conséquences / compromis : licence CC BY 4.0 (auteur Kadagaden) — une mention de crédit visible dans l'interface reste à ajouter (voir `src/assets/pieces/kaneo/NOTICE.md`) ; correction simultanée du bug de validation de `pieceStyle` décrite ci-dessus, nécessaire pour que les 3 styles persistent correctement après rechargement.
- **Correction (2026-10-26)** : les 12 SVG étaient d'abord servis comme fichiers statiques depuis `public/pieces/kaneo/` et chargés via `<img src>`. Les pièces à tracés multi-groupes (tour, cavalier, fou, dame, roi) s'affichaient creuses (contour seul, sans remplissage) dans le navigateur de l'utilisateur alors qu'un test local ne reproduisait pas le problème — cause probable : mise en cache navigateur d'un état intermédiaire pendant le remplacement des fichiers. Pour éliminer toute dépendance à une requête HTTP séparée et au cache du navigateur, les SVG ont été déplacés vers `src/assets/pieces/kaneo/` et sont désormais importés à la compilation via le suffixe Vite `?raw` (`src/assets/pieces/kaneo.ts`), puis injectés en ligne dans le DOM (`dangerouslySetInnerHTML` sur du contenu statique et fiable, pas une entrée utilisateur). Les pièces sont ainsi assemblées dans le bundle JS et ne dépendent plus d'aucune requête réseau ni d'aucun cache.
- Zones concernées : `src/chess/chessAppearance.ts`, `src/context/ChessAppearanceContext.tsx`, `src/components/ChessBoard.tsx`, `src/components/ChessBoardPreferences.tsx`, `src/assets/pieces/kaneo/`, `src/assets/pieces/kaneo.ts`.

### 2026-10-26 — Ajout du thème de plateau « Sable »
- Contexte : demande de choisir un des plateaux proposés par le même dépôt que le jeu de pièces « Kaneo » ([Kadagaden/chess-pieces](https://github.com/Kadagaden/chess-pieces), dossier `boards/`), parmi « Wood board », « Brown-Yellow board », « Brown-Sand board » et « Pinkish Brown-Yellow board » (tous 8x8).
- Décision : ajout d'un 5ᵉ thème `"sand"` (libellé « Sable ») aux `BOARD_THEMES` existants (`forest`, `walnut`, `slate`, `midnight`), basé sur `boards/8x8_brown_sand.svg` de ce dépôt — case claire `#ebecd0`, case foncée `#b68860` (valeurs confirmées directement depuis le fichier SVG source, pas une estimation). Pas de nouveau fichier ajouté au projet : seules les deux couleurs ont été reprises, intégrées comme les autres thèmes via `data-board-theme="sand"` en CSS (`src/App.css`), cohérent avec l'architecture existante.
- Raisons : parmi les 4 plateaux proposés, celui au rendu le plus neutre/doux à côté des pièces « Kaneo » à contours noirs épais, et suffisamment distinct du thème « Noyer » déjà présent (plus clair, moins saturé) pour ne pas faire doublon. Les 3 autres options (Wood, Brown-Yellow, Pinkish Brown-Yellow) n'ont pas été retenues : Wood est une texture photographique (PNG) qui aurait demandé un mécanisme de rendu différent (image plutôt que couleur plate) ; Brown-Yellow et Pinkish Brown-Yellow sont plus saturés et plus proches visuellement de « Noyer ».
- Conséquences / compromis : licence CC BY 4.0 du dépôt source — mention de crédit à regrouper avec celle des pièces « Kaneo » (voir entrée précédente).
- Zones concernées : `src/chess/chessAppearance.ts`, `src/App.css`.
