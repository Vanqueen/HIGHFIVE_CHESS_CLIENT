# Connexion Frontend au Backend - Checklist

## 1. Configuration API (DONE ✓)
- [x] `VITE_API_URL=http://localhost:3000`
- [x] `VITE_SOCKET_URL=http://localhost:3000`
- [x] Préfixe `/api` ajouté dans axios.ts

## 2. Authentification

### 2.1 authApi.ts - Corriger les endpoints
- [ ] `authApi.login()` → endpoint: `/auth/login` ✓
- [ ] `authApi.register()` → vérifier endpoint backend: `/auth/register`
- [ ] `authApi.me()` → endpoint: `/users/me` (、保护)
- [ ] `authApi.refreshToken()` → endpoint: `/auth/refresh` (pas `/auth/refresh-token`)

### 2.2 AuthContext.tsx - Intégrer le vrai login
- [ ] Appeler `authApi.login()` au lieu du mock
- [ ] Stocker `accessToken` et `refreshToken` dans localStorage
- [ ] Charger le user au démarrage avec `/users/me`

## 3. Pages à connecter

### 3.1 PlayPage.tsx
- [ ] Remplacer `fetchPlayers` mocké → GET `/users` (admin requis ou créer endpoint public)
- [ ] Remplacer `createGame` → POST `/games`
- [ ] Intégrer Socket pour les événements temps réel (coups adverses, abandon, etc.)
- [ ] Sauvegarder les coups → POST `/games/:gameId/moves`
- [ ] Mettre à jour le statut → PATCH `/games/:gameId`

### 3.2 GamesPage.tsx
- [ ] Remplacer `fetchGames` → GET `/games/me` (endpoint existant)
- [ ] Corriger l'appel moves: `/games/:gameId/moves` (pas `/api/moves`)
- [ ] Charger les profils des joueurs → GET `/users/:id`

### 3.3 UsersPage.tsx
- [ ] GET `/users` (voir restrictions dans routes/users.ts - require ADMIN)
- [ ] OU créer endpoint public pour lister utilisateurs en ligne

### 3.4 MessagesPage.tsx
- [ ] Le chatApi.ts utilise des endpoints inexistants: `/chat/*`
- [ ] Créer/faire correspondre avec les endpoints messages du backend
- [ ] Endpoints backend à vérifier: messages, conversations

### 3.5 NotificationsPage.tsx
- [ ] Backend: pas de route notifications visible
- [ ] À créer ou utiliser les événements WebSocket

## 4. WebSocket (SocketIO)

### 4.1 socket.ts
- [ ] Vérifier que `VITE_SOCKET_URL` est correct
- [ ] Le token doit être passé dans `auth: { token: accessToken }`

### 4.2 SocketContext.tsx
- [ ] Événements à écouter (backend game.gateway.ts):
  - [ ] `game:playerJoined`
  - [ ] `game:moveMade`
  - [ ] `game:gameEnded`
  - [ ] `game:drawOffered`
  - [ ] `game:undoRequested`
  - [ ] `game:playerResigned`
  - [ ] `game:noShowClaimed`
  - [ ] `game:chatMessage`

### 4.3 Events backend → front attendus
```typescript
// game.gateway.ts emits:
// - 'getOnlineUsers' → déjà écouté
// - 'game:moveMade' → mettre à jour l'échiquier
// - 'game:gameEnded' → afficher résultat
// - 'game:playerJoined' → notifier l'adversaire
```

## 5. Types TypeScript

### 5.1 User.ts
- [ ] Ajouter `role`, `rating` si disponible dans la réponse backend

### 5.2 Game.ts
- [ ] Vérifier que tous les champs correspondent au schema Prisma
- [ ] Ajouter `white_player`, `black_player` si nécessaire

### 5.3 Créer nouveaux types
- [ ] `Tournament`
- [ ] `Challenge`
- [ ] `Notification` (si endpoint créé)
- [ ] `InvitationLink`

## 6. Endpoints Backend disponibles

### Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/refresh`
- POST `/api/auth/logout`
- POST `/api/auth/password/forgot`
- POST `/api/auth/password/reset`

### Users
- GET `/api/users` (ADMIN only)
- GET `/api/users/:userId`
- PATCH `/api/users/me/username`
- PATCH `/api/users/me/avatar`
- DELETE `/api/users/me`

### Games
- POST `/api/games` - créer une partie
- GET `/api/games/me` - mes parties
- GET `/api/games/:gameId`
- POST `/api/games/:gameId/moves` - jouer un coup
- GET `/api/games/:gameId/moves` - historique des coups
- POST `/api/games/:gameId/resign` - abandonner
- POST `/api/games/:gameId/draw-offer` - offrir nul
- GET `/api/games/:gameId/messages` - chat de partie
- POST `/api/games/:gameId/messages` - envoyer message

### Challenges
- POST `/api/challenges`
- GET `/api/challenges`
- PATCH `/api/challenges/:challengeId`
- DELETE `/api/challenges/:challengeId`

### Tournaments
- POST `/api/tournaments`
- GET `/api/tournaments`
- GET `/api/tournaments/:tournamentId`
- POST `/api/tournaments/:tournamentId/join`
- etc.

### Invitation Links
- POST `/api/invitation-links`
- GET `/api/invitation-links`
- DELETE `/api/invitation-links/:linkId`

## 7.，一步一步

### Step 1: Auth fonctionne
1. Vérifier login/register via Postman
2.Intégrer dans AuthContext

### Step 2: Charger les données utilisateur
1. `/users/me` après login
2. Afficher profil dans header

### Step 3: Lobby - Liste joueurs
1. Créer endpoint public OU utiliser challenge system

### Step 4: Créer une partie
1. POST `/games`
2. Répondre avec invitation challenge

### Step 5: Jeu en temps réel
1. Connecter Socket
2. Écouter `game:moveMade`
3. Afficher coup adverse

### Step 6: Historique des parties
1. GET `/games/me`
2. Voir une partie terminée

---

**Note**: Certaines routes nécessitent `authenticate` middleware. Le frontend doit envoyer le token JWT dans le header `Authorization: Bearer <token>`. Axios le gère déjà.