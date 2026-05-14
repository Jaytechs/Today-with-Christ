// src/components/shared/ReportModal.jsx
import { useState } from 'react'
import { Flag, X, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { reportContent, REPORT_REASONS } from '../../services/moderationService'

export default function ReportModal({ contentType, contentId, onClose, onSuccess }) {
  const { user } = useAuth()
  const [reason,  setReason]  = useState(REPORT_REASONS[0])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit() {
    if (!user || !reason) return
    setLoading(true)
    setError('')
    try {
      await reportContent({ contentType, contentId, reporterId: user.uid, reason })
      onSuccess?.()
      onClose?.()
    } catch (err) {
      if (err.message === 'already_reported') setError('You have already reported this content.')
      else setError('Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag size={16} style={{ color: '#EF4444' }} />
            <p className="font-display font-semibold" style={{ color: 'var(--text-h)' }}>Report Content</p>
          </div>
          <button onClick={onClose} className="p-1 rounded" style={{ color: 'var(--text-m)' }}>
            <X size={16} />
          </button>
        </div>

        <p className="text-sm" style={{ color: 'var(--text-m)' }}>
          Help us keep this space Christ-centred. Select a reason below.
        </p>

        <div className="space-y-2">
          {REPORT_REASONS.map(r => (
            <button key={r} onClick={() => setReason(r)}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all"
              style={{
                border: `1px solid ${reason === r ? 'var(--accent)' : 'var(--border)'}`,
                background: reason === r ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'transparent',
                color: reason === r ? 'var(--accent)' : 'var(--text-b)',
                fontWeight: reason === r ? 600 : 400,
              }}>
              {r}
            </button>
          ))}
        </div>

        {error && <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>}

        <div className="flex gap-3">
          <button onClick={handleSubmit} disabled={loading}
            className="btn-primary flex-1 text-sm py-2"
            style={{ background: '#EF4444' }}>
            {loading ? <><Loader2 size={13} className="animate-spin" /> Reporting…</> : 'Submit Report'}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1 text-sm py-2">Cancel</button>
        </div>
      </div>
    </div>
  )
}
