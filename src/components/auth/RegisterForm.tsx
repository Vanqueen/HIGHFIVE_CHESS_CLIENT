import { type ChangeEvent, type KeyboardEvent, type SubmitEventHandler } from 'react';
import { InputForm } from '../ui/InputForm';
import { Button } from '../ui/Button';
import Label from '../ui/Label';
import { EyeIcon, EyeOff } from 'lucide-react';
import { SuccessState } from './SuccessState';

interface Auth {
  onNavigate: (page: "login") => void,
  handleSubmit: SubmitEventHandler<HTMLFormElement>;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: KeyboardEvent<HTMLFormElement>) => void;
  setShowPwd: (show: boolean) => void,
  setShowConfirmPwd: (show: boolean) => void,
  form: {
    name: string,
    email: string,
    password: string,
    confirm: string
  },
  errors: Record<string, string>,
  error: string,
  done: boolean,
  loading: boolean,
  showPwd: boolean,
  score: number,
  strengthLabel: string,
  strengthColor: string,
  showConfirmPwd: boolean,
}

function RegisterForm({ 
  onNavigate, 
  handleSubmit, 
  handleChange, 
  handleKeyDown,
  setShowPwd,
  setShowConfirmPwd,
  errors,
  error,
  loading,
  showPwd,
  form,
  done,
  score,
  strengthLabel,
  strengthColor,
  showConfirmPwd
}: Auth) {
  return (
    <div className='mx-auto relative w-97.5! h-125! px-8 py-6 bg-linear-to-b from-[#0f0c29] via-[#302b63] to-[#24243e] font-[Jost] overflow-hidden rounded-xl shadow-2xl flex flex-col items-center justify-center'>
      {done ?  (
        <SuccessState email={form.email} onBack={() => onNavigate('login')} />
      ) : (
        <div>
          <h2 className='uppercase text-[#5a5879] text-3xl font-bold mb-6'>Inscription</h2>
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}
          {errors.form && <p className="mb-4 text-sm text-red-400" role="alert">{errors.form}</p>}
          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col space-y-2 w-full" noValidate>
            <div>
              <Label
                htmlFor="name"
                children="Nom complet"
                required={true}
                className="text-gray-400 text-sm font-medium mb-1 flex items-start w-full gap-1"
              />
              <InputForm
                id="name"
                name='name'
                type="text"
                placeholder="Alex Johnson"
                value={form.name}
                autoComplete={form.name}
                onChange={handleChange}
                // onChange={(e) => setForm({ ...form, name: e.target.value })}
                required={true}
                minLength={3}
                maxLength={20}
                error={errors.name}
                className="w-full bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              />
            </div>

            <div>
              <Label 
                htmlFor='email' 
                children='Email' 
                required={true} 
                className='text-gray-400 text-sm font-medium mb-1 flex items-start w-full gap-1' 
              />
              <InputForm
                id="email"
                name='email'
                type="email"
                placeholder="alex@company.io"
                value={form.email}
                autoComplete={form.email}
                onChange={handleChange}
                // onChange={(e) => setForm({ ...form, email: e.target.value })}
                required={true}
                error={errors.email}
                className="w-full bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              />
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
                  value={form.password}
                  autoComplete={form.password}
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
              {form.password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: '3px',
                          background: i <= score ? strengthColor : 'var(--color-border)',
                          transition: 'background 0.2s',
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: strengthColor, letterSpacing: '0.08em', minWidth: '3rem', textAlign: 'right' }}>
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>

            <div>
              <Label
                htmlFor='confirm' 
                children='Confirm mot de passe' 
                required={true} 
                className='text-gray-400 text-sm font-medium mb-1 flex items-start w-full gap-1' 
              />
              <div className="relative">
                <InputForm
                  id="confirm"
                  name='confirm'
                  type={showConfirmPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.confirm}
                  autoComplete={form.confirm}
                  onChange={handleChange}
                  // onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  required={true}
                  minLength={6}
                  error={errors.confirm}
                  className="w-full bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
                <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                  {showConfirmPwd ? <EyeIcon size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>

            <div className='space-y-4 mt-4'>
              {/* <label className="flex items-start gap-2 cursor-pointer mt-2">
                <input type="checkbox" required className="mt-0.5 rounded-md! accent-[--color-accent]" />
                <span className='text' style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>
                  I AGREE TO THE{' '}
                  <a href="#" style={{ color: 'var(--color-accent)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>TERMS OF SERVICE</a>
                  {' '}AND{' '}
                  <a href="#" style={{ color: 'var(--color-accent)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>PRIVACY POLICY</a>
                </span>
              </label> */}
              <Button
                variant="primary"
                customClass="" type="submit" disabled={loading}>
                {loading ? 'Inscription...' : 'Créer un compte'}
              </Button>
              <p className="text-center uppercase" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', }}>
                Vous avez déjà un compte?{' '}
                <Button
                  type="button"
                  onClick={() => onNavigate('login')}
                  style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px', letterSpacing: '0.08em' }}
                >
                  SIGN IN
                </Button>
              </p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default RegisterForm;
