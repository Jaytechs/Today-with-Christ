// src/pages/Register.jsx  ─ PHASE 2
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, User, Mail, Lock, Globe, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function Register() {
  const { register, loginWithGoogle, authError, setAuthError } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirm: '', language: 'en',
  })
  const [showPass,    setShowPass]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [errors,      setErrors]      = useState({})

  function validate() {
    const e = {}
    if (!form.fullName.trim())                           e.fullName = 'Name is required'
    if (!form.email.includes('@'))                        e.email    = 'Enter a valid email'
    if (form.password.length < 8)                         e.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirm)                   e.confirm  = 'Passwords do not match'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setAuthError('')
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setAuthError(err.message)
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

  const field = (name, placeholder, icon, type = 'text', extra = {}) => (
    <div>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/30">{icon}</div>
        <input
          type={type}
          placeholder={placeholder}
          value={form[name]}
          onChange={e => { setForm(f => ({ ...f, [name]: e.target.value })); setErrors(er => ({ ...er, [name]: '' })) }}
          className={`input-field pl-11 ${errors[name] ? 'border-red-500/60' : ''}`}
          {...extra}
        />
      </div>
      {errors[name] && <p className="text-red-400 text-xs mt-1 ml-1">{errors[name]}</p>}
    </div>
  )

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
          <h1 className="font-display font-bold text-3xl text-cream">Create Account</h1>
          <p className="text-cream/40 text-sm mt-2">Begin your daily journey with Christ</p>
        </div>

        <div className="glass p-8 rounded-2xl space-y-4">
          {authError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {field('fullName', t('fullName'), <User size={16} />)}
            {field('email',    t('email'),    <Mail size={16} />, 'email')}

            {/* Password */}
            <div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/30"><Lock size={16} /></div>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder={t('password')}
                  value={form.password}
                  onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(er => ({ ...er, password: '' })) }}
                  className={`input-field pl-11 pr-11 ${errors.password ? 'border-red-500/60' : ''}`}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-cream/30 hover:text-cream/60">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1 ml-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/30"><Lock size={16} /></div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder={t('confirmPassword')}
                  value={form.confirm}
                  onChange={e => { setForm(f => ({ ...f, confirm: e.target.value })); setErrors(er => ({ ...er, confirm: '' })) }}
                  className={`input-field pl-11 pr-11 ${errors.confirm ? 'border-red-500/60' : ''}`}
                />
                <button type="button" onClick={() => setShowConfirm(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-cream/30 hover:text-cream/60">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirm && <p className="text-red-400 text-xs mt-1 ml-1">{errors.confirm}</p>}
            </div>

            {/* Language select */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/30"><Globe size={16} /></div>
              <select
                value={form.language}
                onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                className="input-field pl-11 appearance-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="bem">Bemba (Icibemba)</option>
              </select>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Creating account…' : <>{t('register')} <ArrowRight size={18} /></>}
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
            {t('alreadyHave')}{' '}
            <Link to="/login" className="text-gold-400 hover:text-gold-300 font-medium">
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
