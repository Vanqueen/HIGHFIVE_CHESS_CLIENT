import { useState, type ChangeEvent } from 'react';
import { ChessKnight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { KANEO_PIECES } from '../assets/pieces/kaneo';
import './AuthPage.css';
import { useNavigate } from 'react-router-dom';

type AuthPageProps = {
  onAuthSuccess: () => void;
};

const BOARD_ROWS = [
  ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
  ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
  ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'],
];

const PIECE_LABELS: Record<string, string> = {
  K: 'roi', Q: 'reine', R: 'tour', B: 'fou', N: 'cavalier', P: 'pion',
};

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(() =>
    new URLSearchParams(window.location.search).get('mode') === 'signup' ? 'signup' : 'signin',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();
  // const isPasswordWeak = password.length > 0 && password.length < 8;
  const navigate = useNavigate();

  const passwordScore = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const handleChangeName = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleChangeEmail = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleChangePassword = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const changeMode = (nextMode: 'signin' | 'signup') => {
    setMode(nextMode);
    const url = new URL(window.location.href);
    if (nextMode === 'signup') url.searchParams.set('mode', 'signup');
    else url.searchParams.delete('mode');
    window.history.replaceState(window.history.state, '', url);
    setError(null);
    setNotice(null);
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (mode === 'signup' && passwordScore < 3) {
      setError('Mot de passe trop faible : utilisez au moins 8 caractères avec des majuscules, minuscules et chiffres.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const response = await register({ username, email, password });
        if (response.success === false) {
          setError(response.message || 'Erreur lors de la création du compte.');
        } else {
          setPassword('');
          changeMode('signin');
          setNotice('Compte créé ! Vous pouvez maintenant vous connecter.');
        }
      } else {
        const response = await login({ email, password });
        if (response.success === false) {
          setError(response.message || 'Erreur lors de la connexion.');
        } else {
          onAuthSuccess();
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue';
      const loweredMessage = msg.toLowerCase();
      if (loweredMessage.includes('weak') || loweredMessage.includes('pwned')) {
        setError('Ce mot de passe a été signalé dans des fuites connues. Choisissez une combinaison totalement différente.');
      } else if (loweredMessage.includes('invalid login credentials')) {
        setError('Email ou mot de passe incorrect. Vérifiez vos informations puis réessayez.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className={`auth-layout${mode === 'signup' ? ' auth-layout--signup' : ''}`}>
        <section className="auth-panel auth-panel--form">
          <a className="auth-brand" href="/" aria-label="ChessArena, accueil">
            <span className="auth-brand__mark"><ChessKnight size={23} strokeWidth={2.2} /></span>
            <span className="auth-brand__name">CHESS<span>ARENA</span></span>
          </a>

          <div className="auth-content">
            <header className="auth-intro">
              <h1>{mode === 'signin' ? 'Heureux de vous revoir' : 'Entrez dans la partie'}</h1>
              <p>
                {mode === 'signin'
                  ? 'Connectez-vous pour retrouver vos parties et votre progression.'
                  : 'Créez votre compte et rejoignez la communauté ChessArena.'}
              </p>
            </header>

            <div className="auth-card">
              <form
                id="auth-form-panel"
                aria-label={mode === 'signin' ? 'Connexion' : 'Inscription'}
                className="auth-form"
                onSubmit={handleSubmit}
              >
                {mode === 'signup' && (
                  <div className="auth-field">
                    <label htmlFor="auth-username">Nom d'utilisateur</label>
                    <input
                      id="auth-username"
                      name="username"
                      type="text"
                      value={username}
                      onChange={handleChangeName}
                      autoComplete="username"
                      required
                      minLength={3}
                      maxLength={20}
                      placeholder="Votre pseudo"
                    />
                  </div>
                )}

                <div className="auth-field">
                  <label htmlFor="auth-email">Adresse e-mail</label>
                  <input
                    id="auth-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={handleChangeEmail}
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    placeholder="vous@exemple.com"
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="auth-password">Mot de passe</label>
                  <div className="auth-password">
                    <input
                      id="auth-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={handleChangePassword}
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      required
                      minLength={mode === 'signup' ? 8 : undefined}
                      placeholder={mode === 'signup' ? '8 caractères minimum' : 'Votre mot de passe'}
                      aria-describedby={mode === 'signup' ? 'auth-password-strength' : undefined}
                    />
                    <button
                      type="button"
                      className="auth-password__toggle"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {mode === 'signup' && password.length > 0 && (
                    <div className={`auth-strength auth-strength--${passwordScore < 3 ? 'weak' : passwordScore < 4 ? 'medium' : 'strong'}`} id="auth-password-strength">
                      <div className="auth-strength__bars" aria-hidden="true">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <span key={level} className={level <= passwordScore ? 'is-filled' : ''} />
                        ))}
                      </div>
                      <span>
                        {passwordScore < 3
                          ? 'Mot de passe trop faible'
                          : passwordScore < 4
                            ? 'Mot de passe correct'
                            : 'Mot de passe solide'}
                      </span>
                    </div>
                  )}
                </div>

                {error && <p className="auth-feedback auth-feedback--error" role="alert">{error}</p>}
                {notice && <p className="auth-feedback auth-feedback--success" role="status">{notice}</p>}

                <button className="auth-submit" type="submit" disabled={loading}>
                  {loading
                    ? 'Connexion en cours…'
                    : mode === 'signin'
                      ? 'Se connecter'
                      : 'Créer mon compte'}
                </button>
              </form>

              <p className="auth-card__footnote">
                <ShieldCheck size={15} />
                Vos informations restent protégées.
              </p>
            </div>

            <p className="auth-mode-switch">
              {mode === 'signin' ? 'Vous n’avez pas encore de compte ?' : 'Vous avez déjà un compte ?'}{' '}
              <button
                type="button"
                onClick={() => changeMode(mode === 'signin' ? 'signup' : 'signin')}
              >
                {mode === 'signin' ? 'Créer un compte' : 'Se connecter'}
              </button>
            </p>

            <p className="auth-terms">
              En continuant, vous acceptez de jouer loyalement et de respecter la communauté.
            </p>
          </div>

          <footer className="auth-footer">© 2026 ChessArena · Le jeu, à votre rythme.</footer>
        </section>

        <aside className="auth-panel auth-panel--visual" aria-label="Découvrez ChessArena">
          <div className="auth-visual__glow" aria-hidden="true" />
          <div className="auth-visual__topline">
            <span className="auth-visual__status">ÉCHECS EN LIGNE</span>
            <nav className="auth-visual__nav" aria-label="Navigation de connexion">
              <button
                type="button"
                onClick={() => navigate('/')}
              >
                Accueil
              </button>
              <button
                type="button"
                className={mode === 'signin' ? 'is-active' : undefined}
                aria-pressed={mode === 'signin'}
                onClick={() => changeMode('signin')}
              >
                Connexion
              </button>
              <button
                type="button"
                className={mode === 'signup' ? 'is-active' : undefined}
                aria-pressed={mode === 'signup'}
                onClick={() => changeMode('signup')}
              >
                Créer un compte
              </button>
            </nav>
          </div>

          <div className="auth-visual__content">
            <p className="auth-eyebrow">VOTRE ESPACE DE JEU</p>
            <h2>Jouez aux<br />échecs <span>en ligne.</span></h2>
            <p className="auth-visual__description">
              Créez un compte pour retrouver vos parties et votre progression.
            </p>

            <div className="auth-board" aria-hidden="true">
              {BOARD_ROWS.flatMap((row, rowIndex) =>
                row.map((piece, columnIndex) => (
                  <span
                    key={`${rowIndex}-${columnIndex}`}
                    className={`auth-board__square ${(rowIndex + columnIndex) % 2 === 0 ? 'is-light' : 'is-dark'}`}
                  >
                    {piece && (
                      <span
                        className="auth-board__piece"
                        role="img"
                        aria-label={`${PIECE_LABELS[piece[1]]} ${piece[0] === 'w' ? 'blanc' : 'noir'}`}
                        dangerouslySetInnerHTML={{ __html: KANEO_PIECES[piece] }}
                      />
                    )}
                  </span>
                )),
              )}
            </div>
          </div>

        </aside>
      </div>
    </main>
  );
}
