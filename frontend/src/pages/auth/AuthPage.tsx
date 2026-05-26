import { useState, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useSignIn, useSignUp } from '@clerk/clerk-react'
import { ArrowRight, Mail, Smartphone, Sparkles, ShieldCheck, Zap, BarChart3, ArrowLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type Mode = 'signin' | 'signup'
type Step = 'email' | 'otp' | 'name'
type Identifier = 'email' | 'phone'

const features = [
  { icon: Sparkles,   color: 'var(--green)',  text: 'AI research on any stock in 30 seconds' },
  { icon: BarChart3,  color: 'var(--blue)',   text: 'Live portfolio tracking with real P&L' },
  { icon: Zap,        color: 'var(--amber)',  text: 'Spending insights powered by AI' },
  { icon: ShieldCheck,color: 'var(--purple)', text: 'Bank-grade 256-bit encryption' },
]

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.48h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}

interface OtpInputProps {
  value: string
  onChange: (val: string) => void
  length?: number
}

function OtpInput({ value, onChange, length = 6 }: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const handleKey = useCallback((i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !inputs.current[i]?.value && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }, [])

  const handleChange = useCallback((i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1)
    const arr = value.split('')
    arr[i] = digit
    const next = arr.join('').slice(0, length)
    onChange(next)
    if (digit && i < length - 1) {
      inputs.current[i + 1]?.focus()
    }
  }, [value, onChange, length])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    onChange(pasted)
    const focusIdx = Math.min(pasted.length, length - 1)
    inputs.current[focusIdx]?.focus()
  }, [onChange, length])

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          className={cn('otp-input', value[i] ? 'filled' : '')}
          autoFocus={i === 0}
        />
      ))}
    </div>
  )
}

interface AuthFormProps {
  mode: Mode
  onToggleMode: () => void
}

