// src/components/shared/UIStates.jsx
// Production-ready reusable UI state components
// ErrorState | EmptyState | LoadingSpinner | PageSpinner | SkeletonCard | Toast

import { AlertTriangle, RefreshCw, Inbox } from 'lucide-react'

// ── Loading Spinner ───────────────────────────────────────────────────────────
export function LoadingSpinner({ size = 28, className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        style={{
          width:  size, height: size,
          border: '2.5px solid var(--border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.75s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// Full-page spinner (e.g. lazy-loaded routes)
export function PageSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <LoadingSpinner size={36} />
      <p className="text-sm" style={{ color: 'var(--text-m)' }}>Loading…</p>
    </div>
  )
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────
export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="dash-card space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex-shrink-0" style={{ background: 'var(--bg-hover)' }} />
        <div className="space-y-2 flex-1">
          <div className="h-3 rounded-full w-32" style={{ background: 'var(--bg-hover)' }} />
          <div className="h-2 rounded-full w-20" style={{ background: 'var(--bg-hover)' }} />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded-full"
            style={{ background: 'var(--bg-hover)', width: `${[100, 80, 60][i] || 75}%` }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Error State ───────────────────────────────────────────────────────────────
export function ErrorState({
  title   = 'Something went wrong',
  message = 'We could not load this content. Please try again.',
  onRetry,
  compact = false,
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center gap-4 ${compact ? 'py-8' : 'py-16'}`}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
      >
        <AlertTriangle size={26} style={{ color: '#EF4444' }} />
      </div>
      <div>
        <p className="font-display font-semibold text-base" style={{ color: 'var(--text-h)' }}>{title}</p>
        <p className="text-sm mt-1 max-w-xs" style={{ color: 'var(--text-m)' }}>{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-sm py-2 px-4">
          <RefreshCw size={14} /> Try Again
        </button>
      )}
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({
  title   = 'Nothing here yet',
  message = '',
  icon:   Icon = Inbox,
  action,
  actionLabel = 'Get started',
  compact = false,
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center gap-4 ${compact ? 'py-8 px-4' : 'py-16 px-6'}`}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 18%, transparent)' }}
      >
        <Icon size={26} style={{ color: 'var(--accent)', opacity: 0.7 }} />
      </div>
      <div>
        <p className="font-display font-semibold text-base" style={{ color: 'var(--text-h)' }}>{title}</p>
        {message && <p className="text-sm mt-1 max-w-xs" style={{ color: 'var(--text-m)' }}>{message}</p>}
      </div>
      {action && (
        <button onClick={action} className="btn-primary text-sm py-2 px-4">{actionLabel}</button>
      )}
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export function Toast({ message, type = 'success' }) {
  if (!message) return null
  const isError = type === 'error'
  return (
    <div
      className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg max-w-xs"
      style={{
        background: isError ? '#fee2e2' : 'color-mix(in srgb, var(--accent2) 15%, var(--bg-card))',
        color:      isError ? '#b91c1c' : 'var(--accent2)',
        border:     `1px solid ${isError ? '#fca5a5' : 'color-mix(in srgb, var(--accent2) 30%, transparent)'}`,
      }}
    >
      {message}
    </div>
  )
}

// ── Confirmation Modal ────────────────────────────────────────────────────────
export function ConfirmModal({ open, title, message, onConfirm, onCancel, danger = false }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div>
          <p className="font-display font-bold text-lg" style={{ color: 'var(--text-h)' }}>{title}</p>
          {message && <p className="text-sm mt-1" style={{ color: 'var(--text-m)' }}>{message}</p>}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="btn-primary flex-1"
            style={danger ? { background: '#EF4444' } : {}}
          >
            Confirm
          </button>
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        </div>
      </div>
    </div>
  )
}
