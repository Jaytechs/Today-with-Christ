// src/pages/Landing.jsx  ─ PHASE 1
// ─────────────────────────────────────────────────────────────────────────────
// Full landing page: Hero → Features → Daily Flow → Why → Testimonials → Footer
// ─────────────────────────────────────────────────────────────────────────────

import { Link } from 'react-router-dom'
import {
  BookOpen, Heart, PenLine, TrendingUp, Bell, BarChart2,
  Globe, ArrowRight, Sun, CloudSun, Moon, Star, ChevronRight,
  CheckCircle2, Shield, Flame,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

// ── Small reusable pieces ────────────────────────────────────────────────────

function CrossIcon({ size = 40, className = '' }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
      <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(201,168,76,0.25)" strokeWidth="1.5"/>
      <line x1="20" y1="6"  x2="20" y2="34" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="8"  y1="16" x2="32" y2="16" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="section-label mb-3">
      <div className="gold-line" />
      {children}
    </div>
  )
}

// ── HERO ─────────────────────────────────────────────────────────────────────
function Hero({ t }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">

      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[600px] h-[600px] rounded-full
                        bg-gradient-to-r from-gold-600/10 to-navy-800/0 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px]
                        bg-navy-800/40 rounded-full blur-3xl" />
        {/* Decorative dots */}
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute w-px h-px bg-gold-400 rounded-full opacity-30"
            style={{
              top:  `${10 + (i * 4.5)}%`,
              left: `${5  + ((i * 7.3) % 90)}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* Cross + App Name */}
        <div className="flex flex-col items-center gap-6 mb-10">
          <div className="animate-float">
            <CrossIcon size={72} />
          </div>

          <div className="space-y-4"
            style={{ animation: 'fadeUp 0.7s ease 0.1s both' }}>
            <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl
                           text-cream leading-tight">
              {t('heroTitle')}
            </h1>
            <p className="font-display italic text-gold-400 text-2xl sm:text-3xl">
              "{t('heroTagline')}"
            </p>
          </div>

          <p className="text-cream/60 text-lg max-w-xl leading-relaxed"
            style={{ animation: 'fadeUp 0.7s ease 0.3s both' }}>
            {t('heroDesc')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mt-2"
            style={{ animation: 'fadeUp 0.7s ease 0.5s both' }}>
            <Link to="/dashboard" className="btn-primary text-base px-8 py-4">
              Continue as Guest <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-8 py-4">
              Mentor / Admin Login
            </Link>
          </div>
          <p className="text-cream/35 text-xs mt-2"
            style={{ animation: 'fadeUp 0.7s ease 0.6s both' }}>
            No account needed to read devotionals, prayers &amp; teachings.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mt-16"
          style={{ animation: 'fadeUp 0.7s ease 0.7s both' }}>
          {[
            { value: '365',  label: 'Days of content' },
            { value: '2',    label: 'Languages' },
            { value: '100%', label: 'Free to start' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="font-display font-bold text-3xl text-gold-400">{s.value}</div>
              <div className="text-cream/40 text-xs mt-1 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-px h-12 bg-gradient-to-b from-gold-500/0 via-gold-500/50 to-gold-500/0 mx-auto" />
      </div>
    </section>
  )
}

// ── FEATURES ─────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: BookOpen,   key: ['feat1Title', 'feat1Desc'], color: 'from-gold-600/20 to-gold-500/5' },
  { icon: Heart,      key: ['feat2Title', 'feat2Desc'], color: 'from-blue-600/20  to-blue-500/5' },
  { icon: PenLine,    key: ['feat3Title', 'feat3Desc'], color: 'from-emerald-600/20 to-emerald-500/5' },
  { icon: TrendingUp, key: ['feat4Title', 'feat4Desc'], color: 'from-purple-600/20 to-purple-500/5' },
  { icon: Bell,       key: ['feat5Title', 'feat5Desc'], color: 'from-orange-600/20 to-orange-500/5' },
  { icon: BarChart2,  key: ['feat6Title', 'feat6Desc'], color: 'from-pink-600/20  to-pink-500/5' },
  { icon: Globe,      key: ['feat7Title', 'feat7Desc'], color: 'from-teal-600/20  to-teal-500/5' },
]

function Features({ t }) {
  return (
    <section id="features" className="py-28 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <SectionLabel>Features</SectionLabel>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-cream mt-4">
            {t('featuresTitle')}
          </h2>
          <p className="text-cream/50 mt-4 max-w-xl mx-auto">{t('featuresSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, key, color }, i) => (
            <div key={i}
              className={`glass p-6 hover:border-gold-500/30 transition-all duration-300
                          hover:-translate-y-1 hover:shadow-lg hover:shadow-gold-500/5
                          glow-gold-hover group cursor-default`}>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color}
                               flex items-center justify-center mb-5
                               group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={20} className="text-gold-400" />
              </div>
              <h3 className="font-display font-semibold text-cream text-lg mb-2">{t(key[0])}</h3>
              <p className="text-cream/50 text-sm leading-relaxed">{t(key[1])}</p>
            </div>
          ))}

          {/* CTA card */}
          <div className="glass-gold p-6 flex flex-col justify-between">
            <p className="font-display italic text-gold-300 text-xl leading-relaxed">
              "Begin your journey today."
            </p>
            <Link to="/dashboard" className="btn-primary mt-6 justify-center">
              Start Reading <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── DAILY FLOW ────────────────────────────────────────────────────────────────
function DailyFlow({ t }) {
  const phases = [
    {
      icon:  Sun,
      timeKey: 'morning',
      itemsKey:'morningItems',
      color: 'text-amber-400',
      bg:    'from-amber-500/15 to-amber-500/5',
      border:'border-amber-500/20',
    },
    {
      icon:  CloudSun,
      timeKey: 'midday',
      itemsKey:'middayItems',
      color: 'text-sky-400',
      bg:    'from-sky-500/15 to-sky-500/5',
      border:'border-sky-500/20',
    },
    {
      icon:  Moon,
      timeKey: 'evening',
      itemsKey:'eveningItems',
      color: 'text-indigo-400',
      bg:    'from-indigo-500/15 to-indigo-500/5',
      border:'border-indigo-500/20',
    },
  ]

  return (
    <section id="daily-flow" className="py-28 px-4 bg-navy-950/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <SectionLabel>Daily Flow</SectionLabel>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-cream mt-4">
            {t('flowTitle')}
          </h2>
          <p className="text-cream/50 mt-4 max-w-xl mx-auto">{t('flowSubtitle')}</p>
        </div>

        {/* Timeline row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-px
                          bg-gradient-to-r from-amber-500/30 via-sky-500/30 to-indigo-500/30 z-0" />

          {phases.map(({ icon: Icon, timeKey, itemsKey, color, bg, border }, i) => (
            <div key={i} className={`glass border ${border} p-8 relative z-10 group
                                     hover:border-opacity-60 transition-all duration-300`}>
              {/* Time bubble */}
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${bg}
                               border ${border} flex items-center justify-center mb-6
                               group-hover:scale-110 transition-transform`}>
                <Icon size={22} className={color} />
              </div>

              {/* Step number */}
              <div className="absolute top-4 right-4 w-7 h-7 rounded-full glass
                              flex items-center justify-center text-xs text-cream/40">
                {i + 1}
              </div>

              <h3 className={`font-display font-bold text-2xl ${color} mb-5`}>
                {t(timeKey)}
              </h3>

              <ul className="space-y-3">
                {(t(itemsKey) || []).map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-cream/65 text-sm">
                    <ChevronRight size={14} className="text-gold-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── WHY THIS APP ──────────────────────────────────────────────────────────────
function WhySection() {
  const pillars = [
    {
      icon:  Shield,
      title: 'Discipline',
      desc:  'Spiritual discipline is not about perfection — it is about showing up. Every day with Christ is a day of growth.',
      color: 'text-gold-400',
    },
    {
      icon:  CheckCircle2,
      title: 'Consistency',
      desc:  'A little every day transforms a life. We guide you to build habits that last, not moments that fade.',
      color: 'text-emerald-400',
    },
    {
      icon:  TrendingUp,
      title: 'Spiritual Growth',
      desc:  'Move from knowing about God to knowing God personally — through scripture, prayer, and real-life application.',
      color: 'text-sky-400',
    },
    {
      icon:  Flame,
      title: 'Practical Living',
      desc:  'Faith without works is dead. This app connects your spiritual life to your decisions, relationships, and purpose.',
      color: 'text-orange-400',
    },
  ]

  return (
    <section className="py-28 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionLabel>Why This App</SectionLabel>
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-cream mt-4 mb-6">
              Built for Real Change,{' '}
              <span className="text-gold-400 italic">Not Just Content</span>
            </h2>
            <p className="text-cream/55 leading-relaxed mb-8">
              Most faith apps give you content. Today with Christ gives you a system —
              a daily structure designed to turn spiritual knowledge into lived transformation.
            </p>
            <Link to="/dashboard" className="btn-primary">
              Start Reading <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pillars.map(({ icon: Icon, title, desc, color }, i) => (
              <div key={i} className="glass p-6 hover:border-gold-500/20 transition-all duration-300">
                <Icon size={24} className={`${color} mb-4`} />
                <h3 className="font-display font-semibold text-cream text-lg mb-2">{title}</h3>
                <p className="text-cream/45 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── TESTIMONIALS ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name:   'Natasha M.',
    role:   'University Student, Lusaka',
    text:   'I used to struggle to pray consistently. This app changed that. I have not missed a day in 3 weeks.',
    stars:  5,
  },
  {
    name:   'Pastor David C.',
    role:   'Church Leader, Ndola',
    text:   'I recommend this to my congregation. The Bemba support makes it accessible to everyone. Very well done.',
    stars:  5,
  },
  {
    name:   'Grace K.',
    role:   'Accountant, Kitwe',
    text:   'The evening reflection questions are simple but powerful. They make me think about my day differently.',
    stars:  5,
  },
]

function Testimonials() {
  return (
    <section className="py-28 px-4 bg-navy-950/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <SectionLabel>Testimonials</SectionLabel>
          <h2 className="font-display font-bold text-4xl text-cream mt-4">
            Stories of Growth
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="glass p-7 hover:border-gold-500/25 transition-all duration-300 flex flex-col gap-5">
              <div className="flex gap-0.5">
                {[...Array(t.stars)].map((_, j) => (
                  <Star key={j} size={14} className="text-gold-400 fill-gold-400" />
                ))}
              </div>
              <p className="font-display italic text-cream/80 leading-relaxed flex-1">
                "{t.text}"
              </p>
              <div>
                <div className="font-bold text-cream text-sm">{t.name}</div>
                <div className="text-cream/40 text-xs">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── FOOTER ────────────────────────────────────────────────────────────────────
function Footer({ t }) {
  return (
    <footer className="py-16 px-4 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <CrossIcon size={36} />
              <span className="font-display font-bold text-gold-400">Today with Christ</span>
            </div>
            <p className="text-cream/40 text-sm leading-relaxed max-w-xs">
              A daily spiritual growth platform for believers seeking to build lasting habits of faith, prayer, and reflection.
            </p>
            {/* Social placeholders */}
            <div className="flex gap-3 mt-5">
              {['Facebook', 'Instagram', 'Twitter'].map(s => (
                <div key={s} className="w-9 h-9 glass rounded-lg flex items-center justify-center
                                        text-cream/30 text-xs cursor-not-allowed">
                  {s[0]}
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <div className="text-gold-400 text-xs font-bold tracking-widest uppercase mb-4">Navigate</div>
            <ul className="space-y-2.5">
              {[
                ['Home', '/'],
                ['Features', '#features'],
                ['Daily Flow', '#daily-flow'],
                ['Login', '/login'],
                ['Register', '/register'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link to={href} className="text-cream/40 hover:text-gold-400 text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Language */}
          <div>
            <div className="text-gold-400 text-xs font-bold tracking-widest uppercase mb-4">Language</div>
            <ul className="space-y-2.5 text-cream/40 text-sm">
              <li>English</li>
              <li>Bemba (Icibemba)</li>
            </ul>
            <div className="mt-5">
              <div className="text-gold-400 text-xs font-bold tracking-widest uppercase mb-2">Contact</div>
              <p className="text-cream/40 text-sm">hello@todaywithchrist.app</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row justify-between gap-3">
          <p className="text-cream/25 text-xs">
            © {new Date().getFullYear()} Today with Christ. All rights reserved.
          </p>
          <p className="text-cream/25 text-xs">
            Built with faith and purpose 🙏
          </p>
        </div>
      </div>
    </footer>
  )
}

// ── MAIN PAGE EXPORT ──────────────────────────────────────────────────────────
export default function Landing() {
  const { t } = useLanguage()

  // landing-page class locks the dark navy look regardless of light/dark mode toggle
  return (
    <div className="landing-page min-h-screen">
      <Hero t={t} />
      <Features t={t} />
      <DailyFlow t={t} />
      <WhySection />
      <Testimonials />
      <Footer t={t} />
    </div>
  )
}
