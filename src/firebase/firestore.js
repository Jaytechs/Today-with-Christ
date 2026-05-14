// src/firebase/firestore.js — Complete enhanced database layer

import {
  doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
  collection, query, where, orderBy, limit,
  getDocs, onSnapshot, serverTimestamp, increment,
  arrayUnion, arrayRemove,
} from 'firebase/firestore'
import { db } from './config'

// ═══════════════════════════════════════════
// USER PROFILES
// ═══════════════════════════════════════════

export async function createUserProfile(uid, data) {
  await setDoc(doc(db, 'users', uid), {
    uid, fullName: data.fullName || '', email: data.email || '',
    language: data.language || 'en', role: 'user',
    isVerifiedMentor: false, spiritualLevel: 1,
    createdAt: serverTimestamp(), lastActive: serverTimestamp(),
    lastActiveDate: '', currentStreak: 0, longestStreak: 0,
    totalPrayersDone: 0, totalDevotionsDone: 0, totalReflections: 0,
    growthLevel: 0, notificationsEnabled: true, onboardingComplete: false,
    goals: [], reminderTime: 'morning', fcmToken: '',
  })
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

export async function updateUserProfile(uid, updates) {
  await updateDoc(doc(db, 'users', uid), { ...updates, lastActive: serverTimestamp() })
}

export async function setUserRole(uid, role) {
  await updateDoc(doc(db, 'users', uid), { role, isVerifiedMentor: role === 'mentor' })
}

export async function getAllUsers(limitCount = 100) {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function saveFcmToken(uid, token) {
  await updateDoc(doc(db, 'users', uid), { fcmToken: token })
}

// ═══════════════════════════════════════════
// SCRIPTURE LIBRARY — shuffle every 30 min
// ═══════════════════════════════════════════

export function getScriptureShuffleIndex(total) {
  if (!total) return 0
  const now = new Date()
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes()
  const window30 = Math.floor(minutesSinceMidnight / 30)
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000)
  return (dayOfYear * 48 + window30) % total
}

// Minutes until next 30-min window tick
export function msUntilNextScriptureRotation() {
  const now = new Date()
  const minInWindow = now.getMinutes() % 30
  const secInMin = now.getSeconds()
  return ((30 - minInWindow) * 60 - secInMin) * 1000
}

export function subscribeToScriptures(onUpdate) {
  const q = query(collection(db, 'scriptures'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}

export async function addScripture(uid, data) {
  const ref = await addDoc(collection(db, 'scriptures'), {
    scripture: data.scripture, reference: data.reference,
    focus: data.focus || 'Faith', devotion: data.devotion || '',
    application: data.application || '', language: data.language || 'en',
    addedBy: uid, createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function deleteScripture(id) {
  await deleteDoc(doc(db, 'scriptures', id))
}

// ═══════════════════════════════════════════
// DAILY CONTENT
// ═══════════════════════════════════════════

function getDailyIndex(arr) {
  const start = new Date(new Date().getFullYear(), 0, 0)
  const day = Math.floor((Date.now() - start) / 86400000)
  return day % arr.length
}

export async function getTodaysDevotion(language = 'en') {
  const today = new Date().toISOString().split('T')[0]
  try {
    const snap = await getDoc(doc(db, 'dailyDevotions', today))
    if (snap.exists()) return snap.data()
  } catch {}
  const arr = SAMPLE_DEVOTIONS[language] || SAMPLE_DEVOTIONS.en
  return arr[getDailyIndex(arr)]
}

export async function getTodaysPrayer(language = 'en') {
  const hour = new Date().getHours()
  const slot = hour < 12 ? 'morning' : hour < 17 ? 'midday' : 'evening'
  const today = new Date().toISOString().split('T')[0]
  try {
    const snap = await getDoc(doc(db, 'dailyPrayers', `${today}_${slot}`))
    if (snap.exists()) return snap.data()
    const snap2 = await getDoc(doc(db, 'dailyPrayers', today))
    if (snap2.exists()) return snap2.data()
  } catch {}
  const prayers = SAMPLE_PRAYERS[language] || SAMPLE_PRAYERS.en
  return prayers[slot] || prayers.morning
}

export function getTodaysFocus() {
  const focuses = ['Faith', 'Prayer', 'Discipline', 'Purpose', 'Humility', 'Gratitude', 'Leadership']
  return focuses[new Date().getDay()]
}

export async function setDailyDevotion(date, data) {
  await setDoc(doc(db, 'dailyDevotions', date), { ...data, date, updatedAt: serverTimestamp() })
}

export async function setDailyPrayer(date, slot, data) {
  await setDoc(doc(db, 'dailyPrayers', `${date}_${slot}`), { ...data, date, slot, updatedAt: serverTimestamp() })
}

// ═══════════════════════════════════════════
// PRAYER REQUESTS (users) + PRAYER POINTS (mentors)
// ═══════════════════════════════════════════

export async function addPrayerRequest(uid, data) {
  const ref = await addDoc(collection(db, 'prayerRequests'), {
    uid, authorName: data.authorName, text: data.text,
    isAnonymous: data.isAnonymous || false,
    answered: false, prayedFor: [], prayedCount: 0,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function markPrayerAnswered(requestId, answered = true) {
  await updateDoc(doc(db, 'prayerRequests', requestId), { answered })
}

export async function togglePrayedFor(requestId, uid) {
  const ref = doc(db, 'prayerRequests', requestId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const hasPrayed = (snap.data().prayedFor || []).includes(uid)
  await updateDoc(ref, {
    prayedFor: hasPrayed ? arrayRemove(uid) : arrayUnion(uid),
    prayedCount: increment(hasPrayed ? -1 : 1),
  })
  return !hasPrayed
}

export function subscribeToPrayerRequests(onUpdate, limitCount = 30) {
  const q = query(collection(db, 'prayerRequests'), orderBy('createdAt', 'desc'), limit(limitCount))
  return onSnapshot(q, snap => onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}

export async function deletePrayerRequest(id) {
  await deleteDoc(doc(db, 'prayerRequests', id))
}

export async function addPrayerPoint(uid, data) {
  const ref = await addDoc(collection(db, 'prayerPoints'), {
    uid, authorName: data.authorName, title: data.title,
    content: data.content, slot: data.slot || 'general',
    scripture: data.scripture || '', reference: data.reference || '',
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export function subscribeToPrayerPoints(onUpdate) {
  const q = query(collection(db, 'prayerPoints'), orderBy('createdAt', 'desc'), limit(20))
  return onSnapshot(q, snap => onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}

export async function deletePrayerPoint(id) {
  await deleteDoc(doc(db, 'prayerPoints', id))
}

// ═══════════════════════════════════════════
// REMINDERS — 00:00, 06:00, 12:00, 18:00
// ═══════════════════════════════════════════

export const REMINDER_SLOTS = [
  { id: 'midnight', label: '00:00 — Midnight', time: '00:00', description: 'A quiet word before you sleep' },
  { id: 'morning',  label: '06:00 — Morning',  time: '06:00', description: 'Start your day with Christ' },
  { id: 'midday',   label: '12:00 — Midday',   time: '12:00', description: 'Pause and realign at noon' },
  { id: 'evening',  label: '18:00 — Evening',  time: '18:00', description: 'End your day in reflection' },
]

export async function getUserReminders(uid) {
  const snap = await getDoc(doc(db, 'userReminders', uid))
  if (snap.exists()) return snap.data()
  return { enabled: false, slots: { midnight: false, morning: true, midday: false, evening: true } }
}

export async function saveUserReminders(uid, data) {
  await setDoc(doc(db, 'userReminders', uid), { ...data, updatedAt: serverTimestamp() }, { merge: true })
}

export function scheduleLocalReminders(slots) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  if (window._reminderTimers) window._reminderTimers.forEach(clearTimeout)
  window._reminderTimers = []
  const messages = [
    { id: 'midnight', hour: 0,  title: '🌙 Midnight with Christ',   body: 'A quiet moment before rest. Open your heart to God.' },
    { id: 'morning',  hour: 6,  title: '🌅 Good Morning with Christ', body: 'Start this day with prayer. He goes before you.' },
    { id: 'midday',   hour: 12, title: '☀️ Midday Check-In',         body: 'Pause. Breathe. Return to God in the middle of your day.' },
    { id: 'evening',  hour: 18, title: '🌆 Evening with Christ',      body: 'Reflect on today. Give thanks. Come back tomorrow.' },
  ]
  messages.forEach(({ id, hour, title, body }) => {
    if (!slots[id]) return
    const now = new Date()
    const target = new Date(); target.setHours(hour, 0, 0, 0)
    if (target <= now) target.setDate(target.getDate() + 1)
    const timer = setTimeout(() => {
      new Notification(title, { body, icon: '/cross.svg', badge: '/cross.svg' })
    }, target - now)
    window._reminderTimers.push(timer)
  })
}

// ═══════════════════════════════════════════
// PROGRESS & STREAK
// ═══════════════════════════════════════════

export async function getTodayProgress(uid) {
  const today = new Date().toISOString().split('T')[0]
  const types = ['devotion', 'prayer', 'reflection']
  const results = await Promise.all(types.map(t => getDoc(doc(db, 'userProgress', `${uid}_${today}_${t}`))))
  return { devotion: results[0].exists(), prayer: results[1].exists(), reflection: results[2].exists() }
}

export async function recordActivity(uid, type) {
  const today = new Date().toISOString().split('T')[0]
  const countField = { devotion: 'totalDevotionsDone', prayer: 'totalPrayersDone', reflection: 'totalReflections' }[type]
  await setDoc(doc(db, 'userProgress', `${uid}_${today}_${type}`), { uid, type, date: today, completedAt: serverTimestamp() })
  if (countField) await updateDoc(doc(db, 'users', uid), { [countField]: increment(1), lastActive: serverTimestamp() })
}

export async function updateStreak(uid) {
  const profile = await getUserProfile(uid)
  if (!profile) return
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (profile.lastActiveDate === today) return
  const newStreak = profile.lastActiveDate === yesterday ? (profile.currentStreak || 0) + 1 : 1
  const longest = Math.max(newStreak, profile.longestStreak || 0)
  await updateDoc(doc(db, 'users', uid), { currentStreak: newStreak, longestStreak: longest, lastActiveDate: today })
}

// ═══════════════════════════════════════════
// REFLECTION JOURNAL
// ═══════════════════════════════════════════

export async function saveReflection(uid, reflection) {
  await addDoc(collection(db, 'reflectionEntries'), {
    uid, date: new Date().toISOString().split('T')[0],
    prayedToday: reflection.prayedToday, challenge: reflection.challenge,
    learned: reflection.learned, mood: reflection.mood, createdAt: serverTimestamp(),
  })
}

export async function getUserReflections(uid, limitCount = 30) {
  const q = query(collection(db, 'reflectionEntries'), where('uid', '==', uid), orderBy('createdAt', 'desc'), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ═══════════════════════════════════════════
// GROWTH PATHWAY LEVELS — editable by admin/mentor
// ═══════════════════════════════════════════

export const DEFAULT_PATHWAY_LEVELS = [
  { level: 0, key: 'level0', title: 'Knowing God',       color: '#E9C46A', description: 'Discover who God is and begin your relationship with Him.' },
  { level: 1, key: 'level1', title: 'Faith & Salvation', color: '#84A98C', description: 'Understand sin, grace, and what it means to be saved.' },
  { level: 2, key: 'level2', title: 'Daily Discipline',  color: '#5DADE2', description: 'Build habits of prayer, scripture, and reflection.' },
  { level: 3, key: 'level3', title: 'Purpose & Calling', color: '#D4A373', description: 'Discover your God-given purpose and calling.' },
  { level: 4, key: 'level4', title: 'Kingdom Impact',    color: '#A8DADC', description: 'Live for something bigger than yourself.' },
]

// Keep PATHWAY_LEVELS as the static export for backward compat
export const PATHWAY_LEVELS = DEFAULT_PATHWAY_LEVELS

// Subscribe to custom pathway levels from Firestore (falls back to defaults)
export function subscribeToPathwayLevels(onUpdate) {
  const q = query(collection(db, 'pathwayLevels'), orderBy('order', 'asc'))
  return onSnapshot(q, snap => {
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    onUpdate(docs.length > 0 ? docs : DEFAULT_PATHWAY_LEVELS)
  })
}

export async function getPathwayLevels() {
  const q = query(collection(db, 'pathwayLevels'), orderBy('order', 'asc'))
  const snap = await getDocs(q)
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return docs.length > 0 ? docs : DEFAULT_PATHWAY_LEVELS
}

// Admin/Mentor: create a new pathway level
export async function createPathwayLevel(data) {
  const existing = await getPathwayLevels()
  const ref = await addDoc(collection(db, 'pathwayLevels'), {
    title: data.title, description: data.description || '',
    color: data.color || '#D4A373',
    order: existing.length,
    level: existing.length,
    key: `level${existing.length}`,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  })
  return ref.id
}

// Admin/Mentor: update a pathway level
export async function updatePathwayLevel(levelId, data) {
  await updateDoc(doc(db, 'pathwayLevels', levelId), { ...data, updatedAt: serverTimestamp() })
}

// Admin/Mentor: delete a pathway level (and warn about lessons)
export async function deletePathwayLevel(levelId, levelIndex) {
  await deleteDoc(doc(db, 'pathwayLevels', levelId))
  // Also delete associated lessons
  const q = query(collection(db, 'pathwayLessons'), where('level', '==', levelIndex))
  const snap = await getDocs(q)
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
}

// ── LESSONS ──────────────────────────────────────────────────────────────────

export async function getLessonsForLevel(level) {
  const q = query(collection(db, 'pathwayLessons'), where('level', '==', level), orderBy('order', 'asc'))
  const snap = await getDocs(q)
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  if (docs.length === 0) return SAMPLE_LESSONS.filter(l => l.level === level)
  return docs
}

export async function getLesson(lessonId) {
  const snap = await getDoc(doc(db, 'pathwayLessons', lessonId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function createLesson(data) {
  const ref = await addDoc(collection(db, 'pathwayLessons'), {
    level: data.level, order: data.order || 0,
    title: data.title, scripture: data.scripture || '',
    reference: data.reference || '', content: data.content,
    questions: data.questions || [], createdBy: data.createdBy,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateLesson(lessonId, data) {
  await updateDoc(doc(db, 'pathwayLessons', lessonId), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteLesson(lessonId) {
  await deleteDoc(doc(db, 'pathwayLessons', lessonId))
}

export async function getUserLessonProgress(uid) {
  const q = query(collection(db, 'lessonProgress'), where('uid', '==', uid))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function completelesson(uid, lessonId, answers) {
  await setDoc(doc(db, 'lessonProgress', `${uid}_${lessonId}`), {
    uid, lessonId, answers, completed: true, completedAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'users', uid), { lastActive: serverTimestamp() })
}

// ═══════════════════════════════════════════
// COMMUNITY FEED
// ═══════════════════════════════════════════

export const COMMUNITY_CATEGORIES = ['Faith', 'Prayer', 'Discipline', 'Purpose', 'Leadership', 'Community']

export async function createCommunityPost(uid, data) {
  const ref = await addDoc(collection(db, 'communityPosts'), {
    userId: uid, authorName: data.authorName, role: data.role || 'user',
    type: data.type || 'reflection', scripture: data.scripture || '',
    reference: data.reference || '', reflection: data.reflection || '',
    category: data.category || 'Faith', amenCount: 0, amenedBy: [],
    commentCount: 0, createdAt: serverTimestamp(),
  })
  return { id: ref.id, ...data }
}

export function subscribeToCommunityPosts(onUpdate, limitCount = 20) {
  const q = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'), limit(limitCount))
  return onSnapshot(q, snap => onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}

export function subscribeToCommunityPostsByCategory(category, onUpdate, limitCount = 20) {
  const q = query(collection(db, 'communityPosts'), where('category', '==', category), orderBy('createdAt', 'desc'), limit(limitCount))
  return onSnapshot(q, snap => onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}

export async function toggleAmen(postId, uid) {
  const postRef = doc(db, 'communityPosts', postId)
  const snap = await getDoc(postRef)
  if (!snap.exists()) return false
  const hasAmened = (snap.data().amenedBy || []).includes(uid)
  await updateDoc(postRef, {
    amenedBy: hasAmened ? arrayRemove(uid) : arrayUnion(uid),
    amenCount: increment(hasAmened ? -1 : 1),
  })
  return !hasAmened
}

export async function deleteCommunityPost(postId) { await deleteDoc(doc(db, 'communityPosts', postId)) }

export function subscribeToComments(postId, onUpdate) {
  const q = query(collection(db, 'communityPosts', postId, 'comments'), orderBy('createdAt', 'asc'))
  return onSnapshot(q, snap => onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}

export async function addComment(postId, data) {
  await addDoc(collection(db, 'communityPosts', postId, 'comments'), {
    uid: data.uid, authorName: data.authorName, text: data.text, createdAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'communityPosts', postId), { commentCount: increment(1) })
}

// ═══════════════════════════════════════════
// VIDEO LIBRARY
// ═══════════════════════════════════════════

export const VIDEO_CATEGORIES = ['Prayer', 'Faith', 'Discipline', 'Bible Study', 'Evangelism', 'Leadership']

export function subscribeToVideos(onUpdate) {
  const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}

export function subscribeToVideosByCategory(category, onUpdate) {
  const q = query(collection(db, 'videos'), where('category', '==', category), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}

export async function createVideo(uid, data) {
  const ref = await addDoc(collection(db, 'videos'), {
    title: data.title, description: data.description, category: data.category,
    videoUrl: data.videoUrl, thumbnailUrl: data.thumbnailUrl || '',
    uploadedBy: data.uploadedBy || uid, createdAt: serverTimestamp(),
  })
  return { id: ref.id, ...data }
}

export async function deleteVideo(videoId) { await deleteDoc(doc(db, 'videos', videoId)) }

export async function recordVideoProgress(uid, videoId, progress, completed) {
  await setDoc(doc(db, 'videoProgress', `${uid}_${videoId}`), {
    uid, videoId, progress, completed, updatedAt: serverTimestamp(),
  }, { merge: true })
}

export async function getUserVideoProgress(uid) {
  const q = query(collection(db, 'videoProgress'), where('uid', '==', uid))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ═══════════════════════════════════════════
// SAMPLE DATA
// ═══════════════════════════════════════════

export const SAMPLE_DEVOTIONS = {
  en: [
    { date: 's1', title: 'Walking in His Strength', scripture: 'I can do all things through Christ who strengthens me.', reference: 'Philippians 4:13', focus: 'Discipline', devotion: 'Today, let this truth anchor your heart. You are not walking alone. Every challenge you face is an invitation to lean deeper into Christ. His strength is renewed every morning, available in every moment of weakness.', application: 'Identify one area where you feel weak today. Surrender it to God in prayer and trust His strength to carry you through.' },
    { date: 's2', title: 'The Peace That Surpasses', scripture: 'And the peace of God, which surpasses all understanding, will guard your hearts and minds in Christ Jesus.', reference: 'Philippians 4:7', focus: 'Peace', devotion: 'In a world full of noise and uncertainty, God offers a peace that makes no logical sense. It comes not from controlling circumstances, but from trusting the One who holds all things.', application: 'Before checking your phone today, spend 5 minutes in silence with God. Ask for His peace to fill you.' },
    { date: 's3', title: 'Known and Loved', scripture: 'For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.', reference: 'Jeremiah 29:11', focus: 'Purpose', devotion: 'You are not an accident. Long before you were born, God had a purpose for your life. Even in seasons of confusion — His plan for you is good.', application: 'Write down one dream you have been afraid to pursue. Bring it to God and ask for courage.' },
    { date: 's4', title: 'Rooted in Faith', scripture: 'So then, just as you received Christ Jesus as Lord, continue to live your lives in him, rooted and built up in him.', reference: 'Colossians 2:6-7', focus: 'Faith', devotion: 'A tree without deep roots cannot survive the storm. Faith is built daily through scripture, prayer, and obedience — not in one dramatic moment.', application: 'Do one small act of faith today that costs you something: time, comfort, or convenience.' },
    { date: 's5', title: 'Gratitude as a Habit', scripture: 'Give thanks in all circumstances; for this is the will of God in Christ Jesus for you.', reference: '1 Thessalonians 5:18', focus: 'Gratitude', devotion: 'Gratitude is not a feeling that comes when things are good. It is a discipline that transforms how you see everything — in good and difficult seasons alike.', application: 'Write three things you are grateful for right now, no matter how small.' },
    { date: 's6', title: 'The Power of Humility', scripture: 'Humble yourselves before the Lord, and he will lift you up.', reference: 'James 4:10', focus: 'Humility', devotion: "The world rewards confidence and self-promotion. But God's economy works differently. He exalts those who humble themselves. True humility is not weakness — it is strength submitted to God.", application: 'Think of one person you have been proud or difficult toward. Choose one act of humility toward them today.' },
    { date: 's7', title: 'Your Body is a Temple', scripture: 'Do you not know that your bodies are temples of the Holy Spirit, who is in you?', reference: '1 Corinthians 6:19', focus: 'Stewardship', devotion: 'Discipleship includes how you care for your body — your sleep, your food, your rest, your exercise. The Spirit lives in you. How you treat yourself is part of your worship.', application: 'Choose one healthy decision today as an act of worship: eat well, sleep at the right time, take a walk.' },
    { date: 's8', title: 'He Hears Your Prayer', scripture: 'This is the confidence we have in approaching God: that if we ask anything according to his will, he hears us.', reference: '1 John 5:14', focus: 'Prayer', devotion: 'Prayer is not shouting into a void. God hears. He listens. Every prayer you pray is received. Your words matter to Him — even the ones you cannot form, the groaning of your heart.', application: 'Spend 10 minutes praying today without asking for anything. Simply talk to God as a friend.' },
  ],
  bem: [
    { date: 's1', title: 'Ukuenda mu Maaka Yakwe', scripture: 'Nshingila fyonse ku fyalo fya Kristu ofyo anipa amaaka.', reference: 'Abafilipi 4:13', focus: 'Discipline', devotion: 'Lelo, leka icisomo ici cipange umutima wako. Tauli weka. Ubukali bonse ubukwata lelo ni ukusambilila ukuingila mu Kristu.', application: 'Longolola icimo ico ulakwata ubwafya lelo. Pelesha icimo ico ku Lesa mu mulombo.' },
    { date: 's2', title: 'Amano ya Lesa', scripture: 'Lamika ku Lesa ne mutima wako woonse, usanshike pa mano yako mwine.', reference: 'Imifwelo 3:5', focus: 'Faith', devotion: 'Lesa ulemba inshila yako. Icilangwa cakwe taci cana — ni ubumi bwabilo. Leka ukumba ukulangulula fyonse weka.', application: 'Lelo, lombela Lesa ukukulangulula mu cintu icimbi uco tauli lishibe.' },
  ],
}

export const SAMPLE_PRAYERS = {
  en: {
    morning: { title: 'Morning Prayer', slot: 'morning', prayer: "Lord Jesus, thank You for this new day. I come before You with open hands and an open heart. Forgive me for yesterday's failures. Fill me with Your Spirit today. Let my words be kind, my choices be wise, and my heart stay close to Yours. May everything I do today bring glory to Your name. Amen.", focus: 'Surrender' },
    midday:  { title: 'Midday Prayer',  slot: 'midday',  prayer: "Lord, I pause in the middle of this day to return to You. The noise of the world has been loud. Quiet my heart. Help me to remember what matters most. Realign my steps with Your purpose. Let the rest of this day honour You. Amen.", focus: 'Alignment' },
    evening: { title: 'Evening Prayer', slot: 'evening', prayer: "Father, thank You for carrying me through this day. I lay down its wins and its failures at Your feet. Forgive where I fell short. Guard my sleep. Renew my mind. As I close my eyes, let my trust in You be deeper than my fears. Amen.", focus: 'Rest' },
  },
  bem: {
    morning: { title: 'Umulombo wa Malelo', slot: 'morning', prayer: 'Mwine Yesu, natotela ku luchelo lwa lelo. Niza kuli Imwe na mfwi ifyenduka ne mutima uwafungulwa. Ndekeleleni ifintu ifya mailo ifyo nafishe. Nitemweni umupashi wenu lelo. Amina.', focus: 'Ukutosha' },
    midday:  { title: 'Umulombo wa Ubushiku', slot: 'midday', prayer: 'Mwine, naima pankatikati pa lelo ukulaputuka kuli Imwe. Bwezeni umutima wandi. Nishikilisheni ku ncito yenu. Amina.', focus: 'Ukulingana' },
    evening: { title: 'Umulombo wa Nachipaku', slot: 'evening', prayer: 'Taata, natotela pakutwala lelo. Ndekeleleni apo nafishe. Lindileni amalala yandi. Amina.', focus: 'Ukupumula' },
  },
}

export const SAMPLE_LESSONS = [
  { id: 'l0_1', level: 0, order: 1, title: 'Who Is God?', scripture: 'God is love, and whoever abides in love abides in God, and God abides in him.', reference: '1 John 4:16', content: 'Before we can know God we must understand what kind of God He is. He is not a distant judge waiting to condemn — He is a Father who loves deeply.\n\nGod revealed Himself in three ways: through creation, through scripture, and ultimately through Jesus Christ. When Jesus said "Whoever has seen me has seen the Father" (John 14:9), He was pointing us to the clearest picture of who God is.\n\nKnowing God is not a theological exercise. It is a relationship. It begins with understanding His nature and responding to His love.', questions: [{ question: 'How does 1 John 4:16 describe God?', answer: 'God is love' }, { question: 'Name one way God has revealed Himself to us.', answer: 'Through creation, scripture, or Jesus Christ' }, { question: 'What is the difference between knowing about God and knowing God personally?', answer: 'Knowing God is a relationship, not just information' }], createdBy: 'system' },
  { id: 'l0_2', level: 0, order: 2, title: 'The Trinity', scripture: 'Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit.', reference: 'Matthew 28:19', content: "The Trinity is one of the most important and most misunderstood truths in Christianity. God is one God who exists in three persons: the Father, the Son, and the Holy Spirit.\n\nThe Father is the creator and sustainer of all things. The Son — Jesus Christ — is God who became human to save us. The Holy Spirit is God who lives within every believer, guiding, comforting, and transforming.\n\nUnderstanding the Trinity matters because it tells us what God is like: He has always existed in relationship. Love is His very nature — not a feeling He has, but who He is.", questions: [{ question: 'How many persons are in the Trinity?', answer: 'Three: Father, Son, and Holy Spirit' }, { question: 'What is the role of the Holy Spirit?', answer: 'Guiding, comforting, and transforming the believer' }], createdBy: 'system' },
  { id: 'l1_1', level: 1, order: 1, title: 'What is Sin?', scripture: 'For all have sinned and fall short of the glory of God.', reference: 'Romans 3:23', content: "Sin is not just doing bad things. At its root, sin is living independently of God — putting ourselves at the centre of our lives instead of Him.\n\nUnderstanding sin is not meant to fill us with shame. It is meant to help us understand why we need a Saviour. The problem is real, and the solution is glorious.", questions: [{ question: 'What does Romans 3:23 say about all people?', answer: "All have sinned and fall short of God's glory" }, { question: 'What is sin at its root?', answer: 'Living independently of God, putting ourselves at the centre' }], createdBy: 'system' },
  { id: 'l1_2', level: 1, order: 2, title: 'Salvation by Grace', scripture: 'For by grace you have been saved through faith. And this is not your own doing; it is the gift of God.', reference: 'Ephesians 2:8', content: "Salvation cannot be earned. It is a gift. Jesus died on the cross in our place, rose from the dead three days later, defeating death itself.\n\nWhen we place our faith in Him, we are forgiven, adopted into God's family, and given eternal life. This is grace: undeserved favour.", questions: [{ question: 'How are we saved according to Ephesians 2:8?', answer: 'By grace through faith, not by our own doing' }, { question: 'What does grace mean?', answer: 'Undeserved favour from God' }], createdBy: 'system' },
  { id: 'l2_1', level: 2, order: 1, title: 'Why Habits Matter', scripture: 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind.', reference: 'Romans 12:2', content: "Transformation is not a one-time event. It happens through the consistent, daily renewal of our minds and habits.\n\nSpiritually healthy people are not people who had one great experience. They are people who built small, consistent habits: daily prayer, daily scripture, daily reflection. These habits reshape how we think, feel, and make decisions.", questions: [{ question: 'According to Romans 12:2, how are we transformed?', answer: 'By the renewing of our minds' }, { question: 'Why should spiritual habits come from love, not obligation?', answer: 'Love produces lasting change from the inside' }], createdBy: 'system' },
]
