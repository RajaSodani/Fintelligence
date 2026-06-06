import { Link, Navigate } from 'react-router-dom'
// import { useAuth } from '@clerk/clerk-react' // preserved for future switch-back
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ArrowRight, Building2, Bot, BarChart3, ShieldCheck, Zap, TrendingUp, Sparkles } from 'lucide-react'

const features = [
  {
    icon: Building2,
    color: 'var(--green)',
    bg: 'rgba(0,232,122,0.08)',
    title: 'Finance OS',
    description: 'Connect all your accounts in one place. Track spending, investments, and net worth with real-time sync across 10,000+ banks.',
  },
  {
    icon: Bot,
    color: 'var(--blue)',
    bg: 'rgba(77,159,255,0.08)',
    title: 'Multi-Agent Research',
    description: '4 specialized AI agents — News, Financials, Sentiment, Thesis — deliver institutional-grade stock research in 30 seconds.',
  },
  {
    icon: BarChart3,
    color: 'var(--amber)',
    bg: 'rgba(245,166,35,0.08)',
    title: 'Live Market Dashboard',
    description: 'Real-time portfolio P&L, sparkline charts, smart price alerts, and a watchlist — all in one beautiful view.',
  },
  {
    icon: ShieldCheck,
    color: 'var(--purple)',
    bg: 'rgba(155,109,255,0.08)',
    title: 'Bank-grade Security',
    description: '256-bit encryption, read-only bank access via Plaid, SOC 2 Type II compliant. Your data is never sold.',
  },
]

const metrics = [
  { value: '10K+',  label: 'Banks',         icon: Building2 },
  { value: '30s',   label: 'AI Research',    icon: Zap },
  { value: '4',     label: 'Agents',         icon: Bot },
  { value: '99.9%', label: 'Uptime',         icon: ShieldCheck },
]

const testimonials = [
  { name: 'Priya Menon', role: 'Founder, TechStart', body: 'Fintelligence gave me the kind of investment research only hedge funds used to have. The AI agents are insanely fast.' },
  { name: 'Rahul Kapoor', role: 'Senior Engineer, Zepto', body: 'Finally replaced 4 apps — net worth tracker, portfolio app, news aggregator, and Excel sheets — with one.' },
  { name: 'Anjali Shah', role: 'CA, Shah & Associates', body: 'The spending breakdown and cashflow visibility helped me save ₹40K more per month. Genuinely changed how I think about money.' },
]

