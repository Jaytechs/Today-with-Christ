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
  signInWithRedirect,
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

// Detect mobile/embedded browsers where popups are blocked
function isMobileBrowser() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(
    navigator.userAgent,
  );
}

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
        // Handle Google redirect result — create profile if new user
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

  // Handle Google redirect result on page load
  useEffect(() => {
    getRedirectResult(auth).catch(() => {
      // Silently ignore — no redirect in progress
    });
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
    // Use redirect on mobile (popups are blocked), popup on desktop
    if (isMobileBrowser()) {
      await signInWithRedirect(auth, googleProvider);
      // Page will reload — onAuthStateChanged handles the result
      return;
    }
    try {
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
      // popup blocked on desktop too — fall back to redirect
      if (
        err.code === "auth/popup-blocked" ||
        err.code === "auth/popup-closed-by-user"
      ) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw err;
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
