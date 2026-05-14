// src/pages/Login.jsx  ─ PHASE 2
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function Login() {
  const { login, loginWithGoogle, authError, setAuthError } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setAuthError('')
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setAuthError('Incorrect email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    try {
      await loginWithGoogle()
      navigate('/dashboard')
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <svg viewBox="0 0 40 40" className="w-12 h-12 mx-auto mb-4">
            <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(201,168,76,0.3)" strokeWidth="1.5"/>
            <line x1="20" y1="5"  x2="20" y2="35" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="8"  y1="15" x2="32" y2="15" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <h1 className="font-display font-bold text-3xl text-cream">Welcome Back</h1>
          <p className="text-cream/40 text-sm mt-2">Continue your daily journey</p>
        </div>

        <div className="glass p-8 rounded-2xl space-y-4">
          {authError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/30">
                <Mail size={16} />
              </div>
              <input
                type="email"
                placeholder={t('email')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field pl-11"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/30">
                <Lock size={16} />
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder={t('password')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field pl-11 pr-11"
                required
              />
              <button type="button" onClick={() => setShowPass(s => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-cream/30 hover:text-cream/60">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="text-right">
              <Link to="/forgot-password"
                className="text-gold-400 hover:text-gold-300 text-xs font-medium">
                {t('forgotPassword')}
              </Link>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3.5 text-base disabled:opacity-50">
              {loading ? 'Signing in…' : <>{t('loginBtn')} <ArrowRight size={18} /></>}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-cream/30 text-xs">{t('orContinueWith')}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google */}
          <button onClick={handleGoogle} disabled={loading}
            className="w-full glass border border-white/15 hover:border-gold-500/30
                       hover:bg-white/5 rounded-xl p-3 flex items-center justify-center gap-3
                       text-cream/70 hover:text-cream text-sm font-medium transition-all duration-200">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t('signInGoogle')}
          </button>

          <p className="text-center text-cream/40 text-sm pt-2">
            {t('dontHave')}{' '}
            <Link to="/register" className="text-gold-400 hover:text-gold-300 font-medium">
              {t('register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
