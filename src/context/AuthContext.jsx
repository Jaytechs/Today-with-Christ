// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
  signInWithPopup, sendPasswordResetEmail, updateProfile,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase/config'
import { createUserProfile, getUserProfile } from '../firebase/firestore'

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null)
  const [profile,   setProfile]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const prof = await getUserProfile(firebaseUser.uid)
        setProfile(prof)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  // FIX: expose refreshProfile so dashboard can call it after streak update
  const refreshProfile = useCallback(async () => {
    if (!user) return
    const prof = await getUserProfile(user.uid)
    setProfile(prof)
    return prof
  }, [user])

  async function register({ fullName, email, password, language }) {
    setAuthError('')
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: fullName })
    await createUserProfile(cred.user.uid, { fullName, email, language })
    const prof = await getUserProfile(cred.user.uid)
    setProfile(prof)
    return cred.user
  }

  async function login(email, password) {
    setAuthError('')
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const prof = await getUserProfile(cred.user.uid)
    setProfile(prof)
    return cred.user
  }

  async function loginWithGoogle() {
    setAuthError('')
    const cred = await signInWithPopup(auth, googleProvider)
    let prof = await getUserProfile(cred.user.uid)
    if (!prof) {
      await createUserProfile(cred.user.uid, {
        fullName: cred.user.displayName,
        email:    cred.user.email,
        language: 'en',
      })
      prof = await getUserProfile(cred.user.uid)
    }
    setProfile(prof)
    return cred.user
  }

  async function logout() {
    await signOut(auth)
    setUser(null)
    setProfile(null)
  }

  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email)
  }

  const isAdmin         = profile?.role === 'admin'
  const isMentor        = profile?.role === 'mentor'
  const isVerifiedMentor= profile?.isVerifiedMentor === true
  const canUploadVideo  = isAdmin || isVerifiedMentor
  const canPostTeaching = isAdmin || isMentor
  const canEditContent  = isAdmin || isMentor

  // isGuest = browsing without an account
  const isGuest = !user

  // canInteract = can post, comment, react (must be logged in)
  const canInteract = !!user

  const value = {
    user, profile, loading, authError, setAuthError,
    register, login, loginWithGoogle, logout, resetPassword,
    refreshProfile,
    isAuthenticated: !!user,
    isGuest,
    canInteract,
    isAdmin, isMentor, isVerifiedMentor,
    canUploadVideo, canPostTeaching, canEditContent,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
