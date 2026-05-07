import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import './styles/globals.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined

const clerkAppearance = {
  variables: {
    colorPrimary: '#00e87a',
    colorBackground: '#0e1018',
    colorInputBackground: '#13161f',
    colorInputText: '#f0f2f8',
    colorText: '#f0f2f8',
    colorTextSecondary: '#8b90a0',
    borderRadius: '10px',
    fontFamily: 'DM Sans, sans-serif',
  },
  elements: {
    card: { border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'none' },
    formButtonPrimary: { fontFamily: 'Syne, sans-serif', fontWeight: '700' },
  },
}

const isKeyMissing = !PUBLISHABLE_KEY || PUBLISHABLE_KEY === 'pk_test_your_key_here'

function SetupScreen() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center flex flex-col gap-6">
        <div className="flex items-center justify-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-[var(--green)]" />
          <span className="font-syne font-extrabold text-xl text-[var(--text)]">Fintelligence</span>
        </div>
        <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-6 text-left flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--amber)]" />
            <span className="font-mono text-xs text-[var(--amber)] tracking-widest uppercase">Setup Required</span>
          </div>
          <h2 className="font-syne font-bold text-lg text-[var(--text)]">Add your Clerk key</h2>
          <p className="font-dm text-sm text-[var(--text2)] leading-relaxed">
            Open <code className="font-mono text-xs bg-[var(--bg4)] px-1.5 py-0.5 rounded text-[var(--green)]">.env</code> and replace the placeholder with your real Clerk publishable key:
          </p>
          <div className="bg-[var(--bg3)] border border-[var(--border)] rounded-lg p-3">
            <p className="font-mono text-xs text-[var(--green)] break-all">
              VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
            </p>
          </div>
          <p className="font-dm text-xs text-[var(--text3)]">
            Get your key at{' '}
            <span className="text-[var(--blue)]">clerk.com → Dashboard → API Keys</span>
          </p>
          <p className="font-mono text-[11px] text-[var(--text3)]">
            After editing .env, restart the dev server: <span className="text-[var(--text2)]">npm run dev</span>
          </p>
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isKeyMissing ? (
      <SetupScreen />
    ) : (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} appearance={clerkAppearance}>
        <App />
      </ClerkProvider>
    )}
  </React.StrictMode>
)
