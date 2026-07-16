import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  FaArrowRight,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaParking,
  FaShieldAlt,
  FaUser,
} from 'react-icons/fa';
import loginHeroImage from '../assets/login-hero.jpg';

export default function Login({ onLogin, isAuthenticated }) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username/email and password.');
      return;
    }

    const result = await onLogin(username, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Incorrect username or password');
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Local keyframes for a subtle, one-time entrance animation on the
          card. Scoped via a unique class name so nothing else is affected. */}
      <style>{`
        @keyframes loginCardFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .login-card-fade-up { animation: loginCardFadeUp 0.6s ease-out both; }
      `}</style>

      {/* Full-bleed facility photo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${loginHeroImage})` }}
        aria-hidden="true"
      />
      {/* Soft light wash so a light glass card reads clearly over the photo */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/70 via-white/10 to-transparent" aria-hidden="true" />

      {/* Floating glass login card */}
      <div className="relative z-10 flex min-h-screen items-center px-6 py-12 sm:px-10 lg:px-20">
        <div className="login-card-fade-up w-full max-w-sm rounded-3xl border border-white/60 bg-white/75 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-900/20">
              <FaParking className="text-xl" />
            </div>
            <div>
              <p className="text-lg font-extrabold leading-tight text-slate-900">
                Smart<span className="text-blue-600">Park</span>
              </p>
              <p className="text-xs font-medium text-slate-500">Smart Parking. Smarter Future.</p>
            </div>
          </div>

          <h1 className="mt-7 text-2xl font-bold text-slate-900">Administrator Login</h1>
          <p className="mt-1.5 text-sm text-slate-500">Access and manage your parking system.</p>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            <label className="block">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3.5 transition duration-200 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                <FaUser className="text-slate-400" />
                <input
                  className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Username or Email"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>
            </label>

            <label className="block">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3.5 transition duration-200 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                <FaLock className="text-slate-400" />
                <input
                  className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="shrink-0 text-slate-400 transition hover:text-blue-600"
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
                  className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                />
                Remember me
              </label>
              <button type="button" className="font-semibold text-blue-600 transition hover:text-blue-700 hover:underline">
                Forgot password?
              </button>
            </div>

            {error && (
              <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 border border-rose-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-900/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-900/30 cursor-pointer"
            >
              Login
              <FaArrowRight />
            </button>
          </form>

          <p className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
            <FaShieldAlt className="text-blue-600" />
            Secure. Reliable. Intelligent.
          </p>
        </div>
      </div>
    </main>
  );
}
