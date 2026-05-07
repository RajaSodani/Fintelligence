import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn, AuthenticateWithRedirectCallback } from '@clerk/clerk-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Landing }   from '@/pages/Landing'
import { Dashboard } from '@/pages/Dashboard'
import { Research }  from '@/pages/Research'
import { Market }    from '@/pages/Market'
import { Settings }  from '@/pages/Settings'
import { AuthPage }  from '@/pages/auth/AuthPage'

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"                element={<Landing />} />
        <Route path="/auth/sign-in"    element={<AuthPage defaultMode="signin" />} />
        <Route path="/auth/sign-up"    element={<AuthPage defaultMode="signup" />} />
        <Route path="/sso-callback"    element={<AuthenticateWithRedirectCallback />} />

        {/* Protected app shell */}
        <Route
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/research"  element={<Research />} />
          <Route path="/market"    element={<Market />} />
          <Route path="/settings"  element={<Settings />} />
        </Route>

        {/* Legacy Clerk routes redirect */}
        <Route path="/sign-in/*" element={<Navigate to="/auth/sign-in" replace />} />
        <Route path="/sign-up/*" element={<Navigate to="/auth/sign-up" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
