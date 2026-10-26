# Design system et direction artistique

> Document vivant. Décrire les décisions réelles du produit, pas des préférences génériques.

## Identité
- Positionnement du produit : plateforme d'échecs en ligne (nom affiché « CHESSARENA »), orientée jeu compétitif (classé/amical), tournois et progression (succès, classements, apprentissage).
- Public : joueurs d'échecs (inscrits ou invités), organisateurs de tournois, administrateurs.
- Ton visuel : thème sombre activé par défaut (`<html class="dark">` dans `index.html`, préférence persistée dans `localStorage` via `src/assets/js/theme.ts`, avec bascule possible clair/sombre selon `prefers-color-scheme`).
- Impression à transmettre : non documentée explicitement dans le code ; aucune charte de ton/voix trouvée.
- Références approuvées : non documentées.
- Styles à éviter pour CE produit : non documentés (le fichier CLAUDE.md du projet donne des règles générales de qualité UI — pas de cartes génériques, pas de dégradés décoratifs, pas d'animation inutile — mais ce sont des règles de travail, pas des décisions produit enregistrées ici).

## Tokens visuels
- Couleurs principales (hex) : pas de palette globale unique. Deux systèmes de tokens coexistent :
  - `src/index.css` (`:root` / `:root.dark`) : `--text`, `--text-h`, `--bg`, `--border`, `--code-bg`, `--accent` (`#aa3bff` en clair / `#55bd8b` en sombre), `--accent-bg`, `--accent-border`, `--social-bg`, `--shadow`.
  - `tailwind.config.js` (`theme.extend.colors`) : `primary #3b82f6`, `secondary #64748b`, `light-indigo #e3dcff`, `yellow-love #f4a62a`, `clr-default1 #000000`, `clr-secondary #F2D671`, `clr-svg-primary #0F7818`, `clr-svg-scd #FF0000`, `clr-svg-three #334E81`, `bg-modal rgba(0,0,0,0.3)`.
  - `src/App.css` définit en plus des jeux de variables **locaux par page/section** (préfixes `--vc-*`, `--home-*`, `--guest-*`, `--computer-*`, `--setup-*`, `--auth-*`, `--piece-*`), chacun avec ses propres variantes clair/sombre.
- Couleurs de surface : `--bg` (global), et par section `--vc-card`, `--auth-panel`/`--auth-panel-raised`, `--computer-panel`, `--setup-soft`, etc.
- Couleurs de texte : `--text`/`--text-h` (global), et par section `--vc-ink`/`--vc-muted`, `--home-ink`/`--home-muted`, `--guest-ink`/`--guest-muted`, `--computer-ink`/`--computer-muted`, `--setup-ink`/`--setup-muted`, `--auth-text`/`--auth-muted`.
- Couleurs d'état : non centralisées. `src/components/ui/buttonVariants.ts` définit des variantes (`primary`, `danger`, `success`, `secondary`, `cancel`, `default`) avec des couleurs Tailwind utilitaires (`cyan-800`, `red-500`, `green-500`, `gray-200`...) indépendantes des tokens `--accent`/`--auth-accent` définis par ailleurs.
- Typographies et rôles : `--sans`/`--heading` = `system-ui, 'Segoe UI', Roboto, sans-serif` ; `--mono` = `ui-monospace, Consolas, monospace` (définis dans `src/index.css`). Les composants du flux d'authentification (`src/components/auth/*`) et `src/components/ui/Button.tsx` référencent en plus `var(--font-mono)`, `var(--font-display)`, `var(--color-accent)`, `var(--color-accent-dim)`, `var(--color-cream)`, `var(--color-muted)`, `var(--color-border-bright)` — **ces variables ne sont définies nulle part dans le projet** (voir `docs/DECISIONS.md`).
- Échelle typographique : corps de texte `18px/145%` (desktop) / `16px` (`≤1024px`) ; `h1` `56px` (desktop) / `36px` (mobile) ; `h2` `24px` / `20px` (mobile). Définie dans `src/index.css`.
- Espacements : pas d'échelle d'espacement centralisée détectée ; les marges/paddings sont définis localement par composant/page dans `src/App.css` et via les classes utilitaires Tailwind.
- Rayons : pas de table de rayons centralisée ; valeurs ad hoc par composant (ex. `rounded-md` Tailwind dans `Button.tsx`, `border-radius: 15px` pour certaines cartes dans `App.css`).
- Bordures / ombres : `--border` (global), `--shadow` (global, deux valeurs selon le thème) ; variantes locales `--vc-line`, `--home-line`, `--guest-line`, `--computer-line`, `--setup-line`, `--auth-border`.
- Grille et largeur de contenu : `#root` en `flex-direction: column`, `min-height: 100svh`, `max-width: none` ; pas de conteneur/grille max-width global détecté. Point de rupture principal répété : `@media (max-width: 1024px)`.

## Composants existants
- Boutons : `src/components/ui/Button.tsx` + `src/components/ui/buttonVariants.ts`. Variantes : `default`, `primary`, `danger`, `success`, `secondary`, `cancel`, `none` ; tailles : `default`, `sm`, `lg`, `icon`. Supporte un état `loading` (spinner SVG intégré) et `disabled`.
- Champs : `src/components/ui/InputForm.tsx` (label + erreur + hint), `InputNative.tsx`, `Label.tsx`.
- Navigation : `src/pages/Header.tsx`, `src/pages/SidebarLeft.tsx`, `src/pages/SidebarRight.tsx` (+ un doublon `SidebarLeft copy.tsx`, voir `docs/PROJECT.md`).
- Tableaux : aucun composant de tableau réutilisable identifié dans `src/components/`.
- Modales : aucun composant modal générique identifié ; `--bg-modal` défini dans `tailwind.config.js` suggère un usage prévu, mais pas de composant `Modal` trouvé dans `src/components/`.
- Notifications : `src/components/ui/toast.tsx`, `src/hooks/use-toast.ts`, `src/hooks/use-alert.tsx`.
- Graphiques : aucun composant de visualisation de données identifié.
- Autres : `ChessBoard.tsx`, `ChessBoardPreferences.tsx`, `ColorPreferenceSelector.tsx`, `GameSetupControls.tsx`, `PlayerProfileMenu.tsx`, `PlayerSearch.tsx`, `Image.tsx` ; flux d'authentification dédié (`src/components/auth/`: `AuthLayout`, `LoginForm`, `RegisterForm`, `SuccessState`, `AuthButton`) avec son propre langage visuel (variables `--color-*`/`--font-*` non définies ailleurs).

## Interactions
- Durées et types de transitions : `transition duration-200 ease-in-out` sur les boutons (`Button.tsx`) ; `transform`/`box-shadow` sur `160ms ease` pour certaines cartes (`src/App.css`, ex. `.opponent-card:hover`).
- États hover / focus / disabled : gérés via les classes Tailwind (`hover:`, `focus:ring-2`) et, pour `Button.tsx`, via des handlers `onMouseEnter`/`onMouseLeave` qui modifient directement des variables CSS inline ; `disabled:opacity-50 disabled:cursor-not-allowed` est une convention répétée.
- Respect de `prefers-reduced-motion` : aucune règle trouvée dans `src/index.css` ni `src/App.css` — non géré actuellement.
- Règles mobile : point de rupture `@media (max-width: 1024px)` répété dans plusieurs fichiers pour ajuster tailles de police et marges ; pas de règle mobile spécifique aux interactions (tap targets, etc.) documentée.

## Décisions
Pour chaque décision importante, noter le choix, la raison et les pages concernées.
- **Thème sombre par défaut avec bascule persistée** — toutes les pages. Voir `src/assets/js/theme.ts` et `index.html` (`class="dark"`).
- **Personnalisation de l'échiquier** (15 thèmes de plateau, dont noir et blanc, et styles de pièces, persistés en `localStorage` sous la clé `chessarena-board-appearance`) — choix des thèmes aussi disponible sur l'accueil invité. Voir `src/chess/chessAppearance.ts` et `src/context/ChessAppearanceContext.tsx`. Détail consigné dans `docs/DECISIONS.md`.
