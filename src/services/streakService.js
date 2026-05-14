// src/services/streakService.js
// Handles all streak logic: update, recovery, missed-day detection

import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

// ── Date helpers ──────────────────────────────────────────────────────────────
export function todayStr()     { return new Date().toISOString().split('T')[0] }
export function yesterdayStr() { return new Date(Date.now() - 86_400_000).toISOString().split('T')[0] }

/**
 * Compute what the streak should be given the last active date and current streak.
 * - Same day     → no change (already counted)
 * - Yesterday    → +1
 * - Any gap      → reset to 1
 */
export function computeStreak(lastActiveDate, currentStreak) {
  const today     = todayStr()
  const yesterday = yesterdayStr()

  if (lastActiveDate === today)     return currentStreak          // already counted today
  if (lastActiveDate === yesterday) return (currentStreak || 0) + 1
  return 1                                                        // missed a day → reset
}

/**
 * updateUserStreak — call this whenever the user completes a daily activity.
 * Safe to call multiple times per day (idempotent).
 */
export async function updateUserStreak(uid) {
  const ref  = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return

  const profile = snap.data()
  const today   = todayStr()

  // Already counted for today — skip the write
  if (profile.lastActiveDate === today) return

  const newStreak = computeStreak(profile.lastActiveDate, profile.currentStreak || 0)
  const longest   = Math.max(newStreak, profile.longestStreak || 0)

  await updateDoc(ref, {
    currentStreak:  newStreak,
    longestStreak:  longest,
    lastActiveDate: today,
    lastActive:     serverTimestamp(),
  })

  return { newStreak, longest }
}

/**
 * getStreakStatus — returns a human-readable status string for the streak card.
 */
export function getStreakStatus(currentStreak) {
  if (!currentStreak || currentStreak === 0) return { label: 'Start today', emoji: '🌱', milestone: false }
  if (currentStreak >= 100) return { label: `${currentStreak} days — Extraordinary!`, emoji: '🏆', milestone: true }
  if (currentStreak >= 30)  return { label: `${currentStreak} days — Faithful!`, emoji: '⭐', milestone: true }
  if (currentStreak >= 21)  return { label: `${currentStreak} days — Committed!`, emoji: '🔥', milestone: true }
  if (currentStreak >= 14)  return { label: `${currentStreak} days — Consistent!`, emoji: '💪', milestone: false }
  if (currentStreak >= 7)   return { label: `${currentStreak} days — Well done!`,  emoji: '🌟', milestone: false }
  return { label: `${currentStreak} day${currentStreak > 1 ? 's' : ''}`, emoji: '🔥', milestone: false }
}

/**
 * MILESTONES — used in progress page.
 */
export const MILESTONES = [
  { days: 7,   label: '7-Day Streak',    emoji: '🔥' },
  { days: 14,  label: '14-Day Streak',   emoji: '💪' },
  { days: 21,  label: '21-Day Streak',   emoji: '⭐' },
  { days: 30,  label: '30-Day Streak',   emoji: '🌟' },
  { days: 60,  label: '60-Day Streak',   emoji: '🏅' },
  { days: 100, label: '100-Day Streak',  emoji: '🏆' },
]
