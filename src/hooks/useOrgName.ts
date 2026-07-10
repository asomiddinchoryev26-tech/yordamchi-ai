import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

// organizations isn't in the generated Database types → loose read.
// Super-admin barcha tashkilotlarni o'qiy oladi (org_super policy), shu sabab
// limit(1) noaniq. Foydalanuvchining o'z organization_id'si bo'lsa — aynan shuni olamiz.
const sbLoose = supabase as unknown as {
  from: (t: string) => {
    select: (c: string) => {
      eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: { name: string } | null }> }
      limit: (n: number) => { maybeSingle: () => Promise<{ data: { name: string } | null }> }
    }
  }
}

/** The current user's organization name (null while loading / org-less). */
export function useOrgName(): string | null {
  const auth = useAuth()
  const orgId = auth.user?.organizationId ?? null
  const [name, setName] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const table = sbLoose.from('organizations').select('name')
        const { data } = orgId
          ? await table.eq('id', orgId).maybeSingle()
          : await table.limit(1).maybeSingle()
        if (alive && data?.name) setName(data.name)
      } catch { /* ignore */ }
    })()
    return () => { alive = false }
  }, [orgId])
  return name
}
