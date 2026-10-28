import { useMemo, useState } from "react";
import { Clock3, Eye, ExternalLink, Lightbulb, Layers3, Search } from "lucide-react";
import "./StrategyPage.css";

type TermCategory = "rules" | "results" | "phases" | "moves" | "position" | "analysis" | "competition";
type ChessTerm = { name: string; category: TermCategory; definition: string };

const terms: ChessTerm[] = [
  { name: "Échec", category: "rules", definition: "Le roi est attaqué. Le joueur doit immédiatement le protéger, capturer l’attaquant ou l’intercepter." },
  { name: "Échec et mat", category: "rules", definition: "Le roi est en échec et aucun coup légal ne permet d’y répondre. La partie est terminée." },
  { name: "Pat", category: "rules", definition: "Le joueur n’est pas en échec mais ne possède aucun coup légal. La partie est nulle." },
  { name: "Roque", category: "moves", definition: "Coup spécial joué avec le roi et une tour, sous certaines conditions, pour mettre le roi à l’abri." },
  { name: "Petit roque", category: "moves", definition: "Roque du côté roi : le roi avance de deux cases vers la tour la plus proche." },
  { name: "Grand roque", category: "moves", definition: "Roque du côté dame : le roi avance de deux cases vers la tour la plus éloignée." },
  { name: "Promotion", category: "moves", definition: "Quand un pion atteint la dernière rangée, il est remplacé par une dame, une tour, un fou ou un cavalier." },
  { name: "Prise en passant", category: "moves", definition: "Prise spéciale qu’un pion peut effectuer immédiatement après l’avance de deux cases d’un pion adverse." },
  { name: "Abandon", category: "results", definition: "Un joueur reconnaît sa défaite et met fin à la partie." },
  { name: "Nulle", category: "results", definition: "Partie sans vainqueur. Elle peut notamment survenir par pat, accord ou répétition de position." },
  { name: "Ouverture", category: "phases", definition: "Première phase de la partie : les joueurs développent leurs pièces et se disputent le centre." },
  { name: "Milieu de jeu", category: "phases", definition: "Phase où les pièces sont développées et où se construisent les plans, attaques et combinaisons." },
  { name: "Finale", category: "phases", definition: "Dernière phase de la partie, généralement avec moins de pièces sur l’échiquier." },
  { name: "Développement", category: "position", definition: "Mise en jeu des pièces depuis leurs cases de départ vers des cases actives." },
  { name: "Contrôle du centre", category: "position", definition: "Influence exercée sur les cases centrales, qui facilite l’activité des pièces et limite l’adversaire." },
  { name: "Sacrifice", category: "moves", definition: "Abandon volontaire de matériel pour obtenir une attaque, une compensation ou un avantage durable." },
  { name: "Fourchette", category: "moves", definition: "Attaque simultanée de deux cibles ou plus par une même pièce." },
  { name: "Clouage", category: "moves", definition: "Attaque sur une pièce qui ne peut pas se déplacer sans exposer une pièce plus importante derrière elle." },
  { name: "Enfilade", category: "moves", definition: "Attaque en ligne d’une pièce de valeur, qui découvre une autre cible lorsqu’elle se déplace." },
  { name: "Attaque à la découverte", category: "moves", definition: "Une pièce s’écarte et révèle l’attaque d’une autre pièce située derrière elle." },
  { name: "Échec perpétuel", category: "moves", definition: "Série d’échecs répétés qui empêche le roi adverse d’échapper à l’échec et conduit souvent à la nulle." },
  { name: "Mat forcé", category: "moves", definition: "Suite de coups qui aboutit au mat quelles que soient les meilleures réponses de l’adversaire." },
  { name: "Gain de matériel", category: "analysis", definition: "Avantage obtenu en capturant une ou plusieurs pièces sans compensation équivalente." },
  { name: "Perte de matériel", category: "analysis", definition: "Désavantage causé par la perte d’une pièce ou d’un pion sans compensation suffisante." },
  { name: "Échange de pièces", category: "moves", definition: "Suite de captures réciproques où chaque camp perd une pièce, ou un ensemble de pièces." },
  { name: "Avantage positionnel", category: "analysis", definition: "Meilleure position, activité ou structure, même si le nombre de pièces est égal." },
  { name: "Avantage matériel", category: "analysis", definition: "Posséder davantage de valeur de pièces et de pions que l’adversaire." },
  { name: "Initiative", category: "analysis", definition: "Capacité à imposer des menaces et à obliger l’adversaire à répondre." },
  { name: "Tempo", category: "analysis", definition: "Unité de temps correspondant à un coup. Gagner un tempo, c’est améliorer sa position sans perdre de temps." },
  { name: "Zugzwang", category: "analysis", definition: "Position où le joueur préférerait passer son tour, car tout coup légal détériore sa situation." },
  { name: "Patzer", category: "analysis", definition: "Terme familier désignant un joueur peu expérimenté ou une erreur grossière selon le contexte." },
  { name: "Zeitnot", category: "competition", definition: "Manque de temps à la pendule, souvent dans les derniers instants avant le contrôle de temps." },
  { name: "Pion passé", category: "position", definition: "Pion qu’aucun pion adverse ne peut arrêter ou capturer sur son chemin vers la promotion." },
  { name: "Pion isolé", category: "position", definition: "Pion qui n’a pas de pion ami sur les colonnes voisines pour le soutenir." },
  { name: "Pions doublés", category: "position", definition: "Deux pions de même couleur placés sur une seule colonne après une capture." },
  { name: "Colonne ouverte", category: "position", definition: "Colonne sans pion, souvent utilisée par les tours pour pénétrer dans la position adverse." },
  { name: "Faiblesse de cases", category: "position", definition: "Cases difficiles à défendre ou à contrôler, souvent autour du roi ou dans la structure de pions." },
  { name: "Pièce pendue", category: "analysis", definition: "Pièce laissée sans défense et qui peut être capturée sans risque équivalent." },
  { name: "Erreur (blunder)", category: "analysis", definition: "Faute importante qui fait perdre un avantage ou entraîne une forte détérioration de la position." },
  { name: "Gaffe tactique", category: "analysis", definition: "Erreur qui laisse passer une combinaison immédiate, comme une fourchette ou un mat." },
  { name: "Coup brillant", category: "analysis", definition: "Coup particulièrement remarquable, souvent difficile à trouver et fondé sur une idée profonde." },
  { name: "Coup forcé", category: "moves", definition: "Coup auquel l’adversaire a très peu de réponses raisonnables, souvent à cause d’un échec ou d’une menace." },
  { name: "Coup intermédiaire", category: "moves", definition: "Coup inattendu, souvent un échec ou une menace, joué avant une reprise qui semblait immédiate." },
  { name: "Contre-attaque", category: "moves", definition: "Réponse active à une attaque, en créant à son tour une menace ou un danger." },
  { name: "Défense", category: "moves", definition: "Action qui pare une menace, protège une pièce ou maintient une position tenable." },
  { name: "Attaque sur le roi", category: "moves", definition: "Action coordonnée visant le roi adverse pour créer un mat ou gagner du matériel." },
  { name: "Réseau de mat", category: "moves", definition: "Position où plusieurs pièces contrôlent les cases de fuite du roi et préparent le mat." },
  { name: "Finale de pions", category: "phases", definition: "Finale où il ne reste que les rois et les pions. Le calcul des courses à la promotion est essentiel." },
  { name: "Finale de tours", category: "phases", definition: "Finale où chaque camp possède une ou plusieurs tours, souvent avec des pions." },
  { name: "Classement Elo", category: "competition", definition: "Indice numérique estimant la force d’un joueur à partir de ses résultats contre d’autres joueurs classés." },
];

