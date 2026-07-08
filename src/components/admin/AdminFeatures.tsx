/**
 * components/admin/AdminFeatures.tsx
 * Admin panel qo'shimcha bo'limlari (additiv). Mavjud servislarga ulanadi —
 * dublikat logika yaratilmaydi:
 *   subscription.service (setUserPlan / activePremiumCount / getPlan) ·
 *   adminPermission.service (isSuperAdmin / listAdmins / setPermissions / setStatus).
 *
 * Uslub — mavjud admin dashboard kartalari bilan bir xil (bg-white dark:bg-gray-800),
 * mobil-responsiv, mavjud tema.
 */

import { useState, useEffect, useCallback } from 'react'
import { Crown, Users, Shield, Check, Loader2, Save, Ban, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { subscriptionService, PLAN_LABELS } from '@/services/subscription.service'
import { adminPermissionService } from '@/services/adminPermission.service'
import { ADMIN_PERMISSIONS, ADMIN_PERMISSION_LABELS, type AdminPermission, type AdminListItem } from '@/types/admin.types'
import type { PlanType } from '@/types/lms.types'
import { useLanguage } from '@/contexts/LanguageContext'

const CARD = 'bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5'

// ═══ Premium / user stat cards ═══
export function AdminPremiumStats() {
  const { t } = useLanguage()
  const [premium, setPremium] = useState<number | null>(null)
  const [total, setTotal]     = useState<number | null>(null)

  useEffect(() => {
    void subscriptionService.activePremiumCount().then(setPremium)
    void (async () => {
      try {
        const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
        setTotal(count ?? 0)
      } catch { setTotal(0) }
    })()
  }, [])

  const free = total !== null && premium !== null ? Math.max(0, total - premium) : null
  const cards = [
    { label: t.admFaolPremium, value: premium, Icon: Crown, color: 'text-amber-500' },
    { label: t.admFree,        value: free,    Icon: Users, color: 'text-blue-500' },
  ]
  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map(c => (
        <div key={c.label} className={CARD}>
          <div className="flex items-center gap-2">
            <c.Icon className={`w-4 h-4 ${c.color}`} />
            <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1 tabular-nums">{c.value ?? '…'}</p>
        </div>
      ))}
    </div>
  )
}

// ═══ Premium manager (foydalanuvchi rejasini o'zgartirish) — Users page uchun tayyor ═══
export function AdminPremiumManager({ userId, userName, onDone }: { userId: string; userName?: string; onDone?: () => void }) {
  const { t } = useLanguage()
  const [plan, setPlan]   = useState<PlanType>('free')
  const [start, setStart] = useState('')
  const [end, setEnd]     = useState('')
  const [busy, setBusy]   = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { void subscriptionService.getPlan(userId).then(setPlan) }, [userId])

  const save = async () => {
    setBusy(true); setSaved(false)
    try {
      await subscriptionService.setUserPlan(userId, plan, {
        startDate: start ? new Date(start).toISOString() : undefined,
        endDate:   end ? new Date(end).toISOString() : null,
      })
      setSaved(true); onDone?.()
    } finally { setBusy(false) }
  }

  return (
    <div className={CARD}>
      <div className="flex items-center gap-2 mb-3">
        <Crown className="w-4 h-4 text-amber-500" />
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{t.admPremiumMgmt}{userName ? ` — ${userName}` : ''}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">{t.admPlan}</label>
          <select value={plan} onChange={e => setPlan(e.target.value as PlanType)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100">
            {(['free', 'premium', 'education'] as PlanType[]).map(p => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">{t.admStart}</label>
          <input type="date" value={start} onChange={e => setStart(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100" />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">{t.admEnd}</label>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100" />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <button type="button" onClick={() => void save()} disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)' }}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t.admSave}
        </button>
        {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> {t.admSaved}</span>}
      </div>
    </div>
  )
}

// ═══ Permissions panel (faqat Super Admin) ═══
export function AdminPermissionsPanel({ currentUserId }: { currentUserId: string }) {
  const { t } = useLanguage()
  const [isSuper, setIsSuper] = useState<boolean | null>(null)
  const [admins, setAdmins]   = useState<AdminListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, Set<AdminPermission>>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const su = await adminPermissionService.isSuperAdmin(currentUserId)
    setIsSuper(su)
    if (su) {
      const list = await adminPermissionService.listAdmins()
      setAdmins(list)
      setDraft(Object.fromEntries(list.map(a => [a.adminId, new Set(a.permissions)])))
    }
    setLoading(false)
  }, [currentUserId])
  useEffect(() => { void load() }, [load])

  if (isSuper === false) return null // faqat super admin ko'radi
  if (loading) return <div className={`${CARD} h-24 animate-pulse`} />

  const toggle = (adminId: string, perm: AdminPermission) => {
    setDraft(prev => {
      const set = new Set(prev[adminId] ?? [])
      set.has(perm) ? set.delete(perm) : set.add(perm)
      return { ...prev, [adminId]: set }
    })
  }
  const save = async (adminId: string) => {
    setSavingId(adminId)
    try { await adminPermissionService.setPermissions(adminId, [...(draft[adminId] ?? [])], currentUserId) }
    finally { setSavingId(null) }
  }
  const toggleStatus = async (a: AdminListItem) => {
    const next = a.status === 'active' ? 'disabled' : 'active'
    await adminPermissionService.setStatus(a.adminId, next)
    setAdmins(prev => prev.map(x => x.adminId === a.adminId ? { ...x, status: next } : x))
  }

  return (
    <div className={CARD}>
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-violet-500" />
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{t.admPermissions}</h2>
        <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300">{t.admSuperAdmin}</span>
      </div>

      {admins.length === 0 ? (
        <p className="text-sm text-gray-400">{t.admNoOtherAdmins}</p>
      ) : (
        <div className="space-y-4">
          {admins.map(a => (
            <div key={a.adminId} className="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{a.name}</p>
                <span className="text-xs text-gray-400">{a.email}</span>
                {a.isSuper && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 inline-flex items-center gap-1"><Crown className="w-3 h-3" /> {t.admSuper}</span>}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${a.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/40 text-red-500'}`}>{a.status === 'active' ? t.admActive : t.admDisabled}</span>
              </div>

              {!a.isSuper && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ADMIN_PERMISSIONS.map(perm => {
                      const on = draft[a.adminId]?.has(perm) ?? false
                      return (
                        <button key={perm} type="button" onClick={() => toggle(a.adminId, perm)}
                          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11.5px] font-medium border transition-colors ${on ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300' : 'bg-gray-50 dark:bg-gray-700/40 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}>
                          {on ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 inline-block rounded-sm border border-current opacity-40" />}
                          {ADMIN_PERMISSION_LABELS[perm]}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button type="button" onClick={() => void save(a.adminId)} disabled={savingId === a.adminId}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)' }}>
                      {savingId === a.adminId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {t.admSave}
                    </button>
                    <button type="button" onClick={() => void toggleStatus(a)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <Ban className="w-3.5 h-3.5" /> {a.status === 'active' ? t.admDisable : t.admActivate}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
