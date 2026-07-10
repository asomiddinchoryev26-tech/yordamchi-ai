/**
 * pages/student/SettingsPage.tsx
 * Talaba sozlamalari — Profil · Afzalliklar (til) · Ko'rinish · Bildirishnomalar ·
 * Xavfsizlik. YordamchiAI dizayn tili (dark glass, blue/purple gradient, glow).
 *
 * ⚠️ Faqat UI + mavjud klient holati (useLanguage / useTheme / useProfile).
 * Backend, Auth, Supabase, Payment — tegilmagan.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Settings, User, Globe, Moon, Bell, Shield, Sparkles, ChevronRight, Check, KeyRound,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage, type Language } from '@/contexts/LanguageContext'
import { UserAvatar } from '@/components/identity'
import { TelegramLinkCard } from '@/components/common/TelegramLinkCard'
import { PATHS } from '@/routes/paths'

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
}

const LANGS: { code: Language; label: string; flag: string }[] = [
  { code: 'uz', label: "O'zbek",  flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
]

// ── Section shell ─────────────────────────────────────────────────────────────
function Section({ icon, tone, title, children }: {
  icon: React.ReactNode; tone: string; title: string; children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl p-4 sm:p-5" style={GLASS}>
      <div className="flex items-center gap-2.5 mb-3.5">
        <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${tone}22`, border: `1px solid ${tone}44` }}>
          <span style={{ color: tone }}>{icon}</span>
        </span>
        <h2 className="text-[14px] font-bold text-white/90">{title}</h2>
      </div>
      {children}
    </section>
  )
}

// ── Toggle switch (client-only, visual) ───────────────────────────────────────
function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onChange}
      className="w-11 h-6 rounded-full relative flex-shrink-0 transition-colors duration-200"
      style={{ background: on ? 'linear-gradient(135deg,#5B7FFF,#7C3AED)' : 'rgba(255,255,255,0.14)' }}>
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
        style={{ left: on ? 22 : 2 }} aria-hidden="true" />
    </button>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-1 first:pt-0 last:pb-0">
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const auth = useAuth()
  const { profile } = useProfile()
  const { theme } = useTheme()
  const { t, language, setLanguage } = useLanguage()

  // Client-only bildirishnoma sozlamalari (backend'siz)
  const [reminders, setReminders] = useState(true)
  const [aiUpdates, setAiUpdates] = useState(true)

  const userName = profile?.fullName ?? auth.user?.name ?? t.studentRole
  const email    = profile?.email    ?? auth.user?.email ?? '—'

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#93BBFF]" aria-hidden="true" /> {t.settings}
        </h1>
        <p className="text-sm text-white/50 mt-0.5">{t.setSubtitle}</p>
      </div>

      {/* 1. Profile */}
      <Section icon={<User className="w-4 h-4" />} tone="#5B7FFF" title={t.profile}>
        <div className="flex items-center gap-3">
          <UserAvatar name={userName} avatarUrl={profile?.avatarUrl} size="lg" />
          <div className="min-w-0">
            <p className="text-white font-semibold truncate">{userName}</p>
            <p className="text-white/50 text-[13px] truncate">{email}</p>
          </div>
          <Link to={PATHS.STUDENT.PROFILE}
            className="ml-auto flex items-center gap-1 text-[12px] font-semibold text-[#93BBFF] hover:text-white transition-colors flex-shrink-0">
            {t.setEdit} <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </Section>

      {/* 2. Preferences — language */}
      <Section icon={<Globe className="w-4 h-4" />} tone="#22D3EE" title={t.setPreferences}>
        <p className="text-white/55 text-[12px] mb-2">{t.language}</p>
        <div className="grid grid-cols-3 gap-2">
          {LANGS.map(l => {
            const active = language === l.code
            return (
              <button key={l.code} type="button" onClick={() => setLanguage(l.code)}
                className="relative py-2.5 rounded-xl text-[12.5px] font-semibold flex items-center justify-center gap-1.5 transition-all"
                style={active
                  ? { background: 'linear-gradient(135deg,rgba(91,127,255,0.28),rgba(124,58,237,0.28))', border: '1px solid rgba(147,187,255,0.5)', color: '#fff' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                <span className="text-[15px] leading-none">{l.flag}</span>{l.label}
                {active && <Check className="w-3 h-3 text-[#93BBFF] absolute top-1.5 right-1.5" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      </Section>

      {/* 3. Appearance */}
      <Section icon={<Moon className="w-4 h-4" />} tone="#818CF8" title={t.setAppearance}>
        <Row>
          <Moon className="w-4 h-4 text-white/60" aria-hidden="true" />
          <span className="text-[13.5px] text-white/85 flex-1">{t.setDarkOn}</span>
          {theme === 'dark' && (
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#34D399', boxShadow: '0 0 8px #34D399' }} aria-hidden="true" />
          )}
        </Row>
        <div className="h-px my-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <Row>
          <Sparkles className="w-4 h-4 text-[#A78BFA]" aria-hidden="true" />
          <span className="text-[13.5px] text-white/85 flex-1">{t.setPremiumTheme}</span>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)' }}>PREMIUM</span>
        </Row>
      </Section>

      {/* 4. Notifications */}
      <Section icon={<Bell className="w-4 h-4" />} tone="#F5C542" title={t.notifications}>
        <Row>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] text-white/85">{t.setReminders}</p>
            <p className="text-[11px] text-white/45 mt-0.5">{t.setRemindersDesc}</p>
          </div>
          <Toggle on={reminders} onChange={() => setReminders(v => !v)} label={t.setReminders} />
        </Row>
        <div className="h-px my-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <Row>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] text-white/85">{t.setAiUpdates}</p>
            <p className="text-[11px] text-white/45 mt-0.5">{t.setAiUpdatesDesc}</p>
          </div>
          <Toggle on={aiUpdates} onChange={() => setAiUpdates(v => !v)} label={t.setAiUpdates} />
        </Row>
      </Section>

      {/* 4b. Telegram bildirishnoma (glass — talaba dizayniga mos) */}
      <TelegramLinkCard glass />

      {/* 5. Security */}
      <Section icon={<Shield className="w-4 h-4" />} tone="#34D399" title={t.setSecurity}>
        <Link to={PATHS.STUDENT.PROFILE} className="flex items-center gap-3 py-2.5 px-1 rounded-lg hover:bg-white/[0.04] transition-colors">
          <KeyRound className="w-4 h-4 text-white/60" aria-hidden="true" />
          <span className="text-[13.5px] text-white/85 flex-1">{t.setChangePassword}</span>
          <ChevronRight className="w-4 h-4 text-white/35" aria-hidden="true" />
        </Link>
        <div className="h-px my-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <Row>
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#34D399', boxShadow: '0 0 8px #34D399' }} aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] text-white/85">{t.setActiveSession}</p>
            <p className="text-[11px] text-white/45 mt-0.5 truncate">{t.setSessionDesc}</p>
          </div>
        </Row>
      </Section>
    </div>
  )
}
