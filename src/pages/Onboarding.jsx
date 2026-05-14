// src/pages/Onboarding.jsx
// 3-step onboarding for new users — shown once after registration

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { useAuth }     from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { updateUserProfile } from '../firebase/firestore'

const GOALS = [
  { id: 'prayer',     label: 'Build a daily prayer habit',   emoji: '🙏' },
  { id: 'scripture',  label: 'Read scripture consistently',  emoji: '📖' },
  { id: 'discipline', label: 'Grow in spiritual discipline', emoji: '⚡' },
  { id: 'community',  label: 'Connect with other believers', emoji: '🤝' },
  { id: 'purpose',    label: 'Discover my calling',          emoji: '🌱' },
]

const REMINDER_TIMES = [
  { id: 'morning',   label: 'Morning (6–9 AM)',   emoji: '🌅' },
  { id: 'afternoon', label: 'Afternoon (12–2 PM)',emoji: '☀️' },
  { id: 'evening',   label: 'Evening (7–9 PM)',   emoji: '🌙' },
]

export default function Onboarding() {
  const { user, profile } = useAuth()
  const { lang, setLang } = useLanguage()
  const navigate = useNavigate()

  const [step,     setStep]     = useState(1)
  const [goals,    setGoals]    = useState([])
  const [reminder, setReminder] = useState('morning')
  const [saving,   setSaving]   = useState(false)

  const name = profile?.fullName?.split(' ')[0] || 'Friend'

  function toggleGoal(id) {
    setGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id])
  }

  async function handleFinish() {
    setSaving(true)
    try {
      await updateUserProfile(user.uid, {
        onboardingComplete: true,
        goals,
        reminderTime: reminder,
        language: lang,
      })
      navigate('/dashboard')
    } catch {
      navigate('/dashboard')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg)' }}
    >
      <div className="w-full max-w-lg">

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-10">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className="rounded-full transition-all duration-300"
              style={{
                width:      s === step ? 28 : 8,
                height:     8,
                background: s <= step ? 'var(--accent)' : 'var(--border)',
              }}
            />
          ))}
        </div>

        {/* ── Step 1 — Language ── */}
        {step === 1 && (
          <div className="dash-card space-y-6 text-center">
            <div>
              <div className="text-4xl mb-3">🌍</div>
              <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-h)' }}>
                Welcome, {name}!
              </h1>
              <p className="text-sm mt-2" style={{ color: 'var(--text-m)' }}>
                Let's get you set up. First, choose your preferred language.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { code: 'en',  label: 'English',          sub: 'English'    },
                { code: 'bem', label: 'Bemba',            sub: 'Icibemba'   },
              ].map(({ code, label, sub }) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  className="p-5 rounded-xl transition-all"
                  style={{
                    border:     `2px solid ${lang === code ? 'var(--accent)' : 'var(--border)'}`,
                    background: lang === code ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--bg-hover)',
                  }}
                >
                  <div className="font-display font-bold text-lg" style={{ color: lang === code ? 'var(--accent)' : 'var(--text-h)' }}>
                    {label}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-m)' }}>{sub}</div>
                  {lang === code && (
                    <div className="mt-2 flex justify-center">
                      <Check size={16} style={{ color: 'var(--accent)' }} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button onClick={() => setStep(2)} className="btn-primary w-full justify-center py-3">
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── Step 2 — Goals ── */}
        {step === 2 && (
          <div className="dash-card space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-h)' }}>
                What are you here for?
              </h1>
              <p className="text-sm mt-2" style={{ color: 'var(--text-m)' }}>
                Select all that apply. This helps us personalise your experience.
              </p>
            </div>

            <div className="space-y-2">
              {GOALS.map(({ id, label, emoji }) => {
                const selected = goals.includes(id)
                return (
                  <button
                    key={id}
                    onClick={() => toggleGoal(id)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all"
                    style={{
                      border:     `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                      background: selected ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--bg-hover)',
                    }}
                  >
                    <span className="text-xl">{emoji}</span>
                    <span className="flex-1 text-sm font-medium" style={{ color: selected ? 'var(--accent)' : 'var(--text-b)' }}>
                      {label}
                    </span>
                    {selected && <Check size={16} style={{ color: 'var(--accent)' }} />}
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1 justify-center py-3">
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={goals.length === 0}
                className="btn-primary flex-1 justify-center py-3"
                style={{ opacity: goals.length === 0 ? 0.5 : 1 }}
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3 — Reminder time ── */}
        {step === 3 && (
          <div className="dash-card space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-3">⏰</div>
              <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-h)' }}>
                When do you want to be reminded?
              </h1>
              <p className="text-sm mt-2" style={{ color: 'var(--text-m)' }}>
                We'll send a gentle nudge to help you stay consistent.
              </p>
            </div>

            <div className="space-y-3">
              {REMINDER_TIMES.map(({ id, label, emoji }) => (
                <button
                  key={id}
                  onClick={() => setReminder(id)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all"
                  style={{
                    border:     `1px solid ${reminder === id ? 'var(--accent)' : 'var(--border)'}`,
                    background: reminder === id ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--bg-hover)',
                  }}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="flex-1 font-medium text-sm" style={{ color: reminder === id ? 'var(--accent)' : 'var(--text-b)' }}>
                    {label}
                  </span>
                  {reminder === id && <Check size={16} style={{ color: 'var(--accent)' }} />}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1 justify-center py-3">
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="btn-primary flex-1 justify-center py-3"
              >
                {saving ? 'Saving…' : <>Let's Begin 🙏</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
