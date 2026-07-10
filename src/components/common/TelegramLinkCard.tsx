/**
 * components/common/TelegramLinkCard.tsx
 * Telegram bildirishnomасини ulash/uzish + tur bo'yicha yoqib/o'chirish.
 * Barcha rollar uchun (admin/o'qituvchi/talaba) — settings/profil sahifasiga qo'yiladi.
 * Dizaynга mos, dark-mode, i18n (inline uz/ru/en). Mavjud RPC'larни ishlatadi:
 *   telegram_start_link · telegram_set_prefs · telegram_unlink  (migration 044)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Send, Check, Loader2, Link2, Unlink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'

const BOT = 'yordamchi_ai_bildirishnoma_bot'

const sb = supabase as unknown as {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>
  from: (t: string) => any
}

type Lang = 'uz' | 'ru' | 'en'
const TR: Record<Lang, Record<string, string>> = {
  uz: { title: 'Telegram bildirishnoma', desc: 'Muhim xabarlarni Telegram orqali oling', connect: 'Telegramni ulash', connected: 'Ulangan', disconnect: 'Uzish', waiting: "Botda «Start» bosing…", prefs: 'Qaysi bildirishnomalar', hint: "Bot ochilib «Start» bosganingizdan so'ng shu yerga qayting." },
  ru: { title: 'Telegram-уведомления', desc: 'Получайте важные сообщения в Telegram', connect: 'Подключить Telegram', connected: 'Подключено', disconnect: 'Отключить', waiting: 'Нажмите «Start» в боте…', prefs: 'Какие уведомления', hint: 'После нажатия «Start» вернитесь сюда.' },
  en: { title: 'Telegram notifications', desc: 'Get important updates on Telegram', connect: 'Connect Telegram', connected: 'Connected', disconnect: 'Disconnect', waiting: 'Press “Start” in the bot…', prefs: 'Which notifications', hint: 'After pressing “Start”, come back here.' },
}

const EVENTS: Record<string, { key: string; uz: string; ru: string; en: string }[]> = {
  student: [
    { key: 'new_assignment', uz: 'Yangi topshiriq', ru: 'Новое задание',   en: 'New assignment' },
    { key: 'grade',          uz: 'Baho / tekshiruv', ru: 'Оценка',          en: 'Grade / review' },
    { key: 'attendance',     uz: 'Davomat',          ru: 'Посещаемость',    en: 'Attendance' },
    { key: 'deadline',       uz: 'Muddat eslatmasi', ru: 'Напоминание',     en: 'Deadline reminder' },
  ],
  teacher: [
    { key: 'submission',  uz: 'Topshiriq yuborildi', ru: 'Работа сдана',   en: 'Submission received' },
    { key: 'new_student', uz: 'Yangi talaba',        ru: 'Новый ученик',   en: 'New student' },
  ],
  admin: [
    { key: 'new_member', uz: "Yangi a'zo",     ru: 'Новый участник', en: 'New member' },
    { key: 'payment',    uz: "To'lov holati",  ru: 'Статус оплаты',  en: 'Payment status' },
  ],
}

export function TelegramLinkCard({ glass = false }: { glass?: boolean }) {
  const { language } = useLanguage()
  const lang = (['uz', 'ru', 'en'].includes(language) ? language : 'uz') as Lang
  const t = TR[lang]
  const g = glass
  const cls = {
    wrap:      g ? 'rounded-[20px] p-5' : 'bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm',
    title:     g ? 'text-white' : 'text-gray-900 dark:text-gray-100',
    desc:      g ? 'text-white/50' : 'text-gray-500 dark:text-gray-400',
    prefs:     g ? 'text-white/50' : 'text-gray-500 dark:text-gray-400',
    toggleRow: g ? 'text-white/85 border-white/10 hover:bg-white/5' : 'text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40',
    hint:      g ? 'text-white/40' : 'text-gray-400 dark:text-gray-500',
    trackOff:  g ? 'bg-white/20' : 'bg-gray-300 dark:bg-gray-600',
  }
  const wrapStyle = g ? { background: 'rgba(11,15,28,0.82)', border: '1px solid rgba(255,255,255,0.08)' } : undefined
  const auth = useAuth()
  const role = auth.user?.role === 'teacher' ? 'teacher' : auth.user?.role === 'student' ? 'student' : 'admin'
  const events = EVENTS[role] ?? EVENTS.student

  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState<string | null>(null)
  const [linked, setLinked] = useState(false)
  const [prefs, setPrefs] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const pollRef = useRef<number | null>(null)

  const load = useCallback(async (): Promise<boolean> => {
    try {
      const { data } = await sb.from('telegram_links').select('chat_id, tg_username, prefs').maybeSingle()
      const isLinked = !!data?.chat_id
      setLinked(isLinked); setUsername(data?.tg_username ?? null); setPrefs(data?.prefs ?? {})
      return isLinked
    } catch { return false } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    void load()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [load])

  async function connect() {
    setBusy(true)
    try {
      const { data } = await sb.rpc('telegram_start_link')
      const code = typeof data === 'string' ? data : ''
      if (!code) return
      window.open(`https://t.me/${BOT}?start=${code}`, '_blank', 'noopener')
      setWaiting(true)
      let tries = 0
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = window.setInterval(async () => {
        const ok = await load()
        if (ok || ++tries > 20) { if (pollRef.current) clearInterval(pollRef.current); setWaiting(false) }
      }, 3000)
    } finally { setBusy(false) }
  }

  async function disconnect() {
    setBusy(true)
    try { await sb.rpc('telegram_unlink'); setLinked(false); setUsername(null) } finally { setBusy(false) }
  }

  async function toggle(key: string) {
    const next = { ...prefs, [key]: prefs[key] === false }  // false→true, true/undefined→false
    setPrefs(next)
    await sb.rpc('telegram_set_prefs', { p_prefs: next })
  }

  return (
    <div className={cls.wrap} style={wrapStyle}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#2AABEE,#229ED9)' }}>
          <Send className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className={`text-base font-bold ${cls.title}`}>{t.title}</p>
          <p className={`text-xs ${cls.desc}`}>{t.desc}</p>
        </div>
        {linked && (
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Check className="w-3 h-3" /> {t.connected}{username ? ` · @${username}` : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div className={`h-10 rounded-xl animate-pulse ${g ? 'bg-white/5' : 'bg-gray-50 dark:bg-gray-700'}`} />
      ) : !linked ? (
        <>
          <button type="button" onClick={() => void connect()} disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#2AABEE,#229ED9)' }}>
            {busy || waiting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            {waiting ? t.waiting : t.connect}
          </button>
          {waiting && <p className={`text-[11px] mt-2 ${cls.hint}`}>{t.hint}</p>}
        </>
      ) : (
        <div className="space-y-3">
          <p className={`text-xs font-semibold uppercase tracking-wide ${cls.prefs}`}>{t.prefs}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {events.map(ev => {
              const on = prefs[ev.key] !== false
              return (
                <button key={ev.key} type="button" onClick={() => void toggle(ev.key)}
                  className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-sm transition-colors ${cls.toggleRow}`}>
                  <span>{ev[lang]}</span>
                  <span className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${on ? 'bg-emerald-500' : cls.trackOff}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${on ? 'left-4' : 'left-0.5'}`} />
                  </span>
                </button>
              )
            })}
          </div>
          <button type="button" onClick={() => void disconnect()} disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />} {t.disconnect}
          </button>
        </div>
      )}
    </div>
  )
}
