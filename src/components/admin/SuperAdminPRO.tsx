/**
 * components/admin/SuperAdminPRO.tsx
 * Super Admin PRO paneli (additiv). Mavjud servislarni qayta ishlatadi —
 * dublikat komponent/servis yo'q:
 *   systemHealth · paymentAdmin · announcement · promoCode · activityLog ·
 *   adminPermission · subscription. Dashboard uslubida, mobil-responsiv.
 *   Faqat Super Admin (is_super_admin) ko'radi.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Activity, Crown, Megaphone, Ticket, HeartPulse, CreditCard, Loader2, Send,
  Plus, Check, Search, X, Receipt, Building2, Globe, Ban, Power, Users, Wallet, Trash2, UserPlus,
} from 'lucide-react'
import { systemHealthService, type SystemHealth } from '@/services/systemHealth.service'
import { platformService, type PlatformStats, type OrgRow, type OrgPlan, type OrgType, type PlatformUser } from '@/services/platform.service'
import { paymentAdminService, type PaymentStats, type PaymentRow, type PaymentRecord } from '@/services/paymentAdmin.service'
import { announcementService, ANNOUNCEMENT_TARGETS, type AnnouncementTarget } from '@/services/announcement.service'
import { promoCodeService, type PromoCodeRow, type PromoDiscountType } from '@/services/promoCode.service'
import { activityLogService, type ActivityLogView } from '@/services/activityLog.service'
import { adminPermissionService } from '@/services/adminPermission.service'
import { AdminPremiumStats, AdminPermissionsPanel, AdminPremiumManager } from '@/components/admin/AdminFeatures'
import { useLanguage } from '@/contexts/LanguageContext'

const CARD = 'bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5'
const INPUT = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100'
const BTN = 'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50'
const BTN_BG = { background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)' }

function Head({ Icon, title, color }: { Icon: typeof Crown; title: string; color: string }) {
  return <div className="flex items-center gap-2 mb-3"><Icon className={`w-4 h-4 ${color}`} /><h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h2></div>
}

// ═══ Platform Overview — butun tizim bo'yicha raqamlar ═══
function PlatformOverview() {
  const { t } = useLanguage()
  const [s, setS] = useState<PlatformStats | null>(null)
  useEffect(() => { void platformService.stats().then(setS) }, [])
  const fmt = (n: number) => n.toLocaleString('uz-UZ')
  const cards = [
    { l: t.saStatOrgs,    v: s ? fmt(s.organizations) : '…',              Icon: Building2, c: 'text-blue-500' },
    { l: t.saStatUsers,   v: s ? fmt(s.total_users) : '…',               Icon: Users,     c: 'text-violet-500' },
    { l: t.saStatPaid,    v: s ? fmt(s.paid_orgs) : '…',                 Icon: Crown,     c: 'text-amber-500' },
    { l: t.saStatRevenue, v: s ? `${fmt(s.total_revenue)} ${t.saSum}` : '…', Icon: Wallet, c: 'text-emerald-500' },
  ]
  return (
    <div className={`${CARD} bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-gray-800 dark:to-gray-800`}>
      <Head Icon={Globe} title={t.saPlatform} color="text-indigo-500" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {cards.map(c => (
          <div key={c.l} className="rounded-xl bg-white/80 dark:bg-gray-800/70 p-3.5">
            <c.Icon className={`w-4 h-4 mb-1.5 ${c.c}`} />
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{c.v}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{c.l}</p>
          </div>
        ))}
      </div>
      {s && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11px] text-gray-500 dark:text-gray-400">
          <span>🎓 {fmt(s.students)} {t.saStudentsShort}</span>
          <span>👨‍🏫 {fmt(s.teachers)} {t.saTeachersShort}</span>
          <span>🛡️ {fmt(s.admins)} admin</span>
          {s.pending_payments > 0 && <span className="text-amber-600 dark:text-amber-400 font-semibold">⏳ {fmt(s.pending_payments)} {t.saPendingPayments}</span>}
        </div>
      )}
    </div>
  )
}

// ═══ Organizations Manager — har bir tashkilotni boshqarish ═══
const PLATFORM_ORG_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const PLAN_STYLE: Record<OrgPlan, string> = {
  free:    'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300',
  premium: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
  pro:     'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300',
}
const TYPE_META: Record<OrgType, { label: string; cls: string }> = {
  school:    { label: '🏫 Maktab',   cls: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' },
  institute: { label: '🎓 Institut', cls: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' },
  center:    { label: '🏢 Markaz',   cls: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300' },
}

function OrganizationsManager() {
  const { t } = useLanguage()
  const [orgs, setOrgs] = useState<OrgRow[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPlan, setNewPlan] = useState<OrgPlan>('free')
  const [newType, setNewType] = useState<OrgType>('school')
  const [createBusy, setCreateBusy] = useState(false)
  const load = useCallback(() => { void platformService.listOrganizations().then(setOrgs) }, [])
  useEffect(() => { load() }, [load])

  const changePlan = async (o: OrgRow, plan: OrgPlan) => {
    if (plan === o.plan_type) return
    setBusyId(o.id)
    try { await platformService.setOrgPlan(o.id, plan, 1); load() }
    catch { /* holat o'zgarmaydi */ } finally { setBusyId(null) }
  }
  const toggleStatus = async (o: OrgRow) => {
    setBusyId(o.id)
    try { await platformService.setOrgStatus(o.id, o.status === 'active' ? 'suspended' : 'active'); load() }
    catch { /* */ } finally { setBusyId(null) }
  }
  const createOrg = async () => {
    if (!newName.trim()) return
    setCreateBusy(true)
    try { await platformService.createOrganization(newName.trim(), newPlan, newType); setNewName(''); setCreating(false); load() }
    catch { /* */ } finally { setCreateBusy(false) }
  }
  const deleteOrg = async (o: OrgRow) => {
    if (!window.confirm(`${o.name}\n\n${t.saDeleteOrgConfirm}`)) return
    setBusyId(o.id)
    try { await platformService.deleteOrganization(o.id); load() }
    catch { window.alert(t.saOrgNotEmptyErr) } finally { setBusyId(null) }
  }

  return (
    <div className={CARD}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <Head Icon={Building2} title={t.saOrgsTitle} color="text-blue-500" />
        <button type="button" onClick={() => setCreating(v => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-[12px] font-semibold flex-shrink-0" style={BTN_BG}>
          {creating ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} {t.saCreateOrg}
        </button>
      </div>
      {creating && (
        <div className="mb-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 flex flex-wrap items-center gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={t.saOrgNamePh}
            className={`${INPUT} flex-1 min-w-[160px]`} />
          <select value={newType} onChange={e => setNewType(e.target.value as OrgType)} className={`${INPUT} w-auto`}>
            <option value="school">🏫 Maktab</option><option value="institute">🎓 Institut</option><option value="center">🏢 Markaz</option>
          </select>
          <select value={newPlan} onChange={e => setNewPlan(e.target.value as OrgPlan)} className={`${INPUT} w-auto`}>
            <option value="free">Free</option><option value="premium">Premium</option><option value="pro">Pro</option>
          </select>
          <button type="button" onClick={() => void createOrg()} disabled={createBusy || !newName.trim()} className={BTN} style={BTN_BG}>
            {createBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {t.saCreate2}
          </button>
        </div>
      )}
      {orgs === null ? <div className="h-24 animate-pulse bg-gray-50 dark:bg-gray-700 rounded-xl" />
        : orgs.length === 0 ? <p className="text-sm text-gray-400">{t.saNoOrgs}</p> : (
        <div className="space-y-2.5">
          {orgs.map(o => {
            const suspended = o.status === 'suspended'
            return (
              <div key={o.id} className={`rounded-xl border p-3.5 ${suspended ? 'border-red-200 bg-red-50/40 dark:border-red-900/40 dark:bg-red-900/10' : 'border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-700/30'}`}>
                <div className="flex items-start gap-2 mb-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{o.name}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${TYPE_META[o.org_type]?.cls ?? TYPE_META.school.cls}`}>{TYPE_META[o.org_type]?.label ?? TYPE_META.school.label}</span>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${PLAN_STYLE[o.plan_type]}`}>{o.plan_type}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${suspended ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
                        {suspended ? t.saSuspended : t.saActiveOrg}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      <span className="font-mono">{o.join_code}</span> · {o.members} {t.saMembers} · 🎓 {o.students} · 👨‍🏫 {o.teachers}
                      {o.plan_expires_at && <> · {new Date(o.plan_expires_at).toLocaleDateString('uz-UZ')} {t.saPlanMonths === 'oy' ? 'gacha' : ''}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button type="button" disabled={busyId === o.id} onClick={() => void toggleStatus(o)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold disabled:opacity-50 ${suspended ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                      {busyId === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : suspended ? <Power className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                      {suspended ? t.saActivate : t.saSuspend}
                    </button>
                    {o.members === 0 && o.id !== PLATFORM_ORG_ID && (
                      <button type="button" disabled={busyId === o.id} onClick={() => void deleteOrg(o)} title={t.saDelete}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 disabled:opacity-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10.5px] text-gray-400 mr-0.5">{t.saApplyPlan}:</span>
                  {(['free', 'premium', 'pro'] as OrgPlan[]).map(pl => (
                    <button key={pl} type="button" disabled={busyId === o.id || pl === o.plan_type} onClick={() => void changePlan(o, pl)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg capitalize disabled:opacity-40 transition-colors ${pl === o.plan_type ? PLAN_STYLE[pl] : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-300'}`}>
                      {pl}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          <p className="text-[11px] text-gray-400 flex items-center gap-1.5 pt-1"><Ban className="w-3 h-3" /> {t.saOrgSuspendedNote}</p>
        </div>
      )}
    </div>
  )
}

// ═══ Platform Users Manager — butun platforma bo'yicha qidirish + bloklash ═══
function roleBadge(r: string): string {
  return r === 'admin'   ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'
       : r === 'teacher' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300'
       :                   'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
}

function PlatformUsersManager() {
  const { t } = useLanguage()
  const [q, setQ] = useState('')
  const [users, setUsers] = useState<PlatformUser[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const reload = useCallback((query: string) => { void platformService.searchUsers(query).then(setUsers) }, [])
  useEffect(() => {
    const h = setTimeout(() => reload(q), 350)
    return () => clearTimeout(h)
  }, [q, reload])

  const toggle = async (u: PlatformUser) => {
    setBusyId(u.id)
    try { await platformService.setUserStatus(u.id, u.status === 'suspended' ? 'active' : 'suspended'); reload(q) }
    catch { /* holat o'zgarmaydi */ } finally { setBusyId(null) }
  }

  return (
    <div className={CARD}>
      <Head Icon={Users} title={t.saUsersTitle} color="text-violet-500" />
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={t.saUserSearchPh} className={`${INPUT} pl-9`} />
      </div>
      {users === null ? <div className="h-20 animate-pulse bg-gray-50 dark:bg-gray-700 rounded-xl" />
        : users.length === 0 ? <p className="text-sm text-gray-400">{t.saNoUsers}</p> : (
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {users.map(u => {
            const suspended = u.status === 'suspended'
            return (
              <div key={u.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/40">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {u.full_name || u.email}
                    <span className={`ml-1.5 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${roleBadge(u.role)}`}>{u.role}</span>
                    {suspended && <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300">{t.saSuspended}</span>}
                  </p>
                  <p className="text-[10.5px] text-gray-400 truncate">{u.email} · 🏢 {u.org_name || '—'}</p>
                </div>
                <button type="button" disabled={busyId === u.id} onClick={() => void toggle(u)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold disabled:opacity-50 flex-shrink-0 ${suspended ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                  {busyId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : suspended ? <Power className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                  {suspended ? t.saActivate : t.saSuspend}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══ Yangi admin qo'shish (tanlangan tashkilotга) ═══
function AddAdminSection() {
  const { t } = useLanguage()
  const [orgs, setOrgs]   = useState<OrgRow[]>([])
  const [orgId, setOrgId] = useState('')
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw]       = useState('')
  const [busy, setBusy]   = useState(false)
  const [err, setErr]     = useState<string | null>(null)
  const [done, setDone]   = useState<string | null>(null)

  useEffect(() => { void platformService.listOrganizations().then(setOrgs) }, [])

  const submit = async () => {
    setErr(null); setDone(null)
    if (!orgId)                          { setErr(t.saPickOrg);   return }
    if (!name.trim() || !email.trim())   { setErr(t.saAdminReq);  return }
    if (pw.length < 8)                   { setErr(t.saPwShort8);  return }
    setBusy(true)
    try {
      await platformService.createAdmin(name.trim(), email.trim(), pw, orgId)
      setDone(t.saAdminCreated); setName(''); setEmail(''); setPw('')
      setTimeout(() => setDone(null), 6000)
    } catch (e) { setErr(e instanceof Error ? e.message : t.saAdminErr) }
    finally { setBusy(false) }
  }

  return (
    <div className={CARD}>
      <Head Icon={UserPlus} title={t.saAddAdmin} color="text-emerald-500" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <select value={orgId} onChange={e => setOrgId(e.target.value)} className={INPUT}>
          <option value="">{t.saPickOrg}</option>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <input value={name}  onChange={e => setName(e.target.value)}  placeholder={t.saAdminName}  className={INPUT} />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder={t.saAdminEmail} type="email" autoComplete="off" className={INPUT} />
        <input value={pw}    onChange={e => setPw(e.target.value)}    placeholder={t.saAdminPw}    type="password" autoComplete="new-password" className={INPUT} />
      </div>
      {err  && <p className="text-sm text-red-600 mt-2 flex items-center gap-1.5"><X className="w-4 h-4" /> {err}</p>}
      {done && <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1.5"><Check className="w-4 h-4" /> {done}</p>}
      <button type="button" onClick={() => void submit()} disabled={busy} className={`${BTN} mt-3`} style={BTN_BG}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} {t.saCreateAdminBtn}
      </button>
      <p className="text-[11px] text-gray-400 mt-2">{t.saAddAdminNote}</p>
    </div>
  )
}

// ═══ System Health ═══
function SystemHealthCard() {
  const { t } = useLanguage()
  const [h, setH] = useState<SystemHealth | null>(null)
  useEffect(() => { void systemHealthService.check().then(setH) }, [])
  const dot = (s: string) => s === 'up' ? '🟢' : s === 'down' ? '🔴' : '🟡'
  return (
    <div className={CARD}>
      <Head Icon={HeartPulse} title={t.saSysHealth} color="text-rose-500" />
      {!h ? <div className="h-20 animate-pulse bg-gray-50 dark:bg-gray-700 rounded-xl" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {h.items.map(it => (
            <div key={it.key} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/40">
              <span aria-hidden="true">{dot(it.status)}</span>
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{it.label}</span>
              <span className="text-[11px] font-bold uppercase text-gray-400">{it.status}</span>
            </div>
          ))}
          <p className="text-[11px] text-gray-400 mt-1 sm:col-span-2">{t.saLastBackup} {h.lastBackup ?? t.saSupabaseAuto}</p>
        </div>
      )}
    </div>
  )
}

// ═══ Payment Center ═══
function PaymentCenter() {
  const { t } = useLanguage()
  const [s, setS] = useState<PaymentStats | null>(null)
  const [rows, setRows] = useState<PaymentRow[]>([])
  const [pending, setPending] = useState<PaymentRecord[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [uid, setUid] = useState('')
  const reload = useCallback(() => {
    void paymentAdminService.getStats().then(setS)
    void paymentAdminService.listPayments(10).then(setRows)
    void paymentAdminService.listPending().then(setPending)
  }, [])
  useEffect(() => { reload() }, [reload])
  const fmtMoney = (n: number) => `${n.toLocaleString()} ${t.saSum}`

  // Org to'lovi (organization_id bor) → org RPC; aks holda per-user RPC
  const orgOf = (p: PaymentRecord) => (p as unknown as { organization_id?: string | null; organization?: { name?: string } | null })
  const handleApprove = async (p: PaymentRecord) => {
    setBusyId(p.id)
    try {
      if (orgOf(p).organization_id) await paymentAdminService.approveOrg(p.id)
      else                          await paymentAdminService.approve(p.id)
      reload()
    } catch { /* xatolik — holat o'zgarmaydi */ }
    finally { setBusyId(null) }
  }
  const handleReject = async (p: PaymentRecord) => {
    setBusyId(p.id)
    try {
      if (orgOf(p).organization_id) await paymentAdminService.rejectOrg(p.id)
      else                          await paymentAdminService.reject(p.id)
      reload()
    } catch { /* xatolik */ }
    finally { setBusyId(null) }
  }
  return (
    <div className={CARD}>
      <Head Icon={CreditCard} title={t.saPayCenter} color="text-emerald-500" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        {[
          { l: t.saTotalRevenue, v: s ? fmtMoney(s.totalRevenue) : '…' },
          { l: t.saMonthlyRevenue, v: s ? fmtMoney(s.monthlyRevenue) : '…' },
          { l: 'Premium', v: s?.premiumUsers ?? '…' },
          { l: t.saExpired, v: s?.expiredPremium ?? '…' },
        ].map(c => (
          <div key={c.l} className="rounded-xl bg-gray-50 dark:bg-gray-700/40 p-3">
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">{c.v}</p>
            <p className="text-[10.5px] text-gray-400 mt-0.5">{c.l}</p>
          </div>
        ))}
      </div>

      {/* Qo'lda premium faollashtirish (foydalanuvchi ID orqali) */}
      <div className="mb-4">
        <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">{t.saUserIdManual}</label>
        <input value={uid} onChange={e => setUid(e.target.value.trim())} placeholder={t.saUserUuidPh} className={INPUT} />
      </div>
      {uid && <AdminPremiumManager userId={uid} />}

      {/* Kutilayotgan qo'lda to'lovlar — tasdiqlash / rad etish */}
      {pending.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-500 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5" /> {t.saPendingPayments} · {pending.length}
          </p>
          {pending.map(p => (
            <div key={p.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-900/30">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {fmtMoney(Number(p.amount))} · <span className="uppercase text-[11px] text-amber-600 dark:text-amber-400">{p.plan_type ?? 'premium'}</span>
                  {orgOf(p).organization_id && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">TASHKILOT</span>}
                </p>
                <p className="text-[10.5px] text-gray-400 truncate">
                  {orgOf(p).organization_id ? `🏢 ${orgOf(p).organization?.name ?? 'Tashkilot'}` : p.user_id}
                </p>
              </div>
              {p.receipt_url && (
                <a href={p.receipt_url} target="_blank" rel="noopener noreferrer"
                  className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                  <Receipt className="w-3 h-3" /> {t.saViewReceipt}
                </a>
              )}
              <button type="button" disabled={busyId === p.id} onClick={() => void handleApprove(p)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold disabled:opacity-50">
                {busyId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} {t.saApprove}
              </button>
              <button type="button" disabled={busyId === p.id} onClick={() => void handleReject(p)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[11px] font-semibold disabled:opacity-50">
                <X className="w-3 h-3" /> {t.saReject}
              </button>
            </div>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{t.saPayHistory}</p>
          {rows.map(r => (
            <div key={r.id} className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/40">
              <span className="flex-1 text-gray-600 dark:text-gray-300 truncate">{r.provider ?? '—'}</span>
              <span className="text-gray-900 dark:text-gray-100 font-semibold">{fmtMoney(Number(r.amount))}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.status === 'success' ? 'bg-emerald-100 text-emerald-600' : r.status === 'failed' ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══ Announcement Center ═══
function AnnouncementCenter({ currentUserId }: { currentUserId: string }) {
  const { t } = useLanguage()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [target, setTarget] = useState<AnnouncementTarget>('all')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const send = async () => {
    if (!title.trim()) return
    setBusy(true); setSent(false)
    try { await announcementService.create(title.trim(), body.trim() || null, target, currentUserId); setSent(true); setTitle(''); setBody('') }
    finally { setBusy(false) }
  }
  return (
    <div className={CARD}>
      <Head Icon={Megaphone} title={t.saAnnCenter} color="text-blue-500" />
      <div className="space-y-2">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t.saAnnTitlePh} className={INPUT} />
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={2} placeholder={t.saAnnBodyPh} className={`${INPUT} resize-none`} />
        <div className="flex items-center gap-2 flex-wrap">
          <select value={target} onChange={e => setTarget(e.target.value as AnnouncementTarget)} className={`${INPUT} w-auto`}>
            {ANNOUNCEMENT_TARGETS.map(tg => <option key={tg.key} value={tg.key}>{tg.label}</option>)}
          </select>
          <button type="button" onClick={() => void send()} disabled={busy || !title.trim()} className={BTN} style={BTN_BG}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {t.saSend}
          </button>
          {sent && <span className="text-sm text-emerald-600 inline-flex items-center gap-1"><Check className="w-4 h-4" /> {t.saSent}</span>}
        </div>
        <p className="text-[11px] text-gray-400">{t.saAnnNote}</p>
      </div>
    </div>
  )
}

// ═══ Promo Code Manager ═══
function PromoCodeManager({ currentUserId }: { currentUserId: string }) {
  const { t } = useLanguage()
  const [list, setList] = useState<PromoCodeRow[]>([])
  const [code, setCode] = useState('')
  const [type, setType] = useState<PromoDiscountType>('percentage')
  const [value, setValue] = useState('50')
  const [limit, setLimit] = useState('100')
  const [expire, setExpire] = useState('')
  const [busy, setBusy] = useState(false)
  const load = useCallback(() => { void promoCodeService.list().then(setList) }, [])
  useEffect(() => { load() }, [load])
  const create = async () => {
    if (!code.trim()) return
    setBusy(true)
    try {
      await promoCodeService.create({
        code: code.trim(), discount_type: type, discount_value: Number(value) || 0,
        usage_limit: limit ? Number(limit) : null, expires_at: expire ? new Date(expire).toISOString() : null,
      }, currentUserId)
      setCode(''); load()
    } finally { setBusy(false) }
  }
  return (
    <div className={CARD}>
      <Head Icon={Ticket} title={t.saPromoCodes} color="text-amber-500" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
        <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder={t.saCodePh} className={INPUT} />
        <select value={type} onChange={e => setType(e.target.value as PromoDiscountType)} className={INPUT}>
          <option value="percentage">{t.saDiscountPct}</option>
          <option value="free_days">{t.saFreeDays}</option>
        </select>
        <input value={value} onChange={e => setValue(e.target.value)} type="number" placeholder={type === 'percentage' ? '%' : t.saDays} className={INPUT} />
        <input value={limit} onChange={e => setLimit(e.target.value)} type="number" placeholder={t.saLimitPh} className={INPUT} />
        <input value={expire} onChange={e => setExpire(e.target.value)} type="date" className={INPUT} />
        <button type="button" onClick={() => void create()} disabled={busy || !code.trim()} className={BTN} style={BTN_BG}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {t.saCreate}
        </button>
      </div>
      <div className="space-y-1.5">
        {list.map(p => (
          <div key={p.id} className="flex items-center gap-2 text-sm px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/40">
            <span className="font-bold text-gray-900 dark:text-gray-100 tracking-wide">{p.code}</span>
            <span className="text-gray-500">{p.discount_type === 'percentage' ? `${p.discount_value}%` : `${p.discount_value} ${t.saDays}`}</span>
            <span className="text-[11px] text-gray-400">{p.used_count}/{p.usage_limit ?? '∞'}</span>
            <button type="button" onClick={() => void promoCodeService.setActive(p.id, !p.is_active).then(load)}
              className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${p.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'}`}>
              {p.is_active ? t.admActive : t.admDisabled}
            </button>
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-gray-400">{t.saNoPromo}</p>}
      </div>
    </div>
  )
}

// ═══ Activity Logs ═══
function ActivityLogsPanel() {
  const { t } = useLanguage()
  const [logs, setLogs] = useState<ActivityLogView[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const load = useCallback(() => { setLoading(true); void activityLogService.list({ search: search || undefined, limit: 50 }).then(setLogs).finally(() => setLoading(false)) }, [search])
  useEffect(() => { load() }, [load])
  const fmt = (iso: string) => new Intl.DateTimeFormat('uz', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
  return (
    <div className={CARD}>
      <Head Icon={Activity} title={t.saActivityLog} color="text-violet-500" />
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.saSearchAction} className={`${INPUT} pl-9`} />
      </div>
      {loading ? <div className="h-24 animate-pulse bg-gray-50 dark:bg-gray-700 rounded-xl" /> : logs.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">{t.saLogEmpty}</p>
      ) : (
        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {logs.map(l => (
            <div key={l.id} className="flex items-center gap-2 text-sm px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/40">
              <span className="font-semibold text-gray-900 dark:text-gray-100">{l.actorName}</span>
              <span className="text-violet-600 dark:text-violet-400 font-medium">{l.action}</span>
              {l.target_type && <span className="text-gray-400 text-xs">→ {l.target_type}</span>}
              <span className="ml-auto text-[10.5px] text-gray-400 flex-shrink-0">{fmt(l.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══ Wrapper — faqat Super Admin ═══
export function SuperAdminPanel({ currentUserId }: { currentUserId: string }) {
  const { t } = useLanguage()
  const [isSuper, setIsSuper] = useState<boolean | null>(null)
  useEffect(() => { void adminPermissionService.isSuperAdmin(currentUserId).then(setIsSuper) }, [currentUserId])

  if (isSuper === null) return <div className={`${CARD} h-24 animate-pulse`} />
  if (!isSuper) return (
    <div className={`${CARD} text-center`}>
      <Crown className="w-6 h-6 text-gray-300 mx-auto mb-2" />
      <p className="text-sm text-gray-400">{t.saOnlySuper}</p>
    </div>
  )
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Crown className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t.saSuperMgmt}</h2>
      </div>
      <PlatformOverview />
      <OrganizationsManager />
      <AddAdminSection />
      <PlatformUsersManager />
      <AdminPremiumStats />
      <SystemHealthCard />
      <PaymentCenter />
      <AnnouncementCenter currentUserId={currentUserId} />
      <PromoCodeManager currentUserId={currentUserId} />
      <AdminPermissionsPanel currentUserId={currentUserId} />
      <ActivityLogsPanel />
    </div>
  )
}
