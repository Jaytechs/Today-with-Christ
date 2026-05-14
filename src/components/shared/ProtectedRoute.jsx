// src/components/shared/ProtectedRoute.jsx
// Two modes:
//   requireAuth (default false) — blocks unauthenticated users, redirects to /login
//   default                    — allows guests through (for public dashboard access)

import { Navigate } from 'react-router-dom'
import { useAuth }  from '../../context/AuthContext'

function LoadingCross() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-4">
        <svg viewBox="0 0 40 40" className="w-12 h-12 animate-pulse">
          <line x1="20" y1="4"  x2="20" y2="36" stroke="#c9a84c" strokeWidth="3" strokeLinecap="round"/>
          <line x1="8"  y1="14" x2="32" y2="14" stroke="#c9a84c" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        <p className="text-sm" style={{ color: 'var(--text-m)' }}>Loading…</p>
      </div>
    </div>
  )
}

// Default: anyone (including guests) can enter. Used for Dashboard.
export default function ProtectedRoute({ children, requireAuth = false }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingCross />
  if (requireAuth && !isAuthenticated) return <Navigate to="/login" replace />
  return children
}

// Use this for routes that MUST have a logged-in user (e.g. onboarding)
export function AuthRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingCross />
  return isAuthenticated ? children : <Navigate to="/login" replace />
}
