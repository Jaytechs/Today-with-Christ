// src/pages/AdminPanel.jsx — Full admin: roles, moderation queue, reports

import { useEffect, useState, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { Shield, UserCheck, Users, Loader2, Flag, Trash2, CheckCircle2, XCircle, Eye } from 'lucide-react'
import { useAuth }     from '../context/AuthContext'
import { Toast }       from '../components/shared/UIStates'
import { useToast }    from '../hooks/useToast'
import { getAllUsers, setUserRole } from '../firebase/firestore'
import {
  getPendingReports, reviewReport,
  adminDeletePost, setUserDisabled, verifyMentor,
} from '../services/moderationService'

const ROLE_OPTIONS = ['user', 'mentor', 'admin']
const ROLE_BADGE   = {
  admin:  { bg: '#fee2e2', color: '#b91c1c' },
  mentor: { bg: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' },
  user:   { bg: 'var(--bg-hover)', color: 'var(--text-m)' },
}

export default function AdminPanel() {
  const { isAdmin, user } = useAuth()
  const { toast, showToast } = useToast()

  const [tab,      setTab]      = useState('users')   // 'users' | 'reports'
  const [users,    setUsers]    = useState([])
  const [reports,  setReports]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [updating, setUpdating] = useState(null)
  const [search,   setSearch]   = useState('')

  if (!isAdmin) return <Navigate to="/dashboard" replace />

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [u, r] = await Promise.all([getAllUsers(200), getPendingReports()])
      setUsers(u); setReports(r)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleRoleChange(uid, newRole) {
    if (uid === user?.uid && newRole !== 'admin') {
      showToast('You cannot remove your own admin role.', 'error'); return
    }
    setUpdating(uid)
    try {
      await setUserRole(uid, newRole)
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole, isVerifiedMentor: newRole === 'mentor' } : u))
      showToast(`Role updated to ${newRole} ✓`)
    } catch { showToast('Failed to update role.', 'error') }
    finally { setUpdating(null) }
  }

  async function handleDisableUser(uid, disabled) {
    setUpdating(uid)
    try {
      await setUserDisabled(uid, disabled)
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, disabled } : u))
      showToast(disabled ? 'User disabled.' : 'User re-enabled.')
    } finally { setUpdating(null) }
  }

  async function handleReviewReport(reportId, action, postId) {
    try {
      if (action === 'delete_post' && postId) {
        await adminDeletePost(postId)
        await reviewReport(reportId, user.uid, 'reviewed')
      } else {
        await reviewReport(reportId, user.uid, action)
      }
      setReports(prev => prev.filter(r => r.id !== reportId))
      showToast(action === 'dismissed' ? 'Report dismissed.' : 'Content removed. Report closed.')
    } catch { showToast('Action failed. Try again.', 'error') }
  }

  const filtered = users.filter(u =>
    !search ||
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total:   users.length,
    mentors: users.filter(u => u.role === 'mentor').length,
    admins:  users.filter(u => u.role === 'admin').length,
    reports: reports.length,
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Toast message={toast.message} type={toast.type} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
          <Shield size={20} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-h)' }}>Admin Panel</h2>
          <p className="text-sm" style={{ color: 'var(--text-m)' }}>Manage users, roles, and reported content</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: stats.total,   icon: Users },
          { label: 'Mentors',     value: stats.mentors, icon: UserCheck },
          { label: 'Admins',      value: stats.admins,  icon: Shield },
          { label: 'Reports',     value: stats.reports, icon: Flag, alert: stats.reports > 0 },
        ].map(({ label, value, icon: Icon, alert }) => (
          <div key={label} className="dash-card text-center py-5" style={alert && value > 0 ? { border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' } : {}}>
            <Icon size={18} className="mx-auto mb-2" style={{ color: alert && value > 0 ? '#EF4444' : 'var(--accent)' }} />
            <div className="font-display font-bold text-3xl" style={{ color: alert && value > 0 ? '#EF4444' : 'var(--accent)' }}>{value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-m)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-hover)' }}>
        {[{ id: 'users', label: 'User Roles' }, { id: 'reports', label: `Reports (${stats.reports})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 text-sm font-semibold py-2 px-4 rounded-lg transition-all"
            style={{ background: tab === t.id ? 'var(--bg-card)' : 'transparent', color: tab === t.id ? 'var(--accent)' : 'var(--text-m)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="dash-card">
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-h)' }}>User Roles</h3>
            <input type="text" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)}
              className="input-field text-sm py-2" style={{ maxWidth: 260 }} />
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} /></div>
          ) : (
            <div className="space-y-2">
              {filtered.length === 0 && <p className="text-sm text-center py-8" style={{ color: 'var(--text-m)' }}>No users found.</p>}
              {filtered.map(u => {
                const badge = ROLE_BADGE[u.role] || ROLE_BADGE.user
                const isMe  = u.uid === user?.uid
                const busy  = updating === u.uid
                return (
                  <div key={u.uid} className="flex items-center gap-3 p-3 rounded-xl flex-wrap"
                    style={{ border: '1px solid var(--border)', background: isMe ? 'color-mix(in srgb, var(--accent) 5%, transparent)' : u.disabled ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>
                      {(u.fullName || u.email || 'U')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-h)' }}>{u.fullName || '—'}</span>
                        {isMe && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-hover)', color: 'var(--text-m)' }}>You</span>}
                        {u.disabled && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>Disabled</span>}
                      </div>
                      <div className="text-xs truncate" style={{ color: 'var(--text-m)' }}>{u.email}</div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ background: badge.bg, color: badge.color }}>
                      {u.role || 'user'}{u.isVerifiedMentor && u.role === 'mentor' ? ' ✓' : ''}
                    </span>
                    <div className="flex items-center gap-2">
                      {busy ? <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent)' }} /> : (
                        <>
                          <select value={u.role || 'user'} onChange={e => handleRoleChange(u.uid, e.target.value)}
                            className="input-field text-xs py-1.5 pr-7" style={{ width: 110 }}>
                            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                          </select>
                          {!isMe && (
                            <button onClick={() => handleDisableUser(u.uid, !u.disabled)}
                              className="text-xs px-2 py-1.5 rounded-lg flex-shrink-0"
                              style={{ background: u.disabled ? 'color-mix(in srgb, var(--accent2) 10%, transparent)' : 'rgba(239,68,68,0.08)', color: u.disabled ? 'var(--accent2)' : '#EF4444', border: '1px solid currentColor' }}>
                              {u.disabled ? 'Re-enable' : 'Disable'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {tab === 'reports' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} /></div>
          ) : reports.length === 0 ? (
            <div className="dash-card text-center py-12">
              <CheckCircle2 size={36} className="mx-auto mb-3" style={{ color: 'var(--accent2)' }} />
              <p className="font-semibold" style={{ color: 'var(--text-h)' }}>No pending reports</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-m)' }}>The community is behaving well 🙏</p>
            </div>
          ) : (
            reports.map(r => (
              <div key={r.id} className="dash-card space-y-3" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Flag size={14} style={{ color: '#EF4444' }} />
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#EF4444' }}>Reported {r.contentType}</span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-b)' }}><strong>Reason:</strong> {r.reason}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-m)' }}>Content ID: {r.contentId}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {r.contentType === 'post' && (
                    <button onClick={() => handleReviewReport(r.id, 'delete_post', r.contentId)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                      <Trash2 size={12} /> Delete Post
                    </button>
                  )}
                  <button onClick={() => handleReviewReport(r.id, 'reviewed')}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5"
                    style={{ background: 'color-mix(in srgb, var(--accent2) 10%, transparent)', color: 'var(--accent2)' }}>
                    <CheckCircle2 size={12} /> Mark Reviewed
                  </button>
                  <button onClick={() => handleReviewReport(r.id, 'dismissed')}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-m)' }}>
                    <XCircle size={12} /> Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Role guide */}
      <div className="rounded-xl p-4 text-sm leading-relaxed space-y-1"
        style={{ background: 'color-mix(in srgb, var(--calm) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--calm) 25%, transparent)', color: 'var(--text-b)' }}>
        <p className="font-semibold mb-1" style={{ color: 'var(--text-h)' }}>Role permissions</p>
        <p><strong>User</strong> — post reflections, comment, react with Amen, submit prayer requests.</p>
        <p><strong>Mentor</strong> — all user permissions + add scriptures, prayer points, lessons, videos, and pathway levels.</p>
        <p><strong>Admin</strong> — full access including this panel, disabling users, reviewing reports, and managing all content.</p>
      </div>
    </div>
  )
}
