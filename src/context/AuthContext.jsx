// src/context/AuthContext.jsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  getRedirectResult,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";

import { auth, googleProvider } from "../firebase/config";
import { createUserProfile, getUserProfile } from "../firebase/firestore";

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
useEffect(() => {
  const { getRedirectResult } = require("firebase/auth");
  getRedirectResult(auth)
    .then(async (result) => {
      if (!result) return;
      let prof = await getUserProfile(result.user.uid);
      if (!prof) {
        await createUserProfile(result.user.uid, {
          fullName: result.user.displayName || "",
          email: result.user.email || "",
          language: "en",
        });
        prof = await getUserProfile(result.user.uid);
      }
      setProfile(prof);
    })
    .catch(() => {});
}, []);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        let prof = await getUserProfile(firebaseUser.uid);
        if (!prof) {
          await createUserProfile(firebaseUser.uid, {
            fullName: firebaseUser.displayName || "",
            email: firebaseUser.email || "",
            language: "en",
          });
          prof = await getUserProfile(firebaseUser.uid);
        }
        setProfile(prof);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const prof = await getUserProfile(user.uid);
    setProfile(prof);
    return prof;
  }, [user]);

  async function register({ fullName, email, password, language }) {
    setAuthError("");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: fullName });
    await createUserProfile(cred.user.uid, { fullName, email, language });
    const prof = await getUserProfile(cred.user.uid);
    setProfile(prof);
    return cred.user;
  }

  async function login(email, password) {
    setAuthError("");
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const prof = await getUserProfile(cred.user.uid);
    setProfile(prof);
    return cred.user;
  }

  async function loginWithGoogle() {
    setAuthError("");
    try {
      // Try popup first (works on desktop)
      const cred = await signInWithPopup(auth, googleProvider);
      let prof = await getUserProfile(cred.user.uid);
      if (!prof) {
        await createUserProfile(cred.user.uid, {
          fullName: cred.user.displayName,
          email: cred.user.email,
          language: "en",
        });
        prof = await getUserProfile(cred.user.uid);
      }
      setProfile(prof);
      return cred.user;
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") return;
      // On mobile or if popup blocked — fall back to redirect
      if (
        err.code === "auth/popup-blocked" ||
        err.code === "auth/cancelled-popup-request" ||
        err.code === "auth/internal-error"
      ) {
        try {
          const { signInWithRedirect } = await import("firebase/auth");
          await signInWithRedirect(auth, googleProvider);
        } catch {
          setAuthError(
            "Google sign-in is not supported on this browser. Please use email and password instead.",
          );
        }
        return;
      }
      setAuthError(
        "Google sign-in failed. Please try again or use email and password.",
      );
    }
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  }

  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
  }

  const isAdmin = profile?.role === "admin";
  const isMentor = profile?.role === "mentor";
  const isVerifiedMentor = profile?.isVerifiedMentor === true;
  const canUploadVideo = isAdmin || isVerifiedMentor;
  const canPostTeaching = isAdmin || isMentor;
  const canEditContent = isAdmin || isMentor;
  const isGuest = !user;
  const canInteract = !!user;

  const value = {
    user,
    profile,
    loading,
    authError,
    setAuthError,
    register,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    refreshProfile,
    isAuthenticated: !!user,
    isGuest,
    canInteract,
    isAdmin,
    isMentor,
    isVerifiedMentor,
    canUploadVideo,
    canPostTeaching,
    canEditContent,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
