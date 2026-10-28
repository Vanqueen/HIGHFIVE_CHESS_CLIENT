import { useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  Search,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { KANEO_PIECES } from "../assets/pieces/kaneo";
import "./RulesPage.css";

type RuleGroup = "basics" | "competition" | "annexes";
type RuleArticle = {
  group: RuleGroup;
  reference: string;
  title: string;
  summary: string;
  points: string[];
};

const articles: RuleArticle[] = [
  {
    group: "basics", reference: "Article 1", title: "But du jeu",
    summary: "Les joueurs déplacent leurs pièces à tour de rôle. Les Blancs commencent.",
    points: [
      "Le but est de mettre le roi adverse échec et mat : il est attaqué et aucun coup légal ne peut le sauver.",
      "Il est interdit de laisser son propre roi en échec ou de prendre le roi adverse.",
      "La partie est nulle lorsqu’aucune suite de coups légaux ne peut mener au mat.",
    ],
  },
  {
    group: "basics", reference: "Article 2", title: "Échiquier et position de départ",
    summary: "Un échiquier de 64 cases, 16 pièces par camp et une case blanche en bas à droite.",
    points: [
      "Chaque joueur commence avec un roi, une dame, deux tours, deux fous, deux cavaliers et huit pions.",
      "La dame commence sur une case de sa couleur. Les pièces occupent la première rangée et les pions la rangée devant elles.",
      "Les colonnes se nomment a à h, les rangées 1 à 8. Une case se repère par une lettre et un chiffre, comme e4.",
    ],
  },
  {
    group: "basics", reference: "Article 3", title: "Déplacement des pièces",
    summary: "Chaque pièce a son déplacement. Aucune ne peut traverser une pièce sur son chemin, sauf le cavalier.",
    points: [
      "La tour se déplace en ligne droite, le fou en diagonale et la dame combine ces deux déplacements.",
      "Le cavalier avance en L et peut sauter par-dessus les pièces. Le roi avance d’une case dans toutes les directions.",
      "Le pion avance tout droit, d’une case ou de deux depuis sa case de départ si le passage est libre. Il prend en diagonale.",
      "La prise en passant n’est possible qu’immédiatement après l’avance de deux cases du pion adverse. À la dernière rangée, le pion est promu en dame, tour, fou ou cavalier.",
      "Le roque déplace le roi de deux cases vers une tour, puis place la tour juste de l’autre côté du roi. Il est impossible si le roi ou la tour concernée a déjà bougé, si le roi est en échec, traverse une case attaquée ou si le chemin est occupé.",
      "Un coup est illégal s’il expose son propre roi à une attaque ou le laisse en échec.",
    ],
  },
  {
    group: "basics", reference: "Article 4", title: "Jouer un coup",
    summary: "En compétition sur échiquier, un coup se joue d’une seule main et la règle de la pièce touchée s’applique.",
    points: [
      "Pour recentrer une pièce sans la jouer, annoncez d’abord « j’adoube » ou « j’ajuste ».",
      "Si vous touchez volontairement une de vos pièces avec l’intention de jouer, vous devez la jouer si elle a un coup légal. Pour une pièce adverse, vous devez la prendre si la prise est possible.",
      "Une fois la pièce lâchée sur sa case d’arrivée, le coup ne peut normalement plus être changé. Les modalités détaillées du roque et de la promotion sont précisées dans l’article 4.",
    ],
  },
  {
    group: "basics", reference: "Article 5", title: "Fin de partie",
    summary: "La partie se termine par un mat, un abandon ou une nulle reconnue par les règles.",
    points: [
      "Échec et mat : le joueur gagne. Pat : le joueur au trait n’a aucun coup légal, mais son roi n’est pas en échec ; la partie est nulle.",
      "Une position morte, où aucun joueur ne peut mater par une suite de coups légaux, est nulle.",
      "Les joueurs peuvent convenir d’une nulle après avoir chacun joué au moins un coup, sous réserve du règlement de la compétition.",
      "Depuis l’édition FIDE 2023, un abandon est normalement une défaite, sauf si l’adversaire ne peut mater par aucun moyen légal : le résultat est alors nul.",
    ],
  },
  {
    group: "competition", reference: "Article 6", title: "Pendule et temps de jeu",
    summary: "En compétition avec pendule, terminer son coup inclut généralement l’actionner.",
    points: [
      "Après avoir joué, arrêtez votre pendule et démarrez celle de l’adversaire. Le temps entre le coup et l’appui reste votre temps de réflexion.",
      "Les cadences, périodes et incréments doivent être définis avant la partie. Le temps non utilisé peut être reporté selon la cadence.",
      "Quand le temps est épuisé, le joueur perd, sauf si son adversaire ne peut pas le mater par aucune suite de coups légaux.",
      "En cas de problème de pendule ou d’interruption, arrêtez-la et demandez l’arbitre.",
    ],
  },
  {
    group: "competition", reference: "Article 7", title: "Irrégularités et coups illégaux",
    summary: "En tournoi, un coup illégal achevé est traité selon une procédure et peut entraîner une pénalité.",
    points: [
      "La position précédant l’irrégularité est rétablie lorsque c’est possible. L’arbitre ajuste la pendule et décide de la suite.",
      "Dans les règles FIDE 2023, la sanction d’un coup illégal achevé dépend du contexte et du nombre d’infractions : l’arbitre peut notamment corriger la position, ajouter du temps à l’adversaire ou déclarer la partie perdue après une nouvelle infraction.",
      "Une promotion oubliée après l’appui sur la pendule est régularisée par une dame de la couleur du pion selon le texte FIDE.",
    ],
  },
  {
    group: "competition", reference: "Article 8", title: "Notation des coups",
    summary: "En compétition classique, les joueurs consignent les coups en notation algébrique, sauf exceptions prévues.",
    points: [
      "La notation identifie la case d’arrivée ; les pièces sont désignées par leur initiale et le pion n’a pas de lettre.",
      "Les prises, échecs, mats et roques sont indiqués par des symboles usuels de notation algébrique.",
      "Les règles prévoient des exceptions, notamment lorsque le temps restant est très faible ou en cadence rapide/blitz.",
    ],
  },
  {
    group: "competition", reference: "Article 9", title: "Partie nulle",
    summary: "Une nulle peut venir d’un accord, d’une répétition, de la règle des coups sans prise ou d’une règle automatique.",
    points: [
      "Un joueur peut réclamer la nulle lorsqu’une même position se présente pour la troisième fois, selon la procédure de l’article 9.",
      "Un joueur peut réclamer après 50 coups de chaque joueur sans déplacement de pion ni prise.",
      "La partie est automatiquement nulle après cinq occurrences de la même position ou 75 coups de chaque joueur sans déplacement de pion ni prise. Si le dernier coup donne mat, le mat prime.",
      "Une offre de nulle est normalement faite après avoir joué et avant d’appuyer sur la pendule. Le règlement du tournoi peut encadrer ces accords.",
    ],
  },
  {
    group: "competition", reference: "Article 10", title: "Attribution des points",
    summary: "Le barème habituel est 1 point pour une victoire, ½ point pour une nulle et 0 pour une défaite.",
    points: [
      "Le règlement d’une compétition peut définir un autre barème, par exemple 3 points pour une victoire et 1 pour une nulle.",
      "Le total attribué ne peut pas dépasser le maximum prévu par le barème de la compétition.",
    ],
  },
  {
    group: "competition", reference: "Article 11", title: "Conduite des joueurs",
    summary: "Les joueurs doivent respecter l’adversaire, le cadre de jeu et les règles contre l’assistance extérieure.",
    points: [
      "Il est interdit de distraire l’adversaire, de consulter des notes ou des conseils, ou d’analyser sur un autre échiquier pendant la partie.",
      "Les appareils électroniques sont soumis aux règles de l’événement et aux instructions de l’arbitre.",
      "Un joueur peut demander une explication sur les règles et, selon le règlement, faire appel d’une décision de l’arbitre.",
    ],
  },
  {
    group: "competition", reference: "Article 12", title: "Rôle de l’arbitre",
    summary: "L’arbitre veille au respect des règles, au fair-play et au bon déroulement de l’événement.",
    points: [
      "Il observe les parties, répond aux irrégularités et peut appliquer les sanctions prévues par les lois et le règlement.",
      "Il doit éviter d’aider un joueur dans la recherche d’un coup, sauf cas expressément prévus par les règles.",
    ],
  },
  {
    group: "annexes", reference: "Annexe A", title: "Échecs rapides",
    summary: "La cadence rapide est supérieure à 10 minutes et inférieure à 60 minutes par joueur, en tenant compte de l’incrément.",
    points: [
      "Les règles de compétition peuvent s’appliquer intégralement si la supervision et l’enregistrement répondent aux conditions de l’annexe.",
      "Sinon, une procédure spécifique simplifie notamment la notation et le traitement de certaines irrégularités.",
    ],
  },
  {
    group: "annexes", reference: "Annexe B", title: "Blitz",
    summary: "Le blitz est une cadence de 10 minutes ou moins par joueur, incrément compris.",
    points: [
      "Les règles de compétition ou la procédure simplifiée du rapide s’appliquent selon le niveau de supervision prévu.",
      "Le règlement de l’événement doit préciser la procédure retenue.",
    ],
  },
  {
    group: "annexes", reference: "Annexe C", title: "Notation algébrique",
    summary: "Chaque case est repérée par une colonne (a–h) et une rangée (1–8).",
    points: [
      "En français : R roi, D dame, T tour, F fou, C cavalier. Le pion n’est pas indiqué par une lettre.",
      "Les symboles usuels indiquent notamment une prise, un échec, un mat, un roque ou une promotion.",
    ],
  },
  {
    group: "annexes", reference: "Annexe D", title: "Joueurs aveugles ou malvoyants",
    summary: "L’annexe prévoit des adaptations pour que les joueurs déficients visuels puissent jouer dans de bonnes conditions.",
    points: [
      "Elle décrit notamment l’échiquier tactile, les pièces adaptées, l’annonce et la répétition des coups, ainsi que les règles de pendule et d’assistance.",
      "L’organisateur et l’arbitre peuvent adapter les modalités aux circonstances locales.",
    ],
  },
  {
    group: "annexes", reference: "Directive II", title: "Chess960",
    summary: "Les pièces de la première rangée commencent dans l’une de 960 positions possibles ; les déplacements restent ceux des échecs classiques.",
    points: [
      "La position initiale respecte des contraintes précises, dont un roi placé entre les deux tours.",
      "Le roque est adapté à la position de départ afin que le roi et la tour arrivent sur leurs cases finales habituelles.",
    ],
  },
  {
    group: "annexes", reference: "Directives I et III", title: "Cas particuliers de compétition",
    summary: "Le document traite aussi des parties ajournées et de certaines fins de partie sans incrément.",
    points: [
      "La directive I décrit la consignation et la reprise d’une partie ajournée, avec un coup mis sous enveloppe.",
      "La directive III décrit les réclamations possibles dans certaines fins de partie au KO lorsque la cadence n’ajoute pas de temps à chaque coup.",
    ],
  },
];

const categories: { id: RuleGroup; label: string; description: string }[] = [
  { id: "basics", label: "Règles du jeu", description: "Les bases à connaître pour jouer" },
  { id: "competition", label: "En compétition", description: "Pendule, notation, nulles et arbitrage" },
  { id: "annexes", label: "Annexes", description: "Rapide, blitz, notation et situations particulières" },
];

const glossary = [
  ["Échec", "Le roi est attaqué. Le joueur doit répondre à cette attaque par un coup légal."],
  ["Échec et mat", "Le roi est attaqué et aucun coup légal ne permet d’y répondre : la partie est gagnée."],
  ["Pat", "Le joueur au trait n’a aucun coup légal, mais son roi n’est pas attaqué : partie nulle."],
  ["Roque", "Coup combiné du roi et d’une tour, soumis à des conditions précises."],
  ["Prise en passant", "Prise spéciale d’un pion, possible uniquement juste après l’avance de deux cases du pion adverse."],
  ["Promotion", "Un pion arrivé sur la dernière rangée est remplacé par une dame, une tour, un fou ou un cavalier."],
  ["Position morte", "Position où aucun des joueurs ne peut mater l’autre par une suite de coups légaux."],
  ["J’adoube", "Annonce faite avant de recentrer une pièce sans intention de la jouer."],
  ["Notation algébrique", "Écriture des coups à l’aide des coordonnées des cases et des initiales des pièces."],
  ["Cadence", "Temps de réflexion attribué à chaque joueur, parfois complété d’un incrément ou d’un délai."],
];

const pieceOptions = [
  { code: "wK", name: "Roi", rule: "Une case dans toutes les directions.", kind: "king" },
  { code: "wQ", name: "Dame", rule: "En ligne droite et en diagonale.", kind: "queen" },
  { code: "wR", name: "Tour", rule: "Le long d’une rangée ou d’une colonne.", kind: "rook" },
  { code: "wB", name: "Fou", rule: "Le long des diagonales.", kind: "bishop" },
  { code: "wN", name: "Cavalier", rule: "En L ; il peut sauter par-dessus les pièces.", kind: "knight" },
  { code: "wP", name: "Pion", rule: "Avance tout droit, prend en diagonale.", kind: "pawn" },
] as const;

function getTargets(kind: (typeof pieceOptions)[number]["kind"]) {
  const source = kind === "pawn" ? { row: 6, column: 3 } : { row: 4, column: 3 };
  const moves: string[] = [];
  const captures: string[] = [];
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      const rowDistance = Math.abs(row - source.row);
      const columnDistance = Math.abs(column - source.column);
      if (row === source.row && column === source.column) continue;
      if (kind === "king" && rowDistance <= 1 && columnDistance <= 1) moves.push(`${row}-${column}`);
      if (kind === "rook" && (row === source.row || column === source.column)) moves.push(`${row}-${column}`);
      if (kind === "bishop" && rowDistance === columnDistance) moves.push(`${row}-${column}`);
      if (kind === "queen" && (row === source.row || column === source.column || rowDistance === columnDistance)) moves.push(`${row}-${column}`);
      if (kind === "knight" && rowDistance * columnDistance === 2) moves.push(`${row}-${column}`);
      if (kind === "pawn") {
        if (column === source.column && (row === source.row - 1 || row === source.row - 2)) moves.push(`${row}-${column}`);
        if (row === source.row - 1 && columnDistance === 1) captures.push(`${row}-${column}`);
      }
    }
  }
  return { source: `${source.row}-${source.column}`, moves, captures };
}

