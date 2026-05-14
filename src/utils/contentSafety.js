// src/utils/contentSafety.js
// Anti-spam, content validation, and basic profanity filtering

// ── Character limits ──────────────────────────────────────────────────────────
export const LIMITS = {
  POST_MAX:       800,
  COMMENT_MAX:    400,
  PRAYER_REQUEST: 500,
  PRAYER_POINT:   1000,
  SCRIPTURE_TEXT: 600,
  BIO_MAX:        200,
}

// ── Cooldown (milliseconds) ───────────────────────────────────────────────────
export const COOLDOWNS = {
  POST:    60_000,   // 1 minute between posts
  COMMENT: 15_000,   // 15 seconds between comments
  PRAYER:  30_000,   // 30 seconds between prayer requests
}

// ── Cooldown tracker (in-memory per session) ─────────────────────────────────
const lastAction = {}

export function checkCooldown(uid, actionType) {
  const key  = `${uid}:${actionType}`
  const last = lastAction[key] || 0
  const now  = Date.now()
  const cd   = COOLDOWNS[actionType] || 0
  if (now - last < cd) {
    const wait = Math.ceil((cd - (now - last)) / 1000)
    return { allowed: false, waitSeconds: wait }
  }
  return { allowed: true }
}

export function recordAction(uid, actionType) {
  lastAction[`${uid}:${actionType}`] = Date.now()
}

// ── Basic profanity word list (extend as needed) ──────────────────────────────
// Keep this minimal — trust the community. Block only severe words.
const BLOCKED = [
  'fuck', 'shit', 'bitch', 'asshole', 'nigger', 'faggot', 'cunt', 'whore',
]
const BLOCKED_RE = new RegExp(`\\b(${BLOCKED.join('|')})\\b`, 'i')

export function containsProfanity(text) {
  return BLOCKED_RE.test(text || '')
}

// ── Validate a community post ─────────────────────────────────────────────────
export function validatePost(text, uid) {
  if (!text || !text.trim()) return { valid: false, error: 'Please write something before posting.' }
  if (text.trim().length < 10) return { valid: false, error: 'Post must be at least 10 characters.' }
  if (text.length > LIMITS.POST_MAX) return { valid: false, error: `Post must be under ${LIMITS.POST_MAX} characters.` }
  if (containsProfanity(text)) return { valid: false, error: 'Please keep language respectful and Christ-centred.' }

  const cd = checkCooldown(uid, 'POST')
  if (!cd.allowed) return { valid: false, error: `Please wait ${cd.waitSeconds}s before posting again.` }

  return { valid: true }
}

// ── Validate a comment ────────────────────────────────────────────────────────
export function validateComment(text, uid) {
  if (!text || !text.trim()) return { valid: false, error: 'Comment cannot be empty.' }
  if (text.length > LIMITS.COMMENT_MAX) return { valid: false, error: `Comment must be under ${LIMITS.COMMENT_MAX} characters.` }
  if (containsProfanity(text)) return { valid: false, error: 'Please keep language respectful.' }

  const cd = checkCooldown(uid, 'COMMENT')
  if (!cd.allowed) return { valid: false, error: `Please wait ${cd.waitSeconds}s before commenting again.` }

  return { valid: true }
}

// ── Validate a prayer request ─────────────────────────────────────────────────
export function validatePrayerRequest(text, uid) {
  if (!text || !text.trim()) return { valid: false, error: 'Please describe your prayer request.' }
  if (text.length > LIMITS.PRAYER_REQUEST) return { valid: false, error: `Prayer request must be under ${LIMITS.PRAYER_REQUEST} characters.` }

  const cd = checkCooldown(uid, 'PRAYER')
  if (!cd.allowed) return { valid: false, error: `Please wait ${cd.waitSeconds}s before submitting another request.` }

  return { valid: true }
}

// ── Character counter helper ──────────────────────────────────────────────────
export function charCount(text, max) {
  const len  = (text || '').length
  const over = len > max
  return { len, max, over, remaining: max - len }
}
