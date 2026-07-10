import {
  createContext, useCallback, useContext,
  useEffect, useReducer, type ReactNode,
} from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { AuthState, User, UserRole, OrgType, LoginCredentials, RegisterPayload } from '@/types/auth.types'

// ─── Supabase xato → O'zbek ──────────────────────────────────────────────────

function mapAuthError(msg: string): string {
  if (msg.includes('Invalid login credentials'))    return "Email yoki parol noto'g'ri"
  if (msg.includes('Email not confirmed'))          return 'Email tasdiqlanmagan. Pochta qutingizni tekshiring'
  if (msg.includes('User already registered'))      return "Bu email allaqachon ro'yxatdan o'tgan"
  if (msg.includes('Password should be at least'))  return "Parol kamida 6 ta belgidan iborat bo'lishi kerak"
  if (msg.includes('rate limit'))                   return "Juda ko'p urinish. Bir oz kuting"
  if (msg.includes('network') || msg.includes('fetch')) return 'Tarmoq xatoligi. Internetni tekshiring'
  return "Xatolik yuz berdi. Qayta urinib ko'ring"
}

// ─── Supabase user → App user ─────────────────────────────────────────────────

// profiles jadvalidan faqat role olib, User ob'ektini sbUser bilan to'ldiradi.
// O'zbek tilidagi eski qiymatlarni inglizchaga normalize qiladi.
function normalizeRole(v: unknown): UserRole | null {
  if (v === 'student'    || v === 'Talaba')       return 'student'
  if (v === 'teacher'    || v === "O'qituvchi")   return 'teacher'
  if (v === 'admin'      || v === 'Admin')        return 'admin'
  return null
}

async function resolveUser(sbUser: SupabaseUser): Promise<User | null> {
  // SECURITY DEFINER funksiyasi — RLS ni chetlab o'tadi, har doim ishlaydi
  const { data: roleValue, error: roleErr } = await supabase.rpc('get_my_profile_role')

  if (roleErr || !roleValue) {
    logger.error('[resolveUser] rpc get_my_profile_role failed:', roleErr?.message ?? 'null returned')
    return null
  }

  const role = normalizeRole(roleValue)
  if (!role) {
    logger.warn('[resolveUser] unrecognized role value:', roleValue)
    return null
  }

  // full_name + organization_id + is_super_admin ni best-effort olamiz.
  // organizations/is_super_admin generatsiya qilingan tiplarda yo'q → loose cast.
  const sbLoose = supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (k: string, v: string) => {
          maybeSingle: () => Promise<{ data: { full_name?: string | null; organization_id?: string | null; is_super_admin?: boolean | null; status?: string | null; org_type?: string | null } | null }>
        }
      }
    }
  }
  const { data: profile } = await sbLoose
    .from('profiles')
    .select('full_name, organization_id, is_super_admin')
    .eq('id', sbUser.id)
    .maybeSingle()

  // Tashkilot: turini olamiz (atama moslashuvi uchun) + bloklangan bo'lsa kira olmaydi
  // (super-admin bundan mustasno). Xatolik bo'lsa "fail-open".
  const orgId = profile?.organization_id ?? null
  let orgType: OrgType | null = null
  if (orgId) {
    const { data: org } = await sbLoose.from('organizations').select('status, org_type').eq('id', orgId).maybeSingle()
    orgType = (org?.org_type as OrgType | undefined) ?? null
    if (!profile?.is_super_admin && org?.status === 'suspended') {
      logger.warn('[resolveUser] organization suspended — blocking sign-in')
      await supabase.auth.signOut()
      return null
    }
  }

  const meta = (sbUser.user_metadata ?? {}) as Record<string, unknown>
  return {
    id:             sbUser.id,
    email:          sbUser.email ?? '',
    name:           profile?.full_name ?? (typeof meta['name'] === 'string' ? meta['name'] : (sbUser.email ?? '')),
    role,
    avatarUrl:      typeof meta['avatar_url'] === 'string' ? meta['avatar_url'] : undefined,
    createdAt:      sbUser.created_at,
    organizationId: profile?.organization_id ?? null,
    orgType,
  }
}

// ─── Remember me (localStorage + sessionStorage) ─────────────────────────────
// localStorage  'yordamchi_remember' = 'true' → session persists across browser restarts
// sessionStorage 'yordamchi_active'           → marks that this tab has an active session
// On fresh browser start: sessionStorage is empty → if remember=false → sign out

const LS_REMEMBER = 'yordamchi_remember'
const SS_ACTIVE   = 'yordamchi_active'

// ─── Reducer ─────────────────────────────────────────────────────────────────

type AuthAction =
  | { type: 'SET_LOADING';  payload: boolean }
  | { type: 'SET_USER';     payload: User    }
  | { type: 'SET_ERROR';    payload: string  }
  | { type: 'CLEAR_ERROR'                    }
  | { type: 'LOGOUT'                         }

const initialState: AuthState = {
  user:            null,
  token:           null,
  isAuthenticated: false,
  isLoading:       true,
  error:           null,
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, isLoading: action.payload }
    case 'SET_USER':    return { ...state, user: action.payload, isAuthenticated: true, isLoading: false, error: null }
    case 'SET_ERROR':   return { ...state, error: action.payload, isLoading: false }
    case 'CLEAR_ERROR': return { ...state, error: null }
    case 'LOGOUT':      return { ...initialState, isLoading: false }
  }
}

// ─── Context interface ────────────────────────────────────────────────────────

// Explicit outcome so callers never have to read the async-updated `error` state
// to decide what to show (that caused a stale-closure "check your email" bug).
export type RegisterResult =
  | { status: 'signed-in';     user: User }   // email confirmation off → logged in
  | { status: 'confirm-email' }               // must verify email before signing in
  | { status: 'error';         message: string }

