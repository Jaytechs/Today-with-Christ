// src/components/community/CommunityPostCard.jsx
// FIX: lazy comment loading, toggleAmen, proper date formatting, role badges

import { useEffect, useState, useCallback } from 'react'
import { MessageCircle, Send, ChevronDown, Handshake, Trash2 } from 'lucide-react'
import { useAuth }     from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { toggleAmen, addComment, subscribeToComments, deleteCommunityPost } from '../../firebase/firestore'

// Format a Firestore timestamp or seconds value into readable text
function formatDate(createdAt) {
  if (!createdAt) return ''
  const date = createdAt?.toDate
    ? createdAt.toDate()
    : new Date((createdAt.seconds || 0) * 1000)
  const now  = Date.now()
  const diff = now - date.getTime()
  if (diff < 60000)  return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Role badge styles
const ROLE_STYLE = {
  admin:  { bg: '#fee2e2', color: '#b91c1c', label: 'Admin' },
  mentor: { bg: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)', label: 'Mentor' },
  user:   { bg: 'color-mix(in srgb, var(--accent2) 12%, transparent)', color: 'var(--accent2)', label: 'Member' },
}

export default function CommunityPostCard({ post, onDeleted }) {
  const { user, profile, isAdmin } = useAuth()
  const { t } = useLanguage()

  const [amenState,    setAmenState]    = useState(post.amenCount || 0)
  const [hasAmened,    setHasAmened]    = useState(() => (post.amenedBy || []).includes(user?.uid))
  const [amenLoading,  setAmenLoading]  = useState(false)

  const [showComments, setShowComments] = useState(false)
  const [comments,     setComments]     = useState([])
  const [commentText,  setCommentText]  = useState('')
  const [posting,      setPosting]      = useState(false)
  const [deleting,     setDeleting]     = useState(false)

  // FIX: only subscribe to comments when the user opens the section
  useEffect(() => {
    if (!showComments) return
    const unsub = subscribeToComments(post.id, setComments)
    return unsub
  }, [showComments, post.id])

  // FIX: toggleAmen with optimistic UI update
  const handleAmen = useCallback(async () => {
    if (!user || amenLoading) return
    setAmenLoading(true)
    const newState = !hasAmened
    setHasAmened(newState)
    setAmenState(prev => prev + (newState ? 1 : -1))
    try {
      await toggleAmen(post.id, user.uid)
    } catch {
      // Revert on error
      setHasAmened(!newState)
      setAmenState(prev => prev + (newState ? -1 : 1))
    } finally {
      setAmenLoading(false)
    }
  }, [user, amenLoading, hasAmened, post.id])

  async function handleComment() {
    if (!user || !commentText.trim() || posting) return
    setPosting(true)
    try {
      await addComment(post.id, {
        uid:        user.uid,
        authorName: profile?.fullName || user.displayName || 'Friend',
        text:       commentText.trim(),
      })
      setCommentText('')
    } finally {
      setPosting(false)
    }
  }

  async function handleDelete() {
    if (!deleting && window.confirm('Delete this post?')) {
      setDeleting(true)
      try {
        await deleteCommunityPost(post.id)
        onDeleted?.(post.id)
      } finally {
        setDeleting(false)
      }
    }
  }

  const roleStyle  = ROLE_STYLE[post.role] || ROLE_STYLE.user
  const isMyPost   = user?.uid === post.userId
  const canDelete  = isAdmin || isMyPost

  return (
    <article className="dash-card space-y-4">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0"
            style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}
          >
            {(post.authorName || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>
                {post.authorName}
              </span>
              {/* Role badge */}
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: roleStyle.bg, color: roleStyle.color }}
              >
                {roleStyle.label}
              </span>
              {/* Post type */}
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-m)' }}
              >
                {post.type === 'teaching' ? t('teaching') : t('reflection')}
              </span>
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-m)' }}>
              {formatDate(post.createdAt)} · {post.category}
            </div>
          </div>
        </div>

        {/* Delete button (own post or admin) */}
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: 'var(--text-m)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-m)' }}
            title="Delete post"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* ── Scripture block ── */}
      {post.scripture && (
        <div
          className="rounded-xl p-4"
          style={{
            background:   'color-mix(in srgb, var(--accent) 6%, transparent)',
            borderLeft:   '3px solid var(--accent)',
            borderRadius: '0 0.75rem 0.75rem 0',
          }}
        >
          <p className="verse-italic text-sm" style={{ color: 'var(--text-h)' }}>
            "{post.scripture}"
          </p>
          {post.reference && (
            <p className="verse-ref text-xs mt-2">{post.reference}</p>
          )}
        </div>
      )}

      {/* ── Reflection text ── */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-b)' }}>
        {post.reflection}
      </p>

      {/* ── Actions row ── */}
      <div
        className="flex flex-wrap items-center gap-3 pt-2"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        {/* Amen toggle button */}
        <button
          onClick={handleAmen}
          disabled={!user || amenLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: hasAmened
              ? 'color-mix(in srgb, var(--accent) 20%, transparent)'
              : 'var(--bg-hover)',
            color:  hasAmened ? 'var(--accent)' : 'var(--text-b)',
            border: `1px solid ${hasAmened ? 'var(--accent)' : 'var(--border)'}`,
            opacity: amenLoading ? 0.7 : 1,
          }}
        >
          <Handshake size={14} />
          {t('amen')} · {amenState}
        </button>

        {/* Comments toggle */}
        <button
          onClick={() => setShowComments(s => !s)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
          style={{ background: 'var(--bg-hover)', color: 'var(--text-b)', border: '1px solid var(--border)' }}
        >
          <MessageCircle size={14} />
          {t('comments')} · {post.commentCount || 0}
          <ChevronDown
            size={13}
            style={{ transform: showComments ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
          />
        </button>
      </div>

      {/* ── Comments section (lazy) ── */}
      {showComments && (
        <div className="space-y-3 pt-1">
          {/* Comment list */}
          {comments.length === 0 ? (
            <p className="text-sm text-center py-3" style={{ color: 'var(--text-m)' }}>
              {t('noCommentsYet')} — {t('shareEncouragement')}
            </p>
          ) : (
            <div className="space-y-2">
              {comments.map(c => (
                <div
                  key={c.id}
                  className="rounded-xl p-3 text-sm"
                  style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-xs" style={{ color: 'var(--text-h)' }}>
                      {c.authorName}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-m)' }}>
                      {formatDate(c.createdAt)}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-b)' }}>{c.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add comment */}
          {user && (
            <div className="flex gap-2 items-end pt-1">
              <textarea
                rows={2}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder={t('shareEncouragement')}
                className="input-field resize-none flex-1 text-sm"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment() } }}
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim() || posting}
                className="btn-primary py-2 px-3"
                style={{ opacity: (!commentText.trim() || posting) ? 0.5 : 1 }}
              >
                <Send size={15} />
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