const termCategories: { id: TermCategory | "all"; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "rules", label: "Règles" },
  { id: "results", label: "Résultats" },
  { id: "phases", label: "Phases de jeu" },
  { id: "moves", label: "Coups" },
  { id: "position", label: "Position" },
  { id: "analysis", label: "Analyse" },
  { id: "competition", label: "Compétition" },
];

const files = "abcdefgh".split("");
const ranks = "87654321".split("");
const materialValues = [
  { piece: "Pion", value: "1", mark: "♟" },
  { piece: "Cavalier", value: "3", mark: "♞" },
  { piece: "Fou", value: "3", mark: "♝" },
  { piece: "Tour", value: "5", mark: "♜" },
  { piece: "Dame", value: "9", mark: "♛" },
];

export default function StrategyPage() {
  const [activeCategory, setActiveCategory] = useState<TermCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedSquare, setSelectedSquare] = useState("e4");
  const visibleTerms = useMemo(() => terms.filter((term) => {
    const matchesCategory = activeCategory === "all" || term.category === activeCategory;
    const matchesSearch = `${term.name} ${term.definition}`.toLocaleLowerCase("fr").includes(search.trim().toLocaleLowerCase("fr"));
    return matchesCategory && matchesSearch;
  }), [activeCategory, search]);

  return (
    <main className="vc-strategy">
      <header className="vc-strategy__header">
        <p className="vc-strategy__eyebrow"><Layers3 size={14} aria-hidden="true" /> GLOSSAIRE DU JOUEUR</p>
        <h1>Les termes courants aux échecs</h1>
        <p>Les mots et expressions qu’on rencontre pendant une partie, dans les analyses et en tournoi.</p>
        <nav className="vc-strategy__quick-nav" aria-label="Sections du guide">
          <a href="#vc-strategy-themes">Termes à connaître</a>
          <a href="#vc-strategy-board">Lire l’échiquier</a>
          <a href="#vc-strategy-points">Compter les points</a>
        </nav>
      </header>

      <section className="vc-strategy__catalog" id="vc-strategy-themes" aria-labelledby="vc-strategy-catalog-title">
        <div className="vc-strategy__catalog-heading">
          <div><p className="vc-strategy__eyebrow">NOTIONS À CONNAÎTRE</p><h2 id="vc-strategy-catalog-title">Glossaire des échecs</h2></div>
          <label className="vc-strategy__search"><Search size={16} aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un terme…" aria-label="Rechercher un terme d’échecs" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Effacer la recherche">×</button>}</label>
        </div>
        <div className="vc-strategy__tabs" role="group" aria-label="Filtrer les termes par catégorie">
          {termCategories.map((category) => <button type="button" key={category.id} className={activeCategory === category.id ? "is-active" : ""} aria-pressed={activeCategory === category.id} onClick={() => setActiveCategory(category.id)}>{category.label}</button>)}
        </div>
        <p className="vc-strategy__description">{visibleTerms.length} {visibleTerms.length === 1 ? "terme affiché" : "termes affichés"}</p>
        <div className="vc-strategy__terms">
          {visibleTerms.map((term, index) => <article className="vc-strategy__term" key={term.name}><span className="vc-strategy__term-number">{String(index + 1).padStart(2, "0")}</span><div><h3>{term.name}</h3><p>{term.definition}</p></div></article>)}
          {visibleTerms.length === 0 && <p className="vc-strategy__empty">Aucun terme ne correspond à cette recherche.</p>}
        </div>
      </section>

      <section className="vc-strategy__section" id="vc-strategy-board" aria-labelledby="vc-strategy-board-title">
        <div className="vc-strategy__section-heading">
          <div><span className="vc-strategy__section-icon"><Eye size={18} /></span><div><p className="vc-strategy__eyebrow">COORDONNÉES ET REPÈRES</p><h2 id="vc-strategy-board-title">Lire l’échiquier</h2></div></div>
          <p>Les Blancs commencent en bas. Clique une case pour afficher sa coordonnée.</p>
        </div>
        <div className="vc-strategy__board-layout">
          <div className="vc-strategy__board" role="group" aria-label="Échiquier interactif pour apprendre les coordonnées">
            {ranks.flatMap((rank, row) => files.map((file, column) => {
              const square = `${file}${rank}`;
              const isLight = (row + column) % 2 === 0;
              return <button key={square} type="button" className={`vc-strategy__square ${isLight ? "is-light" : "is-dark"}${selectedSquare === square ? " is-selected" : ""}`} onClick={() => setSelectedSquare(square)} aria-label={`Case ${square}`} aria-pressed={selectedSquare === square}>{column === 0 && <span className="vc-strategy__rank" aria-hidden="true">{rank}</span>}{row === 7 && <span className="vc-strategy__file" aria-hidden="true">{file}</span>}</button>;
            }))}
          </div>
          <div className="vc-strategy__coordinate-card">
            <span className="vc-strategy__coordinate-label">CASE SÉLECTIONNÉE</span>
            <strong>{selectedSquare}</strong>
            <p><b>{selectedSquare[0]}</b> indique la colonne, de <b>a</b> à <b>h</b>. <b>{selectedSquare[1]}</b> indique la rangée, de <b>1</b> à <b>8</b>.</p>
            <div className="vc-strategy__board-tip"><Lightbulb size={16} /><span>La case <b>a1</b>, dans le coin inférieur gauche côté Blancs, est toujours noire.</span></div>
          </div>
        </div>
      </section>

      <section className="vc-strategy__section" id="vc-strategy-points" aria-labelledby="vc-strategy-points-title">
        <div className="vc-strategy__section-heading">
          <div><span className="vc-strategy__section-icon"><Clock3 size={18} /></span><div><p className="vc-strategy__eyebrow">MATÉRIEL ET RÉSULTATS</p><h2 id="vc-strategy-points-title">Deux façons de compter</h2></div></div>
          <p>La valeur des pièces aide à évaluer une position. Les points de résultat déterminent le classement.</p>
        </div>
        <div className="vc-strategy__scores">
          <article className="vc-strategy__score-card">
            <div className="vc-strategy__score-heading"><h3>Valeur indicative des pièces</h3><span>Matériel</span></div>
            <p className="vc-strategy__score-intro">Ces valeurs sont des repères pour comparer le matériel, pas des points ajoutés au classement.</p>
            <div className="vc-strategy__piece-values">
              {materialValues.map((item) => <div className="vc-strategy__piece-value" key={item.piece}><span aria-hidden="true">{item.mark}</span><strong>{item.piece}</strong><b>{item.value}</b></div>)}
            </div>
            <p className="vc-strategy__king-note">Le roi n’a pas de valeur numérique : il doit être protégé. Le perdre met fin à la partie par échec et mat.</p>
          </article>
          <article className="vc-strategy__score-card">
            <div className="vc-strategy__score-heading"><h3>Résultat d’une partie</h3><span>Barème standard</span></div>
            <div className="vc-strategy__result-list">
              <div><span className="vc-strategy__result-dot is-win" /><strong>Victoire</strong><b>1 point</b></div>
              <div><span className="vc-strategy__result-dot is-draw" /><strong>Match nul</strong><b>½ point chacun</b></div>
              <div><span className="vc-strategy__result-dot is-loss" /><strong>Défaite</strong><b>0 point</b></div>
            </div>
            <p className="vc-strategy__king-note">Le règlement du tournoi peut prévoir un autre barème. En cas d’égalité, il peut utiliser un départage, par exemple le Buchholz.</p>
          </article>
        </div>
        <a className="vc-strategy__official-link" href="https://handbook.fide.com/chapter/e012023" target="_blank" rel="noreferrer">Consulter les lois officielles de la FIDE <ExternalLink size={14} /></a>
      </section>
    </main>
  );
}
