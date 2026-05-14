// src/components/shared/Navbar.jsx
// Detects landing page to apply dark navbar. Supports guest + mentor/admin login.

import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, Globe } from 'lucide-react'
import { useAuth }     from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth()
  const { t, lang, toggleLang }     = useLanguage()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()

  // Is the user on the public landing page?
  const isLanding = location.pathname === '/'

  async function handleLogout() { await logout(); navigate('/') }

  // Navbar styles: dark for landing, themed for all other pages
  const navStyle = isLanding
    ? 'fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b'
      + ' bg-navy-900/80 border-white/5'
    : 'fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b'
      + ' border-[var(--border)]'
  const navBg    = isLanding ? 'bg-navy-900/95' : ''
  const textCls  = isLanding ? 'text-cream/70 hover:text-cream' : 'text-[var(--text-b)] hover:text-[var(--text-h)]'

  return (
    <nav className={navStyle} style={!isLanding ? { background: 'var(--bg-sidebar)' } : {}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <svg viewBox="0 0 32 32" className="w-8 h-8">
              <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(201,168,76,0.3)" strokeWidth="1"/>
              <line x1="16" y1="5"  x2="16" y2="27" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="7"  y1="13" x2="25" y2="13" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span className="font-display font-bold text-gold-500 text-base leading-tight">
              Today with Christ
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {!isAuthenticated ? (
              <>
                <a href="#features"   className={`btn-ghost ${isLanding ? 'text-cream/70 hover:text-cream hover:bg-white/5' : ''}`}>{t('features')}</a>
                <a href="#daily-flow" className={`btn-ghost ${isLanding ? 'text-cream/70 hover:text-cream hover:bg-white/5' : ''}`}>{t('dailyFlow')}</a>
                <button onClick={toggleLang} className={`btn-ghost flex items-center gap-1.5 ${isLanding ? 'text-cream/70 hover:text-cream hover:bg-white/5' : ''}`}>
                  <Globe size={14} />
                  {lang === 'en' ? 'BEM' : 'EN'}
                </button>
                {/* Guest: read content freely */}
                <Link to="/dashboard" className={`btn-ghost ${isLanding ? 'text-cream/70 hover:text-cream hover:bg-white/5' : ''}`}>
                  Browse Content
                </Link>
                {/* Mentor/Admin login */}
                <Link to="/login" className="btn-primary ml-2 text-sm">
                  Mentor / Admin Login
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className={`btn-ghost ${isLanding ? 'text-cream/70 hover:text-cream hover:bg-white/5' : ''}`}>{t('dashboard')}</Link>
                <button onClick={toggleLang} className={`btn-ghost flex items-center gap-1.5 ${isLanding ? 'text-cream/70 hover:text-cream hover:bg-white/5' : ''}`}>
                  <Globe size={14} />
                  {lang === 'en' ? 'BEM' : 'EN'}
                </button>
                <button onClick={handleLogout} className="btn-secondary ml-2">{t('logout')}</button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 ${isLanding ? 'text-cream/70 hover:text-cream' : 'text-[var(--text-m)] hover:text-[var(--text-h)]'}`}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className={`md:hidden backdrop-blur-xl border-t px-4 py-4 space-y-2 ${isLanding ? 'bg-navy-900/95 border-white/5' : 'border-[var(--border)]'}`}
          style={!isLanding ? { background: 'var(--bg-sidebar)' } : {}}>
          {!isAuthenticated ? (
            <>
              <a href="#features"   className={`block btn-ghost w-full text-left ${isLanding ? 'text-cream/70' : ''}`} onClick={() => setMobileOpen(false)}>{t('features')}</a>
              <a href="#daily-flow" className={`block btn-ghost w-full text-left ${isLanding ? 'text-cream/70' : ''}`} onClick={() => setMobileOpen(false)}>{t('dailyFlow')}</a>
              <button onClick={() => { toggleLang(); setMobileOpen(false) }} className={`flex items-center gap-2 btn-ghost w-full ${isLanding ? 'text-cream/70' : ''}`}>
                <Globe size={14} /> Switch to {lang === 'en' ? 'Bemba' : 'English'}
              </button>
              <Link to="/dashboard" className={`block btn-ghost w-full text-left ${isLanding ? 'text-cream/70' : ''}`} onClick={() => setMobileOpen(false)}>
                Browse Content
              </Link>
              <Link to="/login" className="btn-primary w-full justify-center" onClick={() => setMobileOpen(false)}>
                Mentor / Admin Login
              </Link>
              <Link to="/register" className={`block text-center text-xs mt-1 ${isLanding ? 'text-cream/30' : 'text-[var(--text-m)]'}`} onClick={() => setMobileOpen(false)}>
                Create an account
              </Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className={`block btn-ghost w-full text-left ${isLanding ? 'text-cream/70' : ''}`} onClick={() => setMobileOpen(false)}>{t('dashboard')}</Link>
              <button onClick={() => { toggleLang(); setMobileOpen(false) }} className={`flex items-center gap-2 btn-ghost w-full ${isLanding ? 'text-cream/70' : ''}`}>
                <Globe size={14} /> Switch to {lang === 'en' ? 'Bemba' : 'English'}
              </button>
              <button onClick={handleLogout} className="btn-secondary w-full justify-center">{t('logout')}</button>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
