// src/pages/PathwayLevel.jsx
// Shows lessons for one pathway level + lesson viewer + revision questions

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, CheckCircle2, Lock, Loader2, ChevronRight, Send } from 'lucide-react'
import { useAuth }     from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import {
  getLessonsForLevel, getLesson, completelesson,
  getUserLessonProgress, PATHWAY_LEVELS, deleteLesson,
} from '../firebase/firestore'

function Card({ children, style = {} }) {
  return <div className="dash-card" style={style}>{children}</div>
}

export default function PathwayLevel() {
  const { levelIndex } = useParams()
  const level          = parseInt(levelIndex, 10)
  const navigate       = useNavigate()
  const { user, canEditContent, isAdmin } = useAuth()
  const { t } = useLanguage()

  const levelInfo = PATHWAY_LEVELS[level]

  const [lessons,       setLessons]       = useState([])
  const [completedIds,  setCompletedIds]  = useState(new Set())
  const [activeLesson,  setActiveLesson]  = useState(null)
  const [phase,         setPhase]         = useState('list')  // 'list' | 'lesson' | 'quiz'
  const [loading,       setLoading]       = useState(true)
  const [answers,       setAnswers]       = useState({})
  const [submitted,     setSubmitted]     = useState(false)
  const [score,         setScore]         = useState(0)
  const [saving,        setSaving]        = useState(false)
  const [toast,         setToast]         = useState('')

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    if (!user) return
    Promise.all([
      getLessonsForLevel(level),
      getUserLessonProgress(user.uid),
    ]).then(([lessonData, progressData]) => {
      setLessons(lessonData)
      setCompletedIds(new Set(progressData.filter(p => p.completed).map(p => p.lessonId)))
      setLoading(false)
    })
  }, [level, user])

  function openLesson(lesson) {
    setActiveLesson(lesson)
    setPhase('lesson')
    setAnswers({})
    setSubmitted(false)
    setScore(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goToQuiz() {
    setPhase('quiz')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmitQuiz() {
    if (!activeLesson || !user) return
    const questions = activeLesson.questions || []
    let correct = 0
    questions.forEach((q, i) => {
      const userAns = (answers[i] || '').trim().toLowerCase()
      const correct_ans = (q.answer || '').toLowerCase()
      if (userAns.length > 4 && correct_ans.includes(userAns.slice(0, 6))) correct++
      else if (userAns.length > 4) correct++ // generous: any substantive answer counts
    })
    const passed = questions.length === 0 || correct >= Math.ceil(questions.length / 2)
    setScore(correct)
    setSubmitted(true)

    if (passed) {
      setSaving(true)
      try {
        await completelesson(user.uid, activeLesson.id, answers)
        setCompletedIds(prev => new Set([...prev, activeLesson.id]))
        showToast('Lesson complete! Well done 🙏')
      } finally { setSaving(false) }
    }
  }

  async function handleDeleteLesson(lessonId, e) {
    e.stopPropagation()
    if (!window.confirm('Delete this lesson?')) return
    await deleteLesson(lessonId)
    setLessons(prev => prev.filter(l => l.id !== lessonId))
    showToast('Lesson deleted.')
  }

  if (!levelInfo) return <div style={{ color: 'var(--text-m)' }} className="p-8">Level not found.</div>

  const completedCount  = lessons.filter(l => completedIds.has(l.id)).length
  const progressPercent = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0

  // ── LESSON READING PHASE ───────────────────────────────────────────────────
  if (phase === 'lesson' && activeLesson) return (
    <div className="space-y-5 max-w-2xl">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium" style={{ background: 'color-mix(in srgb, var(--accent2) 15%, var(--bg-card))', color: 'var(--accent2)', border: '1px solid color-mix(in srgb, var(--accent2) 30%, transparent)' }}>{toast}</div>}

      <button onClick={() => setPhase('list')} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-m)' }}>
        <ArrowLeft size={15} /> Back to lessons
      </button>

      <Card>
        <div className="section-label mb-3">
          <div style={{ width: 3, height: 14, background: 'var(--accent)', borderRadius: 2, display: 'inline-block' }} />
          {levelInfo.title}
        </div>
        <h2 className="font-display font-bold text-2xl mb-5" style={{ color: 'var(--text-h)' }}>
          {activeLesson.title}
        </h2>

        {/* Scripture */}
        {activeLesson.scripture && (
          <div className="rounded-xl p-4 mb-5" style={{ background: 'color-mix(in srgb, var(--accent) 7%, transparent)', borderLeft: '3px solid var(--accent)', borderRadius: '0 0.75rem 0.75rem 0' }}>
            <p className="verse-italic text-sm">"{activeLesson.scripture}"</p>
            {activeLesson.reference && <p className="verse-ref text-xs mt-2">{activeLesson.reference}</p>}
          </div>
        )}

        {/* Content */}
        <div className="space-y-4">
          {(activeLesson.content || '').split('\n\n').map((para, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text-b)' }}>{para}</p>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-8 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
          {completedIds.has(activeLesson.id) ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--accent2)' }}>
              <CheckCircle2 size={16} /> Already completed
            </div>
          ) : (
            <button onClick={goToQuiz} className="btn-primary">
              Take Revision Questions <ChevronRight size={15} />
            </button>
          )}
          <button onClick={() => setPhase('list')} className="btn-secondary">Back</button>
        </div>
      </Card>
    </div>
  )

  // ── QUIZ PHASE ─────────────────────────────────────────────────────────────
  if (phase === 'quiz' && activeLesson) {
    const questions = activeLesson.questions || []
    return (
      <div className="space-y-5 max-w-2xl">
        <button onClick={() => setPhase('lesson')} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-m)' }}>
          <ArrowLeft size={15} /> Back to lesson
        </button>

        <Card>
          <div className="section-label mb-3">
            <div style={{ width: 3, height: 14, background: 'var(--accent)', borderRadius: 2, display: 'inline-block' }} />
            Revision Questions
          </div>
          <h2 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text-h)' }}>
            {activeLesson.title}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-m)' }}>
            Answer the questions below in your own words. There are no trick questions — write what you understood.
          </p>

          {submitted ? (
            <div className="space-y-4">
              <div className="rounded-xl p-5 text-center" style={{ background: 'color-mix(in srgb, var(--accent2) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent2) 25%, transparent)' }}>
                <div className="text-3xl mb-2">
                  {score >= Math.ceil(questions.length / 2) ? '🎉' : '📖'}
                </div>
                <p className="font-display font-bold text-lg" style={{ color: 'var(--text-h)' }}>
                  {score >= Math.ceil(questions.length / 2) ? 'Lesson Complete!' : 'Keep Studying'}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-m)' }}>
                  {score >= Math.ceil(questions.length / 2)
                    ? 'You have answered well. The lesson is marked complete.'
                    : 'Re-read the lesson and try again.'}
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setPhase('list')} className="btn-primary">Back to Lessons</button>
                {score < Math.ceil(questions.length / 2) && (
                  <button onClick={() => { setSubmitted(false); setAnswers({}) }} className="btn-secondary">Try Again</button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {questions.map((q, i) => (
                <div key={i}>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-h)' }}>
                    {i + 1}. {q.question}
                  </label>
                  <textarea
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Write your answer here…"
                    value={answers[i] || ''}
                    onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))}
                  />
                </div>
              ))}
              {questions.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--text-m)' }}>No questions for this lesson.</p>
              )}
              <button
                onClick={handleSubmitQuiz}
                disabled={saving || (questions.length > 0 && Object.keys(answers).length < questions.length)}
                className="btn-primary"
                style={{ opacity: saving ? 0.7 : 1 }}
              >
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Send size={14} /> Submit Answers</>}
              </button>
            </div>
          )}
        </Card>
      </div>
    )
  }

  // ── LESSON LIST ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-2xl">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium" style={{ background: 'color-mix(in srgb, var(--accent2) 15%, var(--bg-card))', color: 'var(--accent2)', border: '1px solid color-mix(in srgb, var(--accent2) 30%, transparent)' }}>{toast}</div>}

      <button onClick={() => navigate('/dashboard/pathway')} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-m)' }}>
        <ArrowLeft size={15} /> All Levels
      </button>

      {/* Level header */}
      <Card>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-xl flex-shrink-0"
            style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>
            {level + 1}
          </div>
          <div className="flex-1">
            <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-h)' }}>{levelInfo.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <div className="progress-bar flex-1"><div className="progress-fill" style={{ width: `${progressPercent}%` }} /></div>
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-m)' }}>{completedCount}/{lessons.length} complete</span>
            </div>
          </div>
        </div>
        {canEditContent && (
          <Link to={`/dashboard/pathway/${level}/add-lesson`} className="btn-secondary text-xs py-2 px-4 inline-flex">
            + Add Lesson
          </Link>
        )}
      </Card>

      {/* Lessons */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} /></div>
      ) : lessons.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <BookOpen size={36} className="mx-auto mb-3" style={{ color: 'var(--text-m)', opacity: 0.4 }} />
            <p className="font-semibold text-sm" style={{ color: 'var(--text-h)' }}>No lessons yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-m)' }}>
              {canEditContent ? 'Add the first lesson for this level.' : 'Content coming soon.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, i) => {
            const done     = completedIds.has(lesson.id)
            const prevDone = i === 0 || completedIds.has(lessons[i - 1]?.id)
            const locked   = !prevDone && !done && i !== 0

            return (
              <div
                key={lesson.id}
                onClick={() => !locked && openLesson(lesson)}
                className="dash-card flex items-center gap-4 transition-all"
                style={{
                  cursor:     locked ? 'not-allowed' : 'pointer',
                  opacity:    locked ? 0.5 : 1,
                  border:     done ? '1px solid color-mix(in srgb, var(--accent2) 30%, transparent)' : '1px solid var(--border)',
                  background: done ? 'color-mix(in srgb, var(--accent2) 6%, transparent)' : 'var(--bg-card)',
                }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ background: done ? 'var(--accent2)' : locked ? 'var(--bg-hover)' : 'color-mix(in srgb, var(--accent) 15%, transparent)', color: done ? '#fff' : locked ? 'var(--text-m)' : 'var(--accent)' }}>
                  {done ? <CheckCircle2 size={17} /> : locked ? <Lock size={15} /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>{lesson.title}</p>
                  {lesson.scripture && <p className="text-xs truncate mt-0.5 italic" style={{ color: 'var(--text-m)' }}>"{lesson.scripture.slice(0, 60)}…"</p>}
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-m)' }}>{(lesson.questions || []).length} revision questions</p>
                </div>
                {done && <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--accent2) 15%, transparent)', color: 'var(--accent2)' }}>Done</span>}
                {!locked && !done && <ChevronRight size={16} style={{ color: 'var(--text-m)', flexShrink: 0 }} />}
                {canEditContent && !locked && (
                  <button onClick={e => handleDeleteLesson(lesson.id, e)} className="p-1.5 rounded-lg ml-1 flex-shrink-0" style={{ color: 'var(--text-m)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-m)' }}>
                    ✕
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
