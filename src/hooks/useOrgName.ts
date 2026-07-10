import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// organizations isn't in the generated Database types → loose read.
// RLS (organizations_read_own) returns the caller's own organization.
const sbLoose = supabase as unknown as {
  from: (t: string) => {
    select: (c: string) => { limit: (n: number) => { maybeSingle: () => Promise<{ data: { name: string } | null }> } }
  }
}

/** The current user's organization name (null while loading / org-less). */
export function useOrgName(): string | null {
  const [name, setName] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const { data } = await sbLoose.from('organizations').select('name').limit(1).maybeSingle()
        if (alive && data?.name) setName(data.name)
      } catch { /* ignore */ }
    })()
    return () => { alive = false }
  }, [])
  return name
}