function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const navigate = useNavigate()
  const { isLoaded: siLoaded, signIn, setActive: siSetActive }   = useSignIn()
  const { isLoaded: suLoaded, signUp, setActive: suSetActive }   = useSignUp()

  const [step, setStep]           = useState<Step>('email')
  const [identifier, setIdentifier] = useState<Identifier>('phone')
  const [email, setEmail]         = useState('')
  const [phone, setPhone]         = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [otp, setOtp]             = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const isReady = mode === 'signin' ? siLoaded : suLoaded

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isReady) return
    setError('')
    setLoading(true)
    try {
      if (identifier === 'phone') {
        const fullPhone = `+91${phone.replace(/\D/g, '')}`
        if (phone.replace(/\D/g, '').length !== 10) { setError('Enter a valid 10-digit mobile number'); setLoading(false); return }
        if (mode === 'signin') {
          await signIn!.create({ strategy: 'phone_code', identifier: fullPhone })
        } else {
          if (step === 'email') { setStep('name'); setLoading(false); return }
          await signUp!.create({ phoneNumber: fullPhone, firstName: firstName.trim(), lastName: lastName.trim() })
          await signUp!.preparePhoneNumberVerification({ strategy: 'phone_code' })
        }
      } else {
        if (!email.trim()) { setError('Enter your email address'); setLoading(false); return }
        if (mode === 'signin') {
          await signIn!.create({ strategy: 'email_code', identifier: email.trim() })
        } else {
          if (step === 'email') { setStep('name'); setLoading(false); return }
          await signUp!.create({ emailAddress: email.trim(), firstName: firstName.trim(), lastName: lastName.trim() })
          await signUp!.prepareEmailAddressVerification({ strategy: 'email_code' })
        }
      }
      setStep('otp')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 6 || !isReady) return
    setError('')
    setLoading(true)
    try {
      if (mode === 'signin') {
        const strategy = identifier === 'phone' ? 'phone_code' : 'email_code'
        const result = await signIn!.attemptFirstFactor({ strategy, code: otp })
        if (result.status === 'complete') {
          await siSetActive!({ session: result.createdSessionId })
          navigate('/dashboard')
        }
      } else {
        const result = identifier === 'phone'
          ? await signUp!.attemptPhoneNumberVerification({ code: otp })
          : await signUp!.attemptEmailAddressVerification({ code: otp })
        if (result.status === 'complete') {
          await suSetActive!({ session: result.createdSessionId })
          navigate('/dashboard')
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid code. Please try again.'
      setError(msg)
      setOtp('')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    if (!isReady) return
    try {
      if (mode === 'signin') {
        await signIn!.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: `${window.location.origin}/sso-callback`,
          redirectUrlComplete: '/dashboard',
        })
      } else {
        await signUp!.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: `${window.location.origin}/sso-callback`,
          redirectUrlComplete: '/dashboard',
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.'
      setError(msg)
    }
  }

  const isSignIn = mode === 'signin'
  const canGoBack = step !== 'email'

  return (
    <div className="w-full max-w-[420px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        {canGoBack && (
          <button
            onClick={() => { setStep('email'); setOtp(''); setError('') }}
            className="flex items-center gap-1.5 text-[var(--text3)] hover:text-[var(--text2)] transition-colors mb-4 font-mono text-sm"
          >
            <ArrowLeft size={14} /> Back
          </button>
        )}
        <h2 className="font-syne font-extrabold text-[28px] text-[var(--text)] tracking-tight leading-tight mb-1">
          {step === 'otp'
            ? 'Enter your code'
            : isSignIn ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="font-dm text-[15px] text-[var(--text2)]">
          {step === 'otp'
            ? `We sent a 6-digit code to ${email}`
            : isSignIn
            ? 'Sign in to your Fintelligence account'
            : 'Start building wealth with AI'}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[rgba(255,77,106,0.08)] border border-[rgba(255,77,106,0.2)]">
          <AlertCircle size={15} className="text-[var(--red)] flex-shrink-0 mt-0.5" />
          <p className="font-dm text-sm text-[var(--red)]">{error}</p>
        </div>
      )}

      {step === 'otp' ? (
        /* OTP step */
        <form onSubmit={handleOtpSubmit} className="flex flex-col gap-6">
          <p className="font-dm text-sm text-[var(--text2)] text-center -mt-2">
            We sent a 6-digit code to {identifier === 'phone' ? `+91 ${phone}` : email}
          </p>
          <OtpInput value={otp} onChange={setOtp} />
          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full" iconRight={ArrowRight}>
            Verify Code
          </Button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => { setStep('email'); setOtp(''); }}
              className="font-mono text-sm text-[var(--text3)] hover:text-[var(--text2)] transition-colors"
            >
              Didn't get a code? Try again
            </button>
          </div>
        </form>
      ) : (
        /* Identifier / name step */
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl border border-[var(--border2)] bg-[var(--bg3)] hover:bg-[var(--bg4)] hover:border-[var(--border3)] transition-all font-syne font-semibold text-[15px] text-[var(--text)]"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--border2)]" />
            <span className="font-mono text-xs text-[var(--text3)]">or</span>
            <div className="flex-1 h-px bg-[var(--border2)]" />
          </div>

          {/* Phone / Email toggle */}
          <div className="flex p-1 rounded-xl bg-[var(--bg3)] border border-[var(--border)]">
            {(['phone', 'email'] as Identifier[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setIdentifier(id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-syne font-semibold text-sm transition-all duration-200',
                  identifier === id
                    ? 'bg-[var(--bg5)] text-[var(--text)] shadow-sm'
                    : 'text-[var(--text3)] hover:text-[var(--text2)]'
                )}
              >
                {id === 'phone' ? <Smartphone size={13} /> : <Mail size={13} />}
                {id === 'phone' ? 'Mobile' : 'Email'}
              </button>
            ))}
          </div>

          {/* Name fields (sign-up, step 2) */}
          {!isSignIn && step === 'name' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Raj"
                  required
                  autoFocus
                  className="px-4 py-3 rounded-xl bg-[var(--bg3)] border border-[var(--border2)] text-[var(--text)] font-dm text-[15px] placeholder:text-[var(--text3)] focus:border-[rgba(0,232,122,0.35)] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Sharma"
                  className="px-4 py-3 rounded-xl bg-[var(--bg3)] border border-[var(--border2)] text-[var(--text)] font-dm text-[15px] placeholder:text-[var(--text3)] focus:border-[rgba(0,232,122,0.35)] transition-colors"
                />
              </div>
            </div>
          )}

          {/* Phone input */}
          {identifier === 'phone' && (
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest">Mobile Number</label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg3)] border border-[var(--border2)] focus-within:border-[rgba(0,232,122,0.35)] transition-colors">
                <span className="font-mono text-[15px] text-[var(--text2)] flex-shrink-0">+91</span>
                <div className="w-px h-4 bg-[var(--border2)] flex-shrink-0" />
                <Smartphone size={15} className="text-[var(--text3)] flex-shrink-0" />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98765 43210"
                  autoFocus
                  className="flex-1 font-dm text-[15px] bg-transparent text-[var(--text)] placeholder:text-[var(--text3)]"
                />
              </div>
            </div>
          )}

          {/* Email input */}
          {identifier === 'email' && (
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest">Email Address</label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg3)] border border-[var(--border2)] focus-within:border-[rgba(0,232,122,0.35)] transition-colors">
                <Mail size={16} className="text-[var(--text3)] flex-shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  className="flex-1 font-dm text-[15px] bg-transparent text-[var(--text)] placeholder:text-[var(--text3)]"
                />
              </div>
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full" iconRight={ArrowRight}>
            {isSignIn
              ? `Continue with ${identifier === 'phone' ? 'Mobile' : 'Email'}`
              : step === 'email' ? 'Continue' : 'Send Verification Code'}
          </Button>
        </form>
      )}

      {/* Toggle mode */}
      <p className="mt-6 text-center font-dm text-[15px] text-[var(--text2)]">
        {isSignIn ? "Don't have an account? " : 'Already have an account? '}
        <button
          type="button"
          onClick={onToggleMode}
          className="text-[var(--green)] font-semibold hover:underline transition-colors"
        >
          {isSignIn ? 'Sign up free' : 'Sign in'}
        </button>
      </p>
    </div>
  )
}

