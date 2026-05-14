// src/App.jsx — Guest access: dashboard is public, onboarding requires auth

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense }   from 'react'
import { ThemeProvider }    from './context/ThemeContext'
import { AuthProvider }     from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import Navbar               from './components/shared/Navbar'
import ProtectedRoute, { AuthRoute } from './components/shared/ProtectedRoute'
import { PageSpinner }      from './components/shared/UIStates'

const Landing        = lazy(() => import('./pages/Landing'))
const Login          = lazy(() => import('./pages/Login'))
const Register       = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const Onboarding     = lazy(() => import('./pages/Onboarding'))
const Dashboard      = lazy(() => import('./pages/Dashboard'))

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <LanguageProvider>
            <Suspense fallback={<PageSpinner />}>
              <Routes>
                {/* Public */}
                <Route path="/"                element={<><Navbar /><Landing /></>} />
                <Route path="/login"           element={<><Navbar /><Login /></>} />
                <Route path="/register"        element={<><Navbar /><Register /></>} />
                <Route path="/forgot-password" element={<><Navbar /><ForgotPassword /></>} />

                {/* Onboarding — requires logged-in account */}
                <Route path="/onboarding" element={
                  <AuthRoute><Onboarding /></AuthRoute>
                } />

                {/* Dashboard — open to guests AND authenticated users */}
                <Route path="/dashboard/*" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
