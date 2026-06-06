import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './styles/globals.css'

// ── Clerk (preserved for future switch-back) ───────────────────────────────
// import { ClerkProvider } from '@clerk/clerk-react'
//
// const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined
//
// const clerkAppearance = {
//   variables: {
//     colorPrimary: '#00e87a',
//     colorBackground: '#0e1018',
//     colorInputBackground: '#13161f',
//     colorInputText: '#f0f2f8',
//     colorText: '#f0f2f8',
//     colorTextSecondary: '#8b90a0',
//     borderRadius: '10px',
//     fontFamily: 'DM Sans, sans-serif',
//   },
//   elements: {
//     card: { border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'none' },
//     formButtonPrimary: { fontFamily: 'Syne, sans-serif', fontWeight: '700' },
//   },
// }
//
// ReactDOM.createRoot(document.getElementById('root')!).render(
//   <React.StrictMode>
//     <ClerkProvider publishableKey={PUBLISHABLE_KEY} appearance={clerkAppearance}>
//       <App />
//     </ClerkProvider>
//   </React.StrictMode>
// )
// ──────────────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
