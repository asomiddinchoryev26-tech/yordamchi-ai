/**
 * components/student/NotificationsBell.tsx
 * Bildirishnomalar qo'ng'irog'i + panel. Mavjud notification.service + notifications
 * jadvaliga ulanadi (yangi logika yaratilmaydi). Har qanday sahifaga qo'shsa bo'ladi.
 * YordamchiAI dizayn tili (dark glass, gradient, glow).
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCheck, ClipboardList, Award, Clock, FileText, Sparkles } from 'lucide-react'
import { notificationService } from '@/services/notification.service'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'
import type { NotificationRow } from '@/types/database.types'

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]

// Ikonka turi bo'yicha (kelajakdagi turlar uchun ham fallback bor)
function iconFor(type: string): { Icon: typeof Bell; color: string } {
  if (type.startsWith('assignment')) return { Icon: ClipboardList, color: '#F59E0B' }
  if (type.includes('graded') || type.includes('result')) return { Icon: Award, color: '#22C55E' }
  if (type.includes('deadline')) return { Icon: Clock, color: '#EF4444' }
  if (type.includes('lesson')) return { Icon: FileText, color: '#5B7FFF' }
  if (type.includes('premium')) return { Icon: Sparkles, color: '#A78BFA' }
  return { Icon: Bell, color: '#93BBFF' }
}

function timeAgo(iso: string, t: Translations): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return t.notifNow
  if (s < 3600) return `${Math.floor(s / 60)} ${t.notifMinAgo}`
  if (s < 86400) return `${Math.floor(s / 3600)} ${t.notifHourAgo}`
  return `${Math.floor(s / 86400)} ${t.notifDayAgo}`
}

export default function NotificationsBell() {
  const auth = useAuth()
  const { t } = useLanguage()
  const [open, setOpen]     = useState(false)
  const [items, setItems]   = useState<NotificationRow[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async () => {
    try { setUnread(await notificationService.unreadCount()) } catch { /* jadval/RLS */ }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  // Realtime — yangi bildirishnoma kelganda hisoblagichni yangilaymiz
  useEffect(() => {
    const uid = auth.user?.id
    if (!uid) return
    return notificationService.subscribeToOwn(uid, () => { void refresh() })
  }, [auth.user?.id, refresh])

  // Panel ochilganda ro'yxatni yuklaymiz
  useEffect(() => {
    if (!open) return
    setLoading(true)
    notificationService.list(20).then(setItems).catch(() => setItems([])).finally(() => setLoading(false))
  }, [open])

  // Tashqariga bosilganda yopamiz
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const onItemClick = async (n: NotificationRow) => {
    if (!n.read_at) {
      try { await notificationService.markRead(n.id) } catch { /* noop */ }
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
      setUnread(u => Math.max(0, u - 1))
    }
  }
  const markAll = async () => {
    try { await notificationService.markAllRead() } catch { /* noop */ }
    setItems(prev => prev.map(x => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })))
    setUnread(0)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button" onClick={() => setOpen(o => !o)}
        aria-label={t.notifTitle} aria-expanded={open}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B7FFF]/50"
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-black text-white"
            style={{ background: 'linear-gradient(135deg,#EF4444,#F59E0B)', boxShadow: '0 0 8px rgba(239,68,68,0.6)' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="absolute right-0 mt-2 w-[320px] max-w-[86vw] rounded-2xl overflow-hidden z-50"
            style={{ background: 'rgba(13,16,28,0.98)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}
            role="menu"
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[14px] font-bold text-white">{t.notifTitle}</p>
              {items.some(i => !i.read_at) && (
                <button type="button" onClick={() => void markAll()} className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#93BBFF] hover:opacity-80">
                  <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" /> {t.notifMarkAll}
                </button>
              )}
            </div>

            <div className="max-h-[360px] overflow-y-auto">
              {loading ? (
                <p className="text-[12.5px] text-white/35 text-center py-8">{t.notifLoading}</p>
              ) : items.length === 0 ? (
                <div className="text-center py-10">
                  <Bell className="w-7 h-7 text-white/20 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-[12.5px] text-white/35">{t.notifEmpty}</p>
                </div>
              ) : (
                items.map(n => {
                  const { Icon, color } = iconFor(n.type)
                  return (
                    <button key={n.id} type="button" onClick={() => void onItemClick(n)}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04]"
                      style={{ background: n.read_at ? undefined : 'rgba(91,127,255,0.06)' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                        <Icon className="w-4 h-4" style={{ color }} aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-white/90 leading-snug">{n.title}</p>
                        {n.body && <p className="text-[11.5px] text-white/50 leading-snug mt-0.5 line-clamp-2">{n.body}</p>}
                        <p className="text-[10.5px] text-white/30 mt-1">{timeAgo(n.created_at, t)}</p>
                      </div>
                      {!n.read_at && <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: '#5B7FFF' }} aria-hidden="true" />}
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
