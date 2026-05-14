// src/components/dashboard/Sidebar.jsx — Enhanced with Reminders link

import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, BookOpen, Heart, PenLine, TrendingUp, Map,
  MessageSquare, Video, Bell, Settings, LogOut,
  X, Sun, Moon, History, Shield,
} from 'lucide-react'
import { useAuth }     from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme }    from '../../context/ThemeContext'

export default function Sidebar({ open, onClose }) {
  const { logout, profile, isAdmin } = useAuth()
  const { t, lang, toggleLang }      = useLanguage()
  const { theme, toggleTheme }       = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  async function handleLogout() { await logout(); navigate('/') }

  const NAV_ITEMS = [
    { to: '/dashboard',            icon: Home,          label: t('dashboard')  },
    { to: '/dashboard/scripture',  icon: BookOpen,      label: t('scripture')  },
    { to: '/dashboard/prayer',     icon: Heart,         label: t('prayer')     },
    { to: '/dashboard/reflection', icon: PenLine,       label: t('reflection') },
    { to: '/dashboard/history',    icon: History,       label: 'History'       },
    { to: '/dashboard/progress',   icon: TrendingUp,    label: t('progress')   },
    { to: '/dashboard/community',  icon: MessageSquare, label: t('community')  },
    { to: '/dashboard/videos',     icon: Video,         label: t('videos')     },
    { to: '/dashboard/pathway',    icon: Map,           label: t('pathway')    },
    ...(isAdmin ? [{ to: '/dashboard/admin', icon: Shield, label: 'Admin' }] : []),
  ]

  const ACCOUNT_ITEMS = [
    { to: '/dashboard/reminders', icon: Bell,     label: 'Reminders' },
  ]

  const isActive = (to) => {
    if (to === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(to)
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      )}
      <aside className={`fixed top-0 left-0 bottom-0 w-64 z-50 flex flex-col sidebar-shell transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={onClose} className="lg:hidden absolute top-4 right-4 btn-ghost p-1.5 rounded-lg"><X size={18} /></button>

        {/* Logo */}
        <div className="px-6 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 36 36" className="w-9 h-9 flex-shrink-0">
              <circle cx="18" cy="18" r="16" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeOpacity="0.5"/>
              <line x1="18" y1="5"  x2="18" y2="31" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="7"  y1="14" x2="29" y2="14" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <div>
              <div className="font-display font-bold text-sm leading-tight" style={{ color: 'var(--accent)' }}>Today with Christ</div>
              <div className="text-xs" style={{ color: 'var(--text-m)' }}>Daily Practice</div>
            </div>
          </div>
        </div>

        {/* User */}
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="user-avatar flex-shrink-0">{(profile?.fullName || 'U')[0].toUpperCase()}</div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-h)' }}>{profile?.fullName || 'Friend'}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--accent)' }}>🔥 {profile?.currentStreak || 0} {t('streakDays')}</div>
              <div className="text-xs mt-0.5 capitalize" style={{ color: 'var(--text-m)' }}>
                {profile?.role === 'admin' ? '⚙️ Admin' : profile?.role === 'mentor' ? '🎓 Mentor' : '✝️ Member'}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <div className="px-3 mb-3">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-m)' }}>Daily Practice</span>
          </div>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const active = isActive(to)
            return (
              <Link key={to} to={to} onClick={onClose} className={`nav-item ${active ? 'active' : ''}`}>
                <Icon size={17} />
                <span>{label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />}
              </Link>
            )
          })}

          <div className="px-3 mt-5 mb-3">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-m)' }}>Account</span>
          </div>
          {ACCOUNT_ITEMS.map(({ to, icon: Icon, label }) => {
            const active = isActive(to)
            return (
              <Link key={to} to={to} onClick={onClose} className={`nav-item ${active ? 'active' : ''}`}>
                <Icon size={17} />
                <span>{label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={toggleTheme} className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all duration-200" style={{ color: 'var(--text-b)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span className="flex items-center gap-2.5 text-sm font-medium">
              {theme === 'dark' ? <Sun size={16} style={{ color: 'var(--accent)' }} /> : <Moon size={16} style={{ color: 'var(--accent)' }} />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
            <div className="relative w-10 h-5 rounded-full transition-all duration-300 flex-shrink-0" style={{ background: theme === 'dark' ? 'var(--accent)' : 'var(--border)' }}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300" style={{ left: theme === 'dark' ? '1.25rem' : '0.125rem' }} />
            </div>
          </button>
          <div className="lang-toggle">
            <button className={`lang-btn ${lang === 'en'  ? 'active' : ''}`} onClick={() => lang !== 'en'  && toggleLang()}>EN</button>
            <button className={`lang-btn ${lang === 'bem' ? 'active' : ''}`} onClick={() => lang !== 'bem' && toggleLang()}>BEM</button>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-200" style={{ color: 'var(--text-m)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#EF4444' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-m)' }}>
            <LogOut size={16} /><span>{t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