export interface AuthContextValue {
  user:            User | null
  isAuthenticated: boolean
  isLoading:       boolean
  error:           string | null
  login:      (creds: LoginCredentials & { rememberMe?: boolean }) => Promise<User | null>
  register:   (payload: RegisterPayload)                           => Promise<RegisterResult>
  logout:     ()                                                   => Promise<void>
  clearError: ()                                                   => void
  refreshUser:()                                                   => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // ── Session initialization on mount ──
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const rememberMe = localStorage.getItem(LS_REMEMBER) === 'true'
        const activeTab  = sessionStorage.getItem(SS_ACTIVE)  === '1'

        // Browser restarted AND remember me was off → sign out
        if (!rememberMe && !activeTab) {
          await supabase.auth.signOut()
          dispatch({ type: 'LOGOUT' })
          return
        }

        const user = await resolveUser(session.user)
        if (user) {
          sessionStorage.setItem(SS_ACTIVE, '1')
          dispatch({ type: 'SET_USER', payload: user })
        } else {
          // Logged in but no role → incomplete profile
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    void init()

    // ── Auth state listener (token refresh, sign out from another tab, etc.) ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void resolveUser(session.user).then(user => {
          if (user) {
            dispatch({ type: 'SET_USER', payload: user })
          } else {
            // Profil topilmadi → tizimdan chiqarish
            void supabase.auth.signOut()
            dispatch({ type: 'LOGOUT' })
          }
        })
      } else {
        dispatch({ type: 'LOGOUT' })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Sign In ──
  const login = useCallback(
    async (creds: LoginCredentials & { rememberMe?: boolean }): Promise<User | null> => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'CLEAR_ERROR' })

      const { data, error } = await supabase.auth.signInWithPassword({
        email:    creds.email.trim().toLowerCase(),
        password: creds.password,
      })

      if (error || !data.user) {
        dispatch({ type: 'SET_ERROR', payload: mapAuthError(error?.message ?? '') })
        return null
      }

      const user = await resolveUser(data.user)
      if (!user) {
        dispatch({ type: 'SET_ERROR', payload: "Foydalanuvchi roli topilmadi. Administrator bilan bog'laning" })
        return null
      }

      // Persist remember me preference
      if (creds.rememberMe) {
        localStorage.setItem(LS_REMEMBER, 'true')
      } else {
        localStorage.removeItem(LS_REMEMBER)
      }
      sessionStorage.setItem(SS_ACTIVE, '1')
      dispatch({ type: 'SET_USER', payload: user })
      return user
    },
    [],
  )

  // ── Sign Up ──
  const register = useCallback(
    async (payload: RegisterPayload): Promise<RegisterResult> => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'CLEAR_ERROR' })

      const { data, error } = await supabase.auth.signUp({
        email:    payload.email.trim().toLowerCase(),
        password: payload.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            name: payload.name.trim(),
            role: payload.role,
          },
        },
      })

      if (error) {
        const message = mapAuthError(error.message)
        dispatch({ type: 'SET_ERROR', payload: message })
        return { status: 'error', message }
      }

      if (!data.user) {
        const message = "Ro'yxatdan o'tishda xatolik. Qayta urinib ko'ring."
        dispatch({ type: 'SET_ERROR', payload: message })
        return { status: 'error', message }
      }

      const profileRow = {
        id:        data.user.id,
        full_name: payload.name.trim(),
        email:     payload.email.trim().toLowerCase(),
        role:      payload.role,
      }

      // Email confirmation OFF → we already have a session → ensure the profile
      // exists (authenticated write), then sign in.
      if (data.session) {
        const { error: profileError } = await supabase.from('profiles').upsert(profileRow, { onConflict: 'id' })
        if (profileError) {
          const message = "Profil yaratishda xatolik. Qayta urinib ko'ring."
          dispatch({ type: 'SET_ERROR', payload: message })
          return { status: 'error', message }
        }
        const user = await resolveUser(data.user)
        if (user) {
          localStorage.setItem(LS_REMEMBER, 'true')
          sessionStorage.setItem(SS_ACTIVE, '1')
          dispatch({ type: 'SET_USER', payload: user })
          return { status: 'signed-in', user }
        }
        const message = "Profilni o'qishda xatolik. Qayta urinib ko'ring."
        dispatch({ type: 'SET_ERROR', payload: message })
        return { status: 'error', message }
      }

      // Email confirmation required. The DB trigger is the source of truth for the
      // profile; this upsert is a best-effort fallback and its error (RLS may reject
      // an unauthenticated write) must NOT block the "check your email" flow.
      await supabase.from('profiles').upsert(profileRow, { onConflict: 'id' })
      dispatch({ type: 'SET_LOADING', payload: false })
      return { status: 'confirm-email' }
    },
    [],
  )

  // ── Sign Out ──
  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    localStorage.removeItem(LS_REMEMBER)
    sessionStorage.removeItem(SS_ACTIVE)
    dispatch({ type: 'LOGOUT' })
  }, [])

  // ── Clear error ──
  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), [])

  // ── Refresh the current user (e.g. after onboarding assigns an organization) ──
  const refreshUser = useCallback(async () => {
    const { data: { user: sbUser } } = await supabase.auth.getUser()
    if (!sbUser) return
    const user = await resolveUser(sbUser)
    if (user) dispatch({ type: 'SET_USER', payload: user })
  }, [])

  return (
    <AuthContext.Provider value={{
      user:            state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading:       state.isLoading,
      error:           state.error,
      login,
      register,
      logout,
      clearError,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider')
  return ctx
}
