import { type ChangeEvent, type KeyboardEvent, type SubmitEventHandler } from 'react';
import { InputForm } from '../ui/InputForm';
import { Button } from '../ui/Button';
import Label from '../ui/Label';
import { EyeIcon, EyeOff, Mail } from 'lucide-react';

interface Auth {
  onNavigate: (page: "register" | "forgot-password") => void,
  handleSubmit: SubmitEventHandler<HTMLFormElement>;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: KeyboardEvent<HTMLFormElement>) => void;
  setShowPwd: (show: boolean) => void,
  formData: {
    email: string,
    password: string
  },
  errors: Record<string, string>,
  error: string,
  loading: boolean,
  showPwd: boolean,
}

function LoginForm({ 
  onNavigate, 
  handleSubmit, 
  handleChange, 
  handleKeyDown,
  setShowPwd,
  errors,
  error,
  loading,
  showPwd,
  formData 
}: Auth) {
  return (
    <div className='mx-auto relative w-97.5! h-125! px-8 py-6 bg-linear-to-b from-[#0f0c29] via-[#302b63] to-[#24243e] font-[Jost] overflow-hidden rounded-xl shadow-2xl flex flex-col items-center justify-center'>
      <h2 className='uppercase text-[#5a5879] text-3xl font-bold mb-6'> Connexion</h2>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}
      {errors.form && <p className="mb-4 text-sm text-red-400" role="alert">{errors.form}</p>}

      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col space-y-2 w-full" noValidate>
        <div>
          <Label
            htmlFor='email' 
            children='Email' 
            required={true} 
            className='text-gray-400 text-sm font-medium mb-1 flex items-start w-full gap-1' 
          />
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <InputForm
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              error={errors.email}
              required
              className="w-full bg-white/20 pl-10 pr-4 py-3 border border-white/30 rounded-lg text-white placeholder-white/60 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              placeholder="votre@email.com"
            />
          </div>
        </div>

        <div>
          <Label
            htmlFor='password' 
            children='Mot de passe' 
            required={true} 
            className='text-gray-400 text-sm font-medium mb-1 flex items-start w-full gap-1' 
          />
          <div className="relative">
            <InputForm
              id="password"
              name='password'
              type={showPwd ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              autoComplete={formData.password}
              onChange={handleChange}
              required={true}
              minLength={6}
              error={errors.password}
              className="w-full bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
              {showPwd ? <EyeIcon size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded-lg accent-[--color-accent]" />
            <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)' }}>
              REMEMBER ME
            </span>
          </label>
          <Button
            type="button"
            onClick={() => onNavigate('forgot-password')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: '0.68rem',
              color: 'var(--color-accent)',
              cursor: 'pointer',
              letterSpacing: '0.08em',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            FORGOT?
          </Button>
        </div>

        <div className='space-y-4 mt-4'>
          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            customClass="w-auto"
          >
            {loading ? '⏳ Connexion...' : 'Se connecter'}
          </Button>
          <p className="text-center uppercase" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--color-muted)' }}>
            Pas de compte ?{' '}
            <Button
              type="button"
              onClick={() => onNavigate('register')}
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px', letterSpacing: '0.08em' }}
            >
              SIGN UP
            </Button>
          </p>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;