export default function RulesPage() {
  const [activeGroup, setActiveGroup] = useState<RuleGroup>("basics");
  const [search, setSearch] = useState("");
  const [selectedPiece, setSelectedPiece] = useState<(typeof pieceOptions)[number]["kind"]>("knight");
  const selectedPieceData = pieceOptions.find((piece) => piece.kind === selectedPiece) ?? pieceOptions[4];
  const targets = useMemo(() => getTargets(selectedPiece), [selectedPiece]);
  const normalizedSearch = search.trim().toLocaleLowerCase("fr");
  const filteredArticles = articles.filter((article) => {
    if (!normalizedSearch && article.group !== activeGroup) return false;
    if (normalizedSearch && !`${article.reference} ${article.title} ${article.summary} ${article.points.join(" ")}`.toLocaleLowerCase("fr").includes(normalizedSearch)) return false;
    return true;
  });
  const filteredGlossary = glossary.filter(([term, definition]) =>
    `${term} ${definition}`.toLocaleLowerCase("fr").includes(normalizedSearch),
  );

  return (
    <main className="vc-rules">
      <header className="vc-rules__header">
        <div>
          <p className="vc-rules__eyebrow"><BookOpen size={14} /> GUIDE DU JOUEUR</p>
          <h1>Les règles des échecs</h1>
          <p className="vc-rules__lead">Les règles essentielles, expliquées clairement pour jouer en partie libre comme en compétition.</p>
        </div>
      </header>

      <section className="vc-rules__principles" aria-label="Les principes essentiels">
        <article><span><Target size={18} /></span><div><small>Objectif</small><strong>Faire échec et mat</strong></div></article>
        <article><span><Users size={18} /></span><div><small>Déroulement</small><strong>Un coup chacun son tour</strong></div></article>
        <article><span><CheckCircle2 size={18} /></span><div><small>Règle clé</small><strong>Protéger son roi</strong></div></article>
        <article><span><Clock3 size={18} /></span><div><small>En compétition</small><strong>Respecter la cadence</strong></div></article>
      </section>

      <section className="vc-rules__movement" aria-labelledby="vc-rules-movement-title">
        <div className="vc-rules__movement-copy">
          <p className="vc-rules__eyebrow">REPÈRES VISUELS</p>
          <h2 id="vc-rules-movement-title">Comment bougent les pièces ?</h2>
          <p>Choisis une pièce pour voir ses déplacements sur un échiquier dégagé. Les cases vertes indiquent ses destinations ; pour le pion, les cases dorées montrent ses prises en diagonale.</p>
          <div className="vc-rules__piece-picker" aria-label="Choisir une pièce">
            {pieceOptions.map((piece) => (
              <button
                key={piece.kind}
                type="button"
                className={selectedPiece === piece.kind ? "is-active" : ""}
                aria-pressed={selectedPiece === piece.kind}
                onClick={() => setSelectedPiece(piece.kind)}
              >
                <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: KANEO_PIECES[piece.code] }} />
                {piece.name}
              </button>
            ))}
          </div>
          <p className="vc-rules__piece-rule"><strong>{selectedPieceData.name} :</strong> {selectedPieceData.rule}</p>
        </div>
        <figure className="vc-rules__movement-figure">
          <div className="vc-rules__board" role="img" aria-label={`Déplacements du ${selectedPieceData.name.toLocaleLowerCase("fr")}, case de départ et cases accessibles mises en évidence`}>
            {Array.from({ length: 64 }, (_, index) => {
              const row = Math.floor(index / 8);
              const column = index % 8;
              const key = `${row}-${column}`;
              const isSource = key === targets.source;
              const isMove = targets.moves.includes(key);
              const isCapture = targets.captures.includes(key);
              const pieceMarkup = isSource ? KANEO_PIECES[selectedPieceData.code] : "";
              return (
                <span
                  key={key}
                  className={`vc-rules__square ${(row + column) % 2 === 0 ? "is-light" : "is-dark"}${isSource ? " is-source" : ""}${isMove ? " is-move" : ""}${isCapture ? " is-capture" : ""}`}
                >
                  {pieceMarkup && <span dangerouslySetInnerHTML={{ __html: pieceMarkup }} />}
                  {(isMove || isCapture) && <i aria-hidden="true" />}
                </span>
              );
            })}
          </div>
          <figcaption><span><i className="is-legend-move" />Déplacement</span><span><i className="is-legend-capture" />Prise possible</span></figcaption>
        </figure>
      </section>

      <section className="vc-rules__reader" aria-labelledby="vc-rules-reader-title">
        <div className="vc-rules__reader-heading">
          <div>
            <p className="vc-rules__eyebrow">LE LIVRE DES RÈGLES</p>
            <h2 id="vc-rules-reader-title">Parcourir les articles</h2>
          </div>
          <label className="vc-rules__search">
            <Search size={17} aria-hidden="true" />
            <input aria-label="Rechercher dans les règles" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une règle…" />
            {search && <button type="button" onClick={() => setSearch("")} aria-label="Effacer la recherche">×</button>}
          </label>
        </div>

        <div className="vc-rules__tabs" role="group" aria-label="Catégories de règles">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              aria-pressed={activeGroup === category.id}
              className={activeGroup === category.id && !search ? "is-active" : ""}
              onClick={() => { setActiveGroup(category.id); setSearch(""); }}
            >
              {category.label}<small>{articles.filter((article) => article.group === category.id).length} sections</small>
            </button>
          ))}
        </div>
        {!search && <p className="vc-rules__category-description">{categories.find((category) => category.id === activeGroup)?.description}</p>}

        <div className="vc-rules__articles">
          {filteredArticles.map((article) => (
            <details className="vc-rules__article" key={article.reference}>
              <summary>
                <span className="vc-rules__article-number">{article.reference}</span>
                <span className="vc-rules__article-title"><strong>{article.title}</strong><small>{article.summary}</small></span>
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <ul>{article.points.map((point) => <li key={point}>{point}</li>)}</ul>
            </details>
          ))}
          {normalizedSearch && filteredGlossary.length > 0 && (
            <section className="vc-rules__glossary-results" aria-label="Résultats du glossaire">
              <h3>Glossaire</h3>
              {filteredGlossary.map(([term, definition]) => <p key={term}><strong>{term}</strong><span>{definition}</span></p>)}
            </section>
          )}
          {filteredArticles.length === 0 && filteredGlossary.length === 0 && (
            <p className="vc-rules__empty">Aucune règle ne correspond à cette recherche.</p>
          )}
        </div>
      </section>

      {!normalizedSearch && activeGroup === "basics" && (
        <section className="vc-rules__special" aria-label="Trois coups spéciaux à retenir">
          <div className="vc-rules__special-heading"><p className="vc-rules__eyebrow">À RETENIR</p><h2>Trois règles particulières</h2></div>
          <article><span>01</span><div><h3>Le roque</h3><p>Un coup unique du roi et d’une tour. Le roi ne doit être ni en échec, ni passer par une case attaquée.</p></div></article>
          <article><span>02</span><div><h3>La prise en passant</h3><p>Une prise de pion spéciale qui doit être jouée immédiatement après l’avance de deux cases du pion adverse.</p></div></article>
          <article><span>03</span><div><h3>La promotion</h3><p>Arrivé au bout de l’échiquier, un pion devient immédiatement dame, tour, fou ou cavalier.</p></div></article>
        </section>
      )}

      <section className="vc-rules__reference" aria-label="Sources des règles">
        <span className="vc-rules__reference-icon"><ShieldCheck size={20} /></span>
        <div>
          <strong>Lois officielles de la FIDE</strong>
          <p>Cette synthèse suit les lois FIDE appliquées depuis le 1er janvier 2023. Elles encadrent les parties disputées sur échiquier.</p>
        </div>
        <a href="https://handbook.fide.com/chapter/E012023" target="_blank" rel="noreferrer">
          Lois FIDE 2023 <ExternalLink size={15} />
        </a>
      </section>
    </main>
  );
}
