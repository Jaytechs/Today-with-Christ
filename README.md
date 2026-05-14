# Today with Christ — Production v5

A Christian spiritual growth platform built with React 18 + Firebase.

---

## Quick Start

```bash
npm install
cp .env.example .env   # fill in your Firebase credentials
npm run dev
```

---

## Environment Setup

Fill in `.env` (never commit it):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

---

## New in v5 (Production Hardening)

- All Firebase credentials moved to `.env` — no hardcoded keys
- Route-level code splitting with `React.lazy()` + `Suspense`
- `vite.config.js` vendor chunk splitting for optimal caching
- Reusable `ErrorState`, `EmptyState`, `LoadingSpinner`, `SkeletonCard`, `Toast` components
- `useFirestore` hook for safe real-time subscriptions with auto-cleanup
- `useSearch` hook + `SearchBar` + `CategoryTabs` components for videos and community
- `streakService.js` — reliable streak logic with missed-day handling and milestone tracking
- `notificationService.js` — FCM token registration, foreground message handler, local reminder scheduling
- `moderationService.js` — full report system, admin delete, user disable, mentor verification
- `contentSafety.js` — post/comment character limits, cooldown timers, basic profanity filter
- `ReportModal` component — users can flag posts and comments with a reason
- `AdminPanel` upgraded — Reports tab with dismiss/delete/review actions, user disable button
- `firestore.rules` — hardened: disabled user check, report collection rules
- `firestore.indexes.json` — all required composite indexes for production queries
- `firebase.json` — hosting config with security headers and SPA rewrites
- `vercel.json` — Vercel deployment with SPA routing and caching headers
- Full production testing checklist in this README

---

## Deployment

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
npm run build
firebase deploy
```

### Vercel
```bash
npm install -g vercel
vercel --prod
```
Add all VITE_* variables in Vercel project settings.

---

## Roles

| Role    | Permissions |
|---------|-------------|
| user    | Reflections, comments, Amen, prayer requests |
| mentor  | Above + scriptures, prayer points, lessons, videos, pathway levels |
| admin   | Full access + disable users, review reports |

---

## Production Testing Checklist

### Auth
- [ ] Register (email) → onboarding shown
- [ ] Register (Google) → onboarding shown
- [ ] Login → dashboard
- [ ] Forgot password → email received
- [ ] Logout → landing
- [ ] Protected route without auth → login
- [ ] Duplicate email → clear error

### Onboarding
- [ ] New user sees onboarding
- [ ] Returning user skips straight to dashboard
- [ ] Language, goals, reminder saved to Firestore
- [ ] Skip works on all steps

### Dashboard
- [ ] Daily devotion loads
- [ ] Prayer switches by time of day
- [ ] Mark complete updates streak
- [ ] Streak increments day-over-day
- [ ] Streak resets after missed day

### Scripture
- [ ] Rotates every 30 min (countdown shown)
- [ ] Mentor can add / delete own scripture
- [ ] Admin can delete any scripture

### Prayer
- [ ] User submits prayer request
- [ ] Anonymous hides name
- [ ] Prayed-for counter works
- [ ] Mark answered works
- [ ] Mentor adds prayer point with slot
- [ ] Guided prayers show by time

### Reminders
- [ ] 4 slots visible
- [ ] Permission prompt fires
- [ ] Preferences saved
- [ ] Local notification fires at correct time

### Pathway
- [ ] Mentor/admin adds level with color
- [ ] Mentor/admin edits level
- [ ] Admin deletes level
- [ ] Lessons unlock sequentially
- [ ] Quiz saves progress

### Community
- [ ] Post reflection (800 char limit enforced)
- [ ] 60s cooldown between posts
- [ ] Category filter works
- [ ] Amen toggles
- [ ] Comments real-time
- [ ] Report modal opens and submits
- [ ] Cannot report same content twice
- [ ] Admin deletes post

### Videos
- [ ] Category filter and keyword search work
- [ ] YouTube/Vimeo embed plays
- [ ] Admin/mentor upload works
- [ ] Admin delete works

### Admin Panel
- [ ] Non-admin redirected
- [ ] Role change works
- [ ] Cannot demote own account
- [ ] Disable user works
- [ ] Reports tab shows pending reports
- [ ] Delete post from report works
- [ ] Dismiss report works

### Responsiveness
- [ ] Mobile: sidebar collapses, hamburger opens it
- [ ] All pages scroll without horizontal overflow
- [ ] Touch targets >= 44px

### Security
- [ ] Unauthenticated write to Firestore blocked
- [ ] User cannot self-escalate role
- [ ] Disabled user write blocked
- [ ] No Firebase credentials in source code (check browser Sources tab)
