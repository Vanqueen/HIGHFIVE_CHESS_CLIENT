import { useState, type ChangeEvent } from 'react';
import { Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type AuthPageProps = {
  onAuthSuccess: () => void;
};

// const DEMO_EMAIL = 'demo@chessarena.app';
// const DEMO_PASSWORD = 'ChessArena!2026#Demo';

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();

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

  const isPasswordWeak = mode === 'signup' && password.length > 0 && passwordScore < 3;

  const handleChangeName = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleChangeEmail = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleChangePassword = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup' && passwordScore < 3) {
      setError('Mot de passe trop faible : utilisez au moins 8 caracteres avec des majuscules, minuscules et chiffres.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const response = await register({ username, email, password });
        if (response.success === false) {
          setError(response.message || 'Erreur lors de la creation du compte.');
        } else {
          onAuthSuccess();
          setError('Compte cree ! Vous pouvez maintenant vous connecter.');
          setMode('signin');
        }
      } else {
        // const { error } = await supabase.auth.signInWithPassword({ email, password });
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
        setError('Ce mot de passe a ete signale dans des fuites connues. Choisissez une combinaison totalement differente.');
      } else if (loweredMessage.includes('invalid login credentials')) {
        setError('Email ou mot de passe incorrect. Verifiez vos informations puis reessayez.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') handleSubmit(e as unknown as React.SyntheticEvent<HTMLFormElement>);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-amber-400 to-amber-600 rounded-2xl shadow-lg shadow-amber-500/30 mb-4">
            <Crown className="w-9 h-9 text-slate-900" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">ChessArena</h1>
          <p className="text-slate-400 mt-2">Jouez aux echecs en ligne</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          <div className="flex gap-1 p-1 bg-slate-900/50 rounded-xl mb-6">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signin'
                  ? 'bg-amber-500 text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-amber-500 text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={handleChangeName}
                  required
                  minLength={3}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all"
                  placeholder="Votre pseudo"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={handleChangeEmail}
                required
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all"
                placeholder="vous@exemple.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={handleChangePassword}
                required
                minLength={8}
                className={`w-full px-4 py-2.5 bg-slate-900/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  isPasswordWeak
                    ? 'border-rose-500/50 focus:ring-rose-500/50'
                    : 'border-slate-700 focus:ring-amber-500/50'
                }`}
                placeholder="Min. 8 caracteres, majuscules et chiffres"
              />
              {mode === 'signup' && password.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => {
                      const barColor = i > passwordScore
                        ? 'bg-slate-700'
                        : passwordScore < 3
                          ? 'bg-rose-500'
                          : passwordScore < 4
                            ? 'bg-amber-500'
                            : 'bg-green-500';
                      return <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${barColor}`} />;
                    })}
                  </div>
                  <p className={`text-xs ${
                    passwordScore < 3 ? 'text-rose-400' : passwordScore < 4 ? 'text-amber-400' : 'text-green-400'
                  }`}>
                    {passwordScore < 3
                      ? 'Mot de passe faible : ajoutez majuscules, chiffres et symboles'
                      : passwordScore < 4
                        ? 'Mot de passe correct'
                        : 'Mot de passe solide'
                    }
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-linear-to-r from-amber-400 to-amber-600 text-slate-900 font-semibold rounded-xl hover:from-amber-300 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20"
            >
              {loading
                ? 'Chargement...'
                : mode === 'signin'
                  ? 'Se connecter'
                  : 'Creer un compte'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          En vous inscrivant, vous acceptez de jouer loyalement.
        </p>
      </div>
    </div>
  );
}
