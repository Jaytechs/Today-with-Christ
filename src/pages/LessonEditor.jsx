// src/pages/LessonEditor.jsx
// Admin/mentor can create or edit a pathway lesson

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react'
import { useAuth }     from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { createLesson, updateLesson, getLesson, getLessonsForLevel } from '../firebase/firestore'
import { Navigate } from 'react-router-dom'

export default function LessonEditor() {
  const { levelIndex, lessonId } = useParams()
  const level    = parseInt(levelIndex, 10)
  const isEdit   = !!lessonId
  const navigate = useNavigate()
  const { user, canEditContent } = useAuth()

  if (!canEditContent) return <Navigate to="/dashboard/pathway" replace />

  const [form, setForm] = useState({
    title: '', scripture: '', reference: '', content: '',
    questions: [{ question: '', answer: '' }],
  })
  const [loading, setSaving] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return
    getLesson(lessonId).then(data => {
      if (data) setForm({ title: data.title, scripture: data.scripture || '', reference: data.reference || '', content: data.content || '', questions: data.questions?.length ? data.questions : [{ question: '', answer: '' }] })
      setFetchLoading(false)
    })
  }, [lessonId])

  function updateQ(i, field, val) {
    setForm(f => { const qs = [...f.questions]; qs[i] = { ...qs[i], [field]: val }; return { ...f, questions: qs } })
  }
  function addQ()    { setForm(f => ({ ...f, questions: [...f.questions, { question: '', answer: '' }] })) }
  function removeQ(i){ setForm(f => ({ ...f, questions: f.questions.filter((_, j) => j !== i) })) }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    try {
      // Calculate order
      const existing = await getLessonsForLevel(level)
      const order    = isEdit ? undefined : existing.length + 1
      const payload  = { ...form, level, createdBy: user.uid, ...(order !== undefined ? { order } : {}) }
      if (isEdit) { await updateLesson(lessonId, payload) }
      else        { await createLesson(payload) }
      navigate(`/dashboard/pathway/${level}`)
    } finally { setSaving(false) }
  }

  if (fetchLoading) return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} /></div>

  return (
    <div className="space-y-5 max-w-2xl">
      <button onClick={() => navigate(`/dashboard/pathway/${level}`)} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-m)' }}>
        <ArrowLeft size={15} /> Back to level
      </button>

      <div>
        <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-h)' }}>
          {isEdit ? 'Edit Lesson' : 'New Lesson'}
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-m)' }}>Level {level + 1} content</p>
      </div>

      <div className="dash-card space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-m)' }}>Lesson Title *</label>
          <input className="input-field" placeholder="e.g. Who Is God?" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-m)' }}>Scripture Verse</label>
            <input className="input-field" placeholder="Type the verse text…" value={form.scripture} onChange={e => setForm(f => ({ ...f, scripture: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-m)' }}>Reference</label>
            <input className="input-field" placeholder="e.g. John 3:16" value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-m)' }}>Lesson Content *</label>
          <p className="text-xs mb-2" style={{ color: 'var(--text-m)' }}>Separate paragraphs with a blank line. Write clearly — users of all levels will read this.</p>
          <textarea rows={10} className="input-field resize-none" placeholder="Write the lesson content here…" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
        </div>

        {/* Questions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-m)' }}>Revision Questions</label>
            <button onClick={addQ} className="text-xs flex items-center gap-1 btn-secondary py-1 px-3">
              <Plus size={12} /> Add Question
            </button>
          </div>
          <div className="space-y-4">
            {form.questions.map((q, i) => (
              <div key={i} className="rounded-xl p-4 space-y-2" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: 'var(--text-m)' }}>Question {i + 1}</span>
                  {form.questions.length > 1 && (
                    <button onClick={() => removeQ(i)} className="p-1 rounded" style={{ color: 'var(--text-m)' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-m)'}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <input className="input-field text-sm" placeholder="Question text…" value={q.question} onChange={e => updateQ(i, 'question', e.target.value)} />
                <input className="input-field text-sm" placeholder="Model answer (short phrase)…" value={q.answer} onChange={e => updateQ(i, 'answer', e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={handleSave} disabled={loading || !form.title.trim() || !form.content.trim()} className="btn-primary" style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : isEdit ? 'Save Changes' : 'Create Lesson'}
          </button>
          <button onClick={() => navigate(`/dashboard/pathway/${level}`)} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  )
}
