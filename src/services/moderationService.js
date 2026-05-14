// src/services/moderationService.js
// Report system, moderation queue, and admin actions

import {
  collection, addDoc, getDocs, updateDoc, deleteDoc,
  doc, query, where, orderBy, limit, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'

// ── REPORT SYSTEM ─────────────────────────────────────────────────────────────

/**
 * Report schema (stored in /reports):
 * {
 *   contentType: 'post' | 'comment' | 'prayerRequest',
 *   contentId:   string,
 *   reporterId:  string,
 *   reason:      string,
 *   status:      'pending' | 'reviewed' | 'dismissed',
 *   createdAt:   Timestamp,
 *   reviewedAt:  Timestamp | null,
 *   reviewedBy:  string | null,
 * }
 */

export const REPORT_REASONS = [
  'Inappropriate language',
  'Spam or repetitive content',
  'Harmful or misleading content',
  'Off-topic / not relevant to faith',
  'Other',
]

export async function reportContent({ contentType, contentId, reporterId, reason }) {
  // Prevent duplicate reports from same user
  const existing = await getDocs(query(
    collection(db, 'reports'),
    where('contentId',  '==', contentId),
    where('reporterId', '==', reporterId),
    where('status',     '==', 'pending'),
    limit(1),
  ))
  if (!existing.empty) throw new Error('already_reported')

  await addDoc(collection(db, 'reports'), {
    contentType, contentId, reporterId, reason,
    status: 'pending', createdAt: serverTimestamp(),
    reviewedAt: null, reviewedBy: null,
  })
}

export async function getPendingReports(limitCount = 50) {
  const q = query(
    collection(db, 'reports'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc'),
    limit(limitCount),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function reviewReport(reportId, adminUid, action) {
  // action: 'dismissed' | 'reviewed'
  await updateDoc(doc(db, 'reports', reportId), {
    status:     action,
    reviewedAt: serverTimestamp(),
    reviewedBy: adminUid,
  })
}

// ── ADMIN MODERATION ACTIONS ──────────────────────────────────────────────────

// Delete any post (admin only — enforced by Firestore rules too)
export async function adminDeletePost(postId) {
  await deleteDoc(doc(db, 'communityPosts', postId))
}

// Delete any comment
export async function adminDeleteComment(postId, commentId) {
  await deleteDoc(doc(db, 'communityPosts', postId, 'comments', commentId))
}

// Disable / re-enable a user account (soft ban — prevents new writes via rules)
export async function setUserDisabled(uid, disabled = true) {
  await updateDoc(doc(db, 'users', uid), { disabled })
}

// Verify a mentor
export async function verifyMentor(uid, verified = true) {
  await updateDoc(doc(db, 'users', uid), {
    isVerifiedMentor: verified,
    role: verified ? 'mentor' : 'user',
  })
}