interface AuthPageProps {
  defaultMode?: Mode
}

export function AuthPage({ defaultMode = 'signin' }: AuthPageProps) {
  const [mode, setMode] = useState<Mode>(defaultMode)

  return (
    <div className="min-h-screen bg-[var(--bg)] flex">
      {/* Left brand panel */}
      <div
        className="hidden lg:flex flex-col w-[44%] min-h-screen p-10 relative overflow-hidden"
        style={{ background: 'var(--bg2)', borderRight: '1px solid var(--border2)' }}
      >
        {/* Background glows */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[rgba(0,232,122,0.05)] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-20 w-[400px] h-[400px] rounded-full bg-[rgba(77,159,255,0.04)] blur-3xl pointer-events-none" />

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 relative z-10 w-fit">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #00e87a, #00c968)', boxShadow: '0 0 20px rgba(0,232,122,0.4)' }}
          >
            <Sparkles size={16} color="#07090f" strokeWidth={2.5} />
          </div>
          <span className="font-syne font-extrabold text-[18px] text-[var(--text)]">Fintelligence</span>
        </Link>

        {/* Hero text */}
        <div className="flex-1 flex flex-col justify-center relative z-10 py-10">
          <div className="mb-2">
            <span className="font-mono text-2xs text-[var(--green)] uppercase tracking-[0.12em]">AI-Powered Finance OS</span>
          </div>
          <h2 className="font-syne font-extrabold text-[36px] text-[var(--text)] leading-[1.1] tracking-tight mb-6">
            Your money.<br />
            <span style={{ background: 'linear-gradient(90deg, var(--green), #00c9ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Finally intelligent.
            </span>
          </h2>
          <p className="font-dm text-[16px] text-[var(--text2)] leading-relaxed mb-10">
            AI agents that research stocks, analyze spending, and build your financial future — automatically.
          </p>

          {/* Features */}
          <div className="flex flex-col gap-4">
            {features.map(({ icon: Icon, color, text }) => (
              <div key={text} className="flex items-center gap-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}14` }}
                >
                  <Icon size={16} style={{ color }} />
                </div>
                <p className="font-dm text-[15px] text-[var(--text2)]">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 p-5 rounded-2xl border border-[var(--border2)] bg-[var(--bg3)]">
          <p className="font-dm text-[14px] text-[var(--text2)] leading-relaxed mb-4">
            "Fintelligence gave me institutional-grade investment research that I used to pay ₹50,000/month for. Now I get it in 30 seconds."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-syne font-bold text-xs flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--green), var(--blue))', color: '#07090f' }}>
              P
            </div>
            <div>
              <p className="font-syne font-bold text-sm text-[var(--text)]">Priya Menon</p>
              <p className="font-mono text-2xs text-[var(--text3)]">Founder, TechStart Mumbai</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--green)' }}>
              <Sparkles size={12} color="#07090f" />
            </div>
            <span className="font-syne font-extrabold text-[15px] text-[var(--text)]">Fintelligence</span>
          </Link>
        </div>

        {/* Form centered */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[420px]">
            {/* Mode tabs */}
            <div className="flex p-1 rounded-xl bg-[var(--bg3)] border border-[var(--border)] mb-8">
              {(['signin', 'signup'] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); }}
                  className={cn(
                    'flex-1 py-2.5 rounded-lg font-syne font-semibold text-sm transition-all duration-200',
                    mode === m
                      ? 'bg-[var(--bg5)] text-[var(--text)] shadow-sm'
                      : 'text-[var(--text3)] hover:text-[var(--text2)]'
                  )}
                >
                  {m === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            <AuthForm key={mode} mode={mode} onToggleMode={() => setMode(m => m === 'signin' ? 'signup' : 'signin')} />

            {/* Terms */}
            <p className="mt-8 text-center font-mono text-2xs text-[var(--text3)] leading-relaxed">
              By continuing, you agree to our{' '}
              <a href="#" className="text-[var(--text2)] hover:text-[var(--text)] transition-colors">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-[var(--text2)] hover:text-[var(--text)] transition-colors">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
