// src/pages/ReflectionHistory.jsx
// Shows all past reflection journal entries for the logged-in user

import { useEffect, useState } from 'react'
import { BookOpen, Loader2, PenLine } from 'lucide-react'
import { useAuth }     from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getUserReflections } from '../firebase/firestore'
import { Link } from 'react-router-dom'

const MOOD_LABEL = { '😔': 'Difficult', '😐': 'Neutral', '😌': 'Peaceful', '😊': 'Joyful', '🙏': 'Grateful' }

function formatDate(createdAt) {
  if (!createdAt) return ''
  try {
    const date = createdAt?.toDate ? createdAt.toDate() : new Date((createdAt.seconds || 0) * 1000)
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  } catch { return '' }
}

export default function ReflectionHistory() {
  const { user }    = useAuth()
  const { t }       = useLanguage()
  const [entries,  setEntries]  = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!user) return
    getUserReflections(user.uid, 50)
      .then(data => { setEntries(data); setLoading(false) })
      .catch(()  => setLoading(false))
  }, [user])

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-h)' }}>
          Reflection History
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-m)' }}>
          A record of your spiritual journey, one day at a time.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      ) : entries.length === 0 ? (
        <div className="dash-card flex flex-col items-center justify-center py-16 text-center gap-4">
          <PenLine size={40} style={{ color: 'var(--text-m)', opacity: 0.4 }} />
          <div>
            <p className="font-display font-semibold text-lg" style={{ color: 'var(--text-h)' }}>
              No reflections yet
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-m)' }}>
              Start your first evening reflection to build your journal.
            </p>
          </div>
          <Link to="/dashboard/reflection" className="btn-primary mt-1">
            <PenLine size={14} /> Write Today's Reflection
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map(entry => (
            <div key={entry.id} className="dash-card space-y-3">
              {/* Date + mood */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                  {formatDate(entry.createdAt)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{entry.mood}</span>
                  <span className="text-xs" style={{ color: 'var(--text-m)' }}>
                    {MOOD_LABEL[entry.mood] || entry.mood}
                  </span>
                </div>
              </div>

              {/* Prayed */}
              {entry.prayedToday && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-m)' }}>Prayed:</span>
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                    style={{
                      background: entry.prayedToday === 'Yes'
                        ? 'color-mix(in srgb, var(--accent2) 15%, transparent)'
                        : 'var(--bg-hover)',
                      color: entry.prayedToday === 'Yes' ? 'var(--accent2)' : 'var(--text-m)',
                    }}
                  >
                    {entry.prayedToday}
                  </span>
                </div>
              )}

              {/* Challenge */}
              {entry.challenge && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-m)' }}>
                    Challenge
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-b)' }}>
                    {entry.challenge}
                  </p>
                </div>
              )}

              {/* Learned */}
              {entry.learned && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-m)' }}>
                    What I Learned
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-b)' }}>
                    {entry.learned}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
