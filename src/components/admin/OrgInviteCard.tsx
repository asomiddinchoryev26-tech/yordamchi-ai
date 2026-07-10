/**
 * components/admin/OrgInviteCard.tsx
 *
 * Shows the admin's organization name + shareable join code. Teachers and
 * students use this code on the onboarding screen to join the organization.
 * Reads the caller's own org via RLS (organizations_read_own).
 */

import { useState, useEffect } from 'react'
import { Building2, Copy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// organizations isn't in the generated Database types → loose read
const sbLoose = supabase as unknown as {
  from: (t: string) => {
    select: (c: string) => { limit: (n: number) => { maybeSingle: () => Promise<{ data: { name: string; join_code: string | null } | null }> } }
  }
}

export function OrgInviteCard() {
  const [org, setOrg]       = useState<{ name: string; join_code: string | null } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await sbLoose.from('organizations').select('name, join_code').limit(1).maybeSingle()
        if (data) setOrg(data)
      } catch { /* ignore */ }
    })()
  }, [])

  if (!org?.join_code) return null

  return (
    <div
      className="rounded-[20px] p-5 flex flex-col sm:flex-row sm:items-center gap-4"
      style={{
        background: 'linear-gradient(135deg, rgba(91,127,255,0.12), rgba(124,58,237,0.10))',
        border: '1px solid rgba(91,127,255,0.25)',
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-11 h-11 rounded-[13px] flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(91,127,255,0.2)', border: '1px solid rgba(91,127,255,0.3)' }}>
          <Building2 className="w-5 h-5 text-[#93BBFF]" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-black text-gray-900 truncate">{org.name}</p>
          <p className="text-[12px] text-gray-500">O'qituvchi va talabalarni shu kod bilan taklif qiling</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-[13px]"
          style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Kod</span>
          <span className="text-[20px] font-black text-white tracking-[0.22em]" style={{ fontFamily: 'ui-monospace, monospace' }}>
            {org.join_code}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (org.join_code) navigator.clipboard.writeText(org.join_code).catch(() => {})
            setCopied(true); setTimeout(() => setCopied(false), 2000)
          }}
          title="Nusxa olish"
          className="w-11 h-11 flex items-center justify-center rounded-[13px] transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)', boxShadow: '0 4px 16px rgba(91,127,255,0.35)' }}
        >
          {copied ? <Check className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5 text-white" />}
        </button>
      </div>
    </div>
  )
}
