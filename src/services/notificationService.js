// src/services/notificationService.js
// Firebase Cloud Messaging + local notification scheduling

import { getFirebaseMessaging, VAPID_KEY } from '../firebase/config'

// ── FCM Token Registration ────────────────────────────────────────────────────

/**
 * requestAndSaveFcmToken
 * Requests notification permission, gets FCM token, saves to Firestore.
 * Returns the token string, or null if not supported/denied.
 */
export async function requestAndSaveFcmToken(uid, saveFn) {
  try {
    if (!('Notification' in window)) return null

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const messaging = await getFirebaseMessaging()
    if (!messaging) return null

    const { getToken } = await import('firebase/messaging')
    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    if (!token) return null

    if (saveFn) await saveFn(uid, token)
    return token
  } catch (err) {
    console.error('[FCM] Token error:', err)
    return null
  }
}

/**
 * setupForegroundMessageHandler
 * Shows a browser notification when a FCM message arrives while app is in the foreground.
 */
export async function setupForegroundMessageHandler() {
  try {
    const messaging = await getFirebaseMessaging()
    if (!messaging) return

    const { onMessage } = await import('firebase/messaging')
    onMessage(messaging, (payload) => {
      const { title = 'Today with Christ', body = '' } = payload.notification || {}
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/cross.svg', badge: '/cross.svg' })
      }
    })
  } catch (err) {
    console.error('[FCM] Foreground handler error:', err)
  }
}

// ── Local Reminder Scheduling ─────────────────────────────────────────────────
// Schedules browser Notification API reminders (works without server).
// Times: 00:00, 06:00, 12:00, 18:00

const REMINDER_MESSAGES = {
  midnight: { title: '🌙 Midnight with Christ',    body: 'A quiet moment before rest. Open your heart to God.' },
  morning:  { title: '🌅 Good Morning with Christ', body: 'Start this day with prayer. He goes before you.' },
  midday:   { title: '☀️ Midday Check-In',          body: 'Pause. Breathe. Return to God in the middle of your day.' },
  evening:  { title: '🌆 Evening with Christ',      body: 'Reflect on today. Give thanks. Come back tomorrow.' },
}

const REMINDER_HOURS = { midnight: 0, morning: 6, midday: 12, evening: 18 }

let _reminderTimers = []

export function scheduleLocalReminders(enabledSlots = {}) {
  // Clear existing timers
  _reminderTimers.forEach(clearTimeout)
  _reminderTimers = []

  if (Notification.permission !== 'granted') return

  const now = new Date()

  Object.entries(enabledSlots).forEach(([slotId, enabled]) => {
    if (!enabled) return
    const hour = REMINDER_HOURS[slotId]
    if (hour === undefined) return

    const { title, body } = REMINDER_MESSAGES[slotId] || {}
    if (!title) return

    const target = new Date()
    target.setHours(hour, 0, 0, 0)
    if (target <= now) target.setDate(target.getDate() + 1)

    const delay = target - now
    const timer = setTimeout(() => {
      try { new Notification(title, { body, icon: '/cross.svg', badge: '/cross.svg' }) }
      catch {}
    }, delay)

    _reminderTimers.push(timer)
  })
}

export function clearLocalReminders() {
  _reminderTimers.forEach(clearTimeout)
  _reminderTimers = []
}