export function Landing() {
  const { isSignedIn, isLoaded } = useAuth()
  if (isLoaded && isSignedIn) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col overflow-x-hidden">
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: 'rgba(7,9,15,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00e87a, #00c968)', boxShadow: '0 0 16px rgba(0,232,122,0.4)' }}
          >
            <Sparkles size={14} color="#07090f" strokeWidth={2.5} />
          </div>
          <span className="font-syne font-extrabold text-[16px] text-[var(--text)]">Fintelligence</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth/sign-in">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link to="/auth/sign-up">
            <Button variant="primary" size="sm" iconRight={ArrowRight}>Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-28 pb-24 gap-8">
        {/* Glow orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-gradient-to-b from-[rgba(0,232,122,0.06)] to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[300px] h-[300px] rounded-full bg-[rgba(77,159,255,0.04)] blur-3xl pointer-events-none" />

        <Badge variant="green" dot className="text-xs px-4 py-1.5 rounded-full">
          AI-Powered Finance OS
        </Badge>

        <h1 className="font-syne font-extrabold text-[clamp(42px,6.5vw,72px)] leading-[1.04] text-[var(--text)] max-w-3xl tracking-tight relative z-10">
          Your money.<br />
          Finally{' '}
          <span
            className="relative inline-block"
            style={{
              background: 'linear-gradient(90deg, var(--green), #00c9ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            intelligent.
          </span>
        </h1>

        <p className="font-dm text-[17px] text-[var(--text2)] max-w-xl leading-relaxed relative z-10">
          AI agents that research stocks, track your portfolio, analyze spending patterns, and answer any financial question — all in real time.
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-center relative z-10">
          <Link to="/auth/sign-up">
            <Button variant="primary" size="lg" iconRight={ArrowRight}>
              Start for free
            </Button>
          </Link>
          <Link to="/auth/sign-in">
            <Button variant="ghost" size="lg">Sign in →</Button>
          </Link>
        </div>

        {/* Social proof strip */}
        <div className="flex items-center gap-2 text-[var(--text3)] relative z-10">
          <div className="flex -space-x-2">
            {['A', 'R', 'P', 'S'].map((l, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-[var(--bg)] flex items-center justify-center font-syne font-bold text-[10px]"
                style={{ background: `hsl(${i * 60 + 120}, 60%, 40%)`, color: '#fff' }}
              >
                {l}
              </div>
            ))}
          </div>
          <span className="font-mono text-xs">Trusted by 2,400+ investors</span>
        </div>
      </section>

      {/* Metrics strip */}
      <section className="px-8 pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {metrics.map(({ value, label, icon: Icon }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 py-6 rounded-2xl border border-[var(--border2)] bg-[var(--bg2)]"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--bg4)] flex items-center justify-center">
                <Icon size={18} className="text-[var(--green)]" />
              </div>
              <span className="font-syne font-extrabold text-[32px] text-[var(--text)] leading-none">{value}</span>
              <span className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="px-8 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="font-mono text-2xs text-[var(--green)] uppercase tracking-[0.14em] mb-3">Everything you need</p>
            <h2 className="font-syne font-extrabold text-[36px] text-[var(--text)] tracking-tight">Built for serious investors</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map(({ icon: Icon, color, bg, title, description }) => (
              <div
                key={title}
                className="group p-6 rounded-2xl border border-[var(--border2)] bg-[var(--bg2)] hover:border-[var(--border3)] hover:-translate-y-0.5 transition-all duration-200 cursor-default"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: bg }}
                >
                  <Icon size={22} style={{ color }} />
                </div>
                <h3 className="font-syne font-bold text-[17px] text-[var(--text)] mb-2">{title}</h3>
                <p className="font-dm text-[15px] text-[var(--text2)] leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-8 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="font-mono text-2xs text-[var(--blue)] uppercase tracking-[0.14em] mb-3">Real people, real results</p>
            <h2 className="font-syne font-extrabold text-[36px] text-[var(--text)] tracking-tight">Loved by investors across India</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map(({ name, role, body }) => (
              <div
                key={name}
                className="p-6 rounded-2xl border border-[var(--border2)] bg-[var(--bg2)] flex flex-col gap-4"
              >
                <p className="font-dm text-[15px] text-[var(--text2)] leading-relaxed flex-1">"{body}"</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-syne font-bold text-sm flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--green), var(--blue))', color: '#07090f' }}
                  >
                    {name[0]}
                  </div>
                  <div>
                    <p className="font-syne font-bold text-sm text-[var(--text)]">{name}</p>
                    <p className="font-mono text-2xs text-[var(--text3)]">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 pb-20">
        <div className="max-w-2xl mx-auto text-center py-16 px-8 rounded-3xl border border-[rgba(0,232,122,0.2)] bg-gradient-to-br from-[rgba(0,232,122,0.06)] to-[rgba(77,159,255,0.04)] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,232,122,0.12), transparent 70%)' }} />
          <TrendingUp className="mx-auto mb-4 text-[var(--green)]" size={32} />
          <h2 className="font-syne font-extrabold text-[36px] text-[var(--text)] tracking-tight mb-3">
            Start growing your wealth today
          </h2>
          <p className="font-dm text-[16px] text-[var(--text2)] mb-8">
            Free forever. No credit card needed. Set up in under 2 minutes.
          </p>
          <Link to="/auth/sign-up">
            <Button variant="primary" size="lg" iconRight={ArrowRight}>
              Get started for free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-8 py-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'var(--green)' }}>
            <Sparkles size={10} color="#07090f" />
          </div>
          <span className="font-syne font-bold text-[14px] text-[var(--text2)]">Fintelligence</span>
        </div>
        <p className="font-mono text-xs text-[var(--text3)]">© {new Date().getFullYear()} Fintelligence. All rights reserved.</p>
        <div className="flex gap-4">
          {['Privacy', 'Terms', 'Security'].map((l) => (
            <a key={l} href="#" className="font-mono text-xs text-[var(--text3)] hover:text-[var(--text2)] transition-colors">{l}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}
