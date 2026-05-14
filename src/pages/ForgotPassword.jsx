// src/pages/ForgotPassword.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const { t } = useLanguage()
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError('Could not find an account with that email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <svg viewBox="0 0 40 40" className="w-12 h-12 mx-auto mb-4">
            <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(201,168,76,0.3)" strokeWidth="1.5"/>
            <line x1="20" y1="5"  x2="20" y2="35" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="8"  y1="15" x2="32" y2="15" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <h1 className="font-display font-bold text-3xl text-cream">{t('resetPassword')}</h1>
          <p className="text-cream/40 text-sm mt-2">We will send you a reset link</p>
        </div>

        <div className="glass p-8 rounded-2xl">
          {sent ? (
            <div className="text-center py-6 space-y-4">
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
              <h3 className="font-display font-semibold text-cream text-xl">Check your email</h3>
              <p className="text-cream/50 text-sm">
                We sent a password reset link to <span className="text-gold-400">{email}</span>
              </p>
              <Link to="/login" className="btn-primary justify-center mt-4 inline-flex">
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}
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
              <button type="submit" disabled={loading}
                className="btn-primary w-full justify-center py-3.5 disabled:opacity-50">
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <Link to="/login"
                className="flex items-center justify-center gap-2 text-cream/40 hover:text-cream text-sm pt-2 transition-colors">
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
