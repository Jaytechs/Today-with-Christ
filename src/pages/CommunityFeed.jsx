// src/pages/CommunityFeed.jsx
// Full community feed with: category filter, loading states, empty states,
// post form, real-time updates, toast feedback

import { useEffect, useMemo, useState, useCallback } from 'react'
import { Plus, Loader2, Users, RefreshCw } from 'lucide-react'
import { useAuth }     from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import CommunityPostCard from '../components/community/CommunityPostCard'
import {
  createCommunityPost,
  subscribeToCommunityPosts,
  subscribeToCommunityPostsByCategory,
  COMMUNITY_CATEGORIES,
} from '../firebase/firestore'

// Simple toast hook — no library needed
function useToast() {
  const [toast, setToast] = useState(null)
  const show = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => setToast(null), 3500)
  }, [])
  return { toast, show }
}

function Toast({ toast }) {
  if (!toast) return null
  return (
    <div
      className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg transition-all"
      style={{
        background: toast.type === 'error' ? '#fee2e2' : 'color-mix(in srgb, var(--accent2) 15%, var(--bg-card))',
        color:      toast.type === 'error' ? '#b91c1c' : 'var(--accent2)',
        border:     `1px solid ${toast.type === 'error' ? '#fca5a5' : 'color-mix(in srgb, var(--accent2) 30%, transparent)'}`,
      }}
    >
      {toast.message}
    </div>
  )
}

// Loading skeleton card
function PostSkeleton() {
  return (
    <div className="dash-card space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full" style={{ background: 'var(--bg-hover)' }} />
        <div className="space-y-2 flex-1">
          <div className="h-3 rounded-full w-32" style={{ background: 'var(--bg-hover)' }} />
          <div className="h-2 rounded-full w-24" style={{ background: 'var(--bg-hover)' }} />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 rounded-full w-full" style={{ background: 'var(--bg-hover)' }} />
        <div className="h-3 rounded-full w-4/5"  style={{ background: 'var(--bg-hover)' }} />
        <div className="h-3 rounded-full w-3/5"  style={{ background: 'var(--bg-hover)' }} />
      </div>
    </div>
  )
}

export default function CommunityFeed() {
  const { user, profile, canPostTeaching, isGuest } = useAuth()
  const { t } = useLanguage()
  const { toast, show: showToast } = useToast()

  const [posts,      setPosts]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [sending,    setSending]    = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [showForm,   setShowForm]   = useState(false)
  const [form, setForm] = useState({
    type: 'reflection', scripture: '', reference: '', reflection: '', category: 'Faith',
  })

  const categories = useMemo(() => ['All', ...COMMUNITY_CATEGORIES], [])

  // Real-time subscription — switches between all/filtered
  useEffect(() => {
    setLoading(true)
    let unsub
    if (activeCategory === 'All') {
      unsub = subscribeToCommunityPosts(data => { setPosts(data); setLoading(false) })
    } else {
      unsub = subscribeToCommunityPostsByCategory(activeCategory, data => { setPosts(data); setLoading(false) })
    }
    return unsub
  }, [activeCategory])

  function handleDeleted(postId) {
    setPosts(prev => prev.filter(p => p.id !== postId))
    showToast('Post deleted.')
  }

  async function handleSubmit() {
    if (!user || !form.reflection.trim()) return
    setSending(true)
    try {
      await createCommunityPost(user.uid, {
        authorName: profile?.fullName || user.displayName || 'Friend',
        role:       profile?.role || 'user',
        type:       form.type,
        scripture:  form.scripture.trim(),
        reference:  form.reference.trim(),
        reflection: form.reflection.trim(),
        category:   form.category,
      })
      setForm({ type: 'reflection', scripture: '', reference: '', reflection: '', category: 'Faith' })
      setShowForm(false)
      showToast(t('postShared') || 'Post shared with the community 🙏')
    } catch {
      showToast('Something went wrong. Please try again.', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-5">
      <Toast toast={toast} />

      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-h)' }}>
            {t('communityFeed')}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-m)' }}>
            {t('communityIntro')}
          </p>
        </div>
        {isGuest ? (
          <a href="/login" className="btn-primary flex-shrink-0 text-sm">
            Log in to Share
          </a>
        ) : (
          <button
            onClick={() => setShowForm(s => !s)}
            className="btn-primary flex-shrink-0"
          >
            <Plus size={15} />
            {showForm ? 'Cancel' : (t('postReflection') || 'Share')}
          </button>
        )}
      </div>

      {/* Post form */}
      {showForm && user && (
        <div className="dash-card">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}
            >
              {(profile?.fullName || 'U')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>
                {t('shareYourJourney')}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-m)' }}>
                {t('communitySafetyNote')}
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {/* Category + Type row */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-m)' }}>
                  {t('category')}
                </label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="input-field"
                >
                  {COMMUNITY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-m)' }}>
                  {t('type')}
                </label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="input-field"
                >
                  <option value="reflection">{t('reflection')}</option>
                  {canPostTeaching && <option value="teaching">{t('teaching')}</option>}
                </select>
              </div>
            </div>

            {/* Scripture + Reference row */}
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={form.scripture}
                onChange={e => setForm(f => ({ ...f, scripture: e.target.value }))}
                placeholder={t('scripturePlaceholder') || 'Scripture verse (optional)'}
                className="input-field"
              />
              <input
                type="text"
                value={form.reference}
                onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                placeholder="Reference (e.g. John 3:16)"
                className="input-field"
              />
            </div>

            {/* Reflection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-m)' }}>
                {t('reflection')}
              </label>
              <textarea
                rows={4}
                value={form.reflection}
                onChange={e => setForm(f => ({ ...f, reflection: e.target.value }))}
                placeholder={t('writeReflection') || 'Share your reflection, testimony, or teaching…'}
                className="input-field resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={sending || !form.reflection.trim()}
                className="btn-primary"
                style={{ opacity: (sending || !form.reflection.trim()) ? 0.6 : 1 }}
              >
                {sending
                  ? <><Loader2 size={14} className="animate-spin" /> {t('posting')}</>
                  : <><Plus size={14} /> {t('postReflection') || 'Post'}</>
                }
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              background: activeCategory === cat
                ? 'var(--accent)'
                : 'var(--bg-hover)',
              color:  activeCategory === cat ? '#fff' : 'var(--text-b)',
              border: `1px solid ${activeCategory === cat ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
        </div>
      ) : posts.length === 0 ? (
        <div
          className="dash-card flex flex-col items-center justify-center py-16 text-center gap-3"
        >
          <Users size={40} style={{ color: 'var(--text-m)', opacity: 0.4 }} />
          <div>
            <p className="font-display font-semibold text-lg" style={{ color: 'var(--text-h)' }}>
              No posts yet
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-m)' }}>
              {activeCategory !== 'All'
                ? `No posts in ${activeCategory} yet. Be the first to share.`
                : 'Be the first to share a reflection with the community.'}
            </p>
          </div>
          {user && (
            <button onClick={() => setShowForm(true)} className="btn-primary mt-2">
              <Plus size={14} /> Share something
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <CommunityPostCard
              key={post.id}
              post={post}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}
