// public/firebase-messaging-sw.js
// ─────────────────────────────────────────────────────────────────────────────
// Firebase Cloud Messaging service worker
// This file MUST be in the /public folder so it is served at the root URL.
// ─────────────────────────────────────────────────────────────────────────────

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

// TODO: Replace with your Firebase config
firebase.initializeApp({
  apiKey: "AIzaSyCKwovJyLjlDZWDGU8i9GQlQCV25W6TTBc",
  authDomain: "today-with-christ.firebaseapp.com",
  projectId: "today-with-christ",
  storageBucket: "today-with-christ.firebasestorage.app",
  messagingSenderId: "735290542957",
  appId: "1:735290542957:web:e682b13e4043a8c1446864",
  measurementId: "G-QZCEZ9NZXP"
})

const messaging = firebase.messaging()

// Handle background notifications
messaging.onBackgroundMessage(function(payload) {
  console.log('[SW] Background message:', payload)

  const { title, body, icon } = payload.notification

  self.registration.showNotification(title, {
    body,
    icon: icon || '/cross.svg',
    badge: '/cross.svg',
    data: payload.data,
  })
})
