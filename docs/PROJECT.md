# Project context

> À compléter lors de la première exploration du dépôt. Ne pas inventer les informations manquantes.

## Produit
- Nom : « CHESSARENA » (titre HTML dans `index.html`, clé de stockage `chessarena-board-appearance`). Le dossier/paquet s'appelle `highfive_chess` / `highfive_chess_client` — voir incohérence en « À confirmer ».
- Objectif principal : plateforme web de jeu d'échecs en ligne (parties classées/amicales, contre l'ordinateur, défis directs, tournois, apprentissage, suivi de classement et de succès).
- Utilisateurs : joueurs inscrits, joueurs invités (sans compte, via lien de défi ou partie invité), organisateurs de tournois (`OrganizerDashboardPage`) et administrateurs (`AdminDashboardPage`).
- Fonctionnalités principales (déduites des pages dans `src/pages/`) :
  - Jeu : partie locale/en ligne (`PlayPage`), contre l'ordinateur (`ComputerGamePage`), défis (`challenge/:userId`, `challenge-link/:token`), partie invité (`guest-game/:token`), observation de parties (`WatchPage`).
  - Social : messagerie (`MessagesPage`), notifications (`NotificationsPage`), recherche de joueurs (`PlayerSearch`), profil (`ProfilePage`).
  - Compétition : tournois (`TournamentsPage`), classements (`RankingsPage`), succès (`AchievementsPage`).
  - Autres : problèmes/exercices (`ProblemsPage`), apprentissage (`LearnPage`), éditeur d'échiquier (`BoardEditorPage`), gestion des utilisateurs (`UsersPage`), tableaux de bord admin/organisateur.

## Stack technique
- Framework frontend : React 19 (`react`, `react-dom` ^19.2.8) avec Vite 8.
- Langage : TypeScript (compilation stricte via `tsc -b`, voir `tsconfig.app.json`).
- Styling / UI library : Tailwind CSS v4 (`@tailwindcss/vite`) + variables CSS personnalisées (`src/index.css`, `src/App.css`) ; icônes via `lucide-react`.
- Gestion d'état : Redux Toolkit (`@reduxjs/toolkit`, `react-redux`) pour l'état global (`src/store/store.ts`, slices `authSlice`, `counterSlice`) ; complété par des React Context pour des préoccupations transverses (`AuthContext` encapsule le slice Redux, `SocketContext`, `ChessAppearanceContext`, `NavigationContext`).
- Routage : `react-router-dom` v7 (`src/routes/index.tsx`), avec routes protégées et routes publiques (invité) selon l'état d'authentification.
- API / backend : backend séparé (projet voisin `HIGHFIVE_CHESS_BACKEND`, Node/Express + Prisma) consommé via Axios (`src/axios.ts`, instance avec intercepteur de rafraîchissement de token JWT) et Socket.IO (`socket.io-client`, `src/socket.ts`) pour le temps réel. URLs configurées via `VITE_API_URL` / `VITE_SOCKET_URL` (`.env`).
- Tests : aucun framework de test ni script configuré (voir « À confirmer »).
- Build / package manager : npm (`package-lock.json` présent) ; build = `tsc -b && vite build`.

## Architecture
- Point d'entrée : `src/main.tsx` (monte `App` dans `ReduxProvider > BrowserRouter > AuthProvider > SocketProvider`).
- Dossier des pages : `src/pages/`.
- Dossier des composants : `src/components/` (primitives UI dans `src/components/ui/`, flux d'authentification dans `src/components/auth/`).
- Dossier des styles : `src/index.css` (tokens globaux + import Tailwind), `src/App.css` (styles spécifiques par page/section, fichier volumineux avec variables scoppées par préfixe : `--vc-*`, `--home-*`, `--guest-*`, `--computer-*`, `--setup-*`, `--auth-*`, `--piece-*`).
- Dossier des appels API : `src/api/` (`authApi.ts`, `chatApi.ts`) + instance centrale `src/axios.ts`.
- Dossier des tests : aucun (pas de dossier de tests ni de fichiers `*.test.*`/`*.spec.*` dans `src/`).
- État additionnel : `src/context/` (providers transverses), `src/features/` (slices Redux), `src/types/` (types partagés), `src/hooks/` (hooks utilitaires), `src/chess/` (logique/présentation liées aux échecs).

## Commandes validées
- Installation : non exécutée pendant cette analyse ; `package-lock.json` présent, donc `npm install`/`npm ci` est l'outil attendu (à confirmer en l'exécutant).
- Développement : `npm run dev` → `vite --port 5175`.
- Lint : `npm run lint` → `eslint .`.
- Tests : aucune commande définie dans `package.json` (pas de script `test`).
- Build : `npm run build` → `tsc -b && vite build`. Un script `npm run typecheck` existe aussi (`tsc --noEmit -p tsconfig.app.json`).

## Contraintes
- Compatibilité navigateur : non documentée dans le projet.
- Responsive : des points de rupture mobiles sont présents (`@media (max-width: 1024px)` dans `src/index.css` et `src/App.css`), mais aucune documentation formelle du comportement attendu par taille d'écran.
- Accessibilité : aucun test ou outillage a11y automatisé détecté.
- Contraintes de performance : non documentées.
- Conventions spécifiques : alias d'import `@` → `src` (`vite.config.ts`) ; configuration ESLint « flat config » (`eslint.config.js`) coexistant avec une entrée `eslintConfig` héritée de Create React App dans `package.json` (voir « À confirmer »).

## À confirmer
Ne conserver ici que les questions réellement non résolues.
- **Nom du produit** : le titre HTML et une clé de stockage utilisent « CHESSARENA », alors que le dépôt/paquet est nommé `highfive_chess` / `highfive_chess_client`. Quel est le nom officiel du produit ?
- **Incohérence de ports** : `package.json` lance le serveur dev sur le port `5175` (`vite --port 5175`), mais `vite.config.ts` déclare `server.port: 3000` et un proxy `/api` vers `http://localhost:3000` ; le fichier `.env` pointe aussi `VITE_API_URL`/`VITE_SOCKET_URL` vers `http://localhost:3000` ; le `.env.example` du backend attend par défaut une origine frontend `http://localhost:5173`. Quel est le port réellement utilisé en développement, et le proxy Vite est-il encore utile si l'API est appelée directement via Axios ?
- **Configuration ESLint dupliquée** : `package.json` contient un bloc `eslintConfig` (`react-app`, `react-app/jest`, héritage Create React App) en plus du fichier `eslint.config.js` (flat config Vite/ESLint 9+). Lequel est actif/voulu ?
- **Fichiers « copy »** : `src/pages/PlayPage copy.tsx` et `src/pages/SidebarLeft copy.tsx` existent en plus des fichiers originaux. Sont-ils des brouillons à supprimer, ou du code encore utilisé ?
- **Tests** : aucune stratégie de test n'est en place. Est-ce un choix délibéré pour ce projet ou un chantier à ouvrir ?
