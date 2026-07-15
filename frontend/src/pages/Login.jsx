import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  FaArrowRight,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaQuestionCircle,
  FaShieldAlt,
  FaUserShield,
} from 'react-icons/fa';
import loginHeroImage from '../assets/login-hero.jpg';

export default function Login({ onLogin, isAuthenticated }) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  const submit = async (event) => { event.preventDefault(); const result = await onLogin(username, password); if (result.success) navigate('/dashboard'); else setError(result.message); };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Local keyframes for subtle, one-time entrance animations. Scoped
          via unique class names so nothing else on the page is affected. */}
      <style>{`
        @keyframes loginFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .login-fade-up-delay-2 { animation: loginFadeUp 0.6s ease-out 0.2s both; }
      `}</style>

      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[3fr_2fr]">
        {/* ============================================================
            LEFT — Hero panel (~60% on desktop, top banner on smaller
            screens)
        ============================================================ */}
        {/* ============================================================
            LEFT — Hero panel (~60% on desktop, top banner on smaller
            screens)
        ============================================================ */}
        <section className="relative min-h-[320px] overflow-hidden bg-slate-950 lg:min-h-screen">
          
          {/* Optional: Dark overlay to make it look a bit richer if needed */}
          <div className="absolute inset-0 bg-slate-950/10 z-20 pointer-events-none" aria-hidden="true" />

          {/* Changed object-contain to object-cover to fulfill the container */}
          <img
            src={loginHeroImage}
            alt="ParkWise parking facility entrance"
            className="absolute inset-0 h-full w-full object-cover z-10"
          />
        </section>

        {/* ============================================================
            RIGHT — Login card (~40% on desktop)
        ============================================================ */}
        <section className="flex items-center justify-center bg-slate-50 px-6 py-12 text-slate-900">
          <div className="login-fade-up-delay-2 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl transition-shadow duration-300 hover:shadow-2xl sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-900/20">
                <FaShieldAlt className="text-2xl" />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Secure Access</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-[28px]">Welcome Back!</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to continue to your dashboard.</p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={submit}>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Username / Email</span>
                <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 transition duration-200 focus-within:border-teal-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-100">
                  <FaUserShield className="text-slate-400" />
                  <input
                    className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    placeholder="Enter your username or email"
                    value={username} onChange={(event) => setUsername(event.target.value)}
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Password</span>
                <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 transition duration-200 focus-within:border-teal-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-100">
                  <FaLock className="text-slate-400" />
                  <input
                    className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password} onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="shrink-0 text-slate-400 transition hover:text-teal-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2 font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-teal-700"
                  />
                  Remember me
                </label>
                <button type="button" className="font-semibold text-teal-700 transition hover:text-teal-800 hover:underline">
                  Forgot Password?
                </button>
              </div>

              {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-700 to-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-900/20"
              >
                Login to Dashboard
                <FaArrowRight />
              </button>

              <div className="flex items-center gap-3 pt-1" aria-hidden="true">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Or</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-teal-600 hover:text-teal-700 hover:shadow-md"
              >
                <FaShieldAlt className="text-base" />
                Login with SSO
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Need help?{' '}
              <a href="#contact-support" className="font-semibold text-teal-700 transition hover:text-teal-800 hover:underline">
                <FaQuestionCircle className="mr-1 inline-block align-[-1px] text-xs" />
                Contact Support
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
