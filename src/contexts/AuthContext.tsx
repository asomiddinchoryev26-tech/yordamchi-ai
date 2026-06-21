import {
  createContext, useCallback, useContext,
  useEffect, useReducer, type ReactNode,
} from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { AuthState, User, UserRole, LoginCredentials, RegisterPayload } from '@/types/auth.types'

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

function isValidRole(v: unknown): v is UserRole {
  return v === 'student' || v === 'teacher' || v === 'admin'
}

// profiles jadvalidan faqat role olib, User ob'ektini sbUser bilan to'ldiradi.
// Profil topilmasa yoki xatolik bo'lsa — null qaytaradi (login ga yo'naltirish uchun).
async function resolveUser(sbUser: SupabaseUser): Promise<User | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', sbUser.id)
    .single()

  if (error || !profile) return null
  if (!isValidRole(profile.role)) return null

  const meta = (sbUser.user_metadata ?? {}) as Record<string, unknown>
  return {
    id:        sbUser.id,
    email:     sbUser.email ?? '',
    name:      typeof meta['name'] === 'string' ? meta['name'] : (sbUser.email ?? ''),
    role:      profile.role,
    avatarUrl: typeof meta['avatar_url'] === 'string' ? meta['avatar_url'] : undefined,
    createdAt: sbUser.created_at,
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

export interface AuthContextValue {
  user:            User | null
  isAuthenticated: boolean
  isLoading:       boolean
  error:           string | null
  login:      (creds: LoginCredentials & { rememberMe?: boolean }) => Promise<User | null>
  register:   (payload: RegisterPayload)                           => Promise<User | null>
  logout:     ()                                                   => Promise<void>
  clearError: ()                                                   => void
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
    async (payload: RegisterPayload): Promise<User | null> => {
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
        dispatch({ type: 'SET_ERROR', payload: mapAuthError(error.message) })
        return null
      }

      if (!data.user) {
        dispatch({ type: 'SET_LOADING', payload: false })
        return null
      }

      // profiles jadvaliga yozamiz (upsert — trigger allaqachon yozgan bo'lsa xato bermaydi)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id:        data.user.id,
          full_name: payload.name.trim(),
          email:     payload.email.trim().toLowerCase(),
          role:      payload.role,
        }, { onConflict: 'id' })

      if (profileError) {
        dispatch({ type: 'SET_ERROR', payload: "Profil yaratishda xatolik. Qayta urinib ko'ring." })
        return null
      }

      // data.session is non-null → email confirmation disabled → auto-logged in
      if (data.session) {
        const user = await resolveUser(data.user)
        if (user) {
          localStorage.setItem(LS_REMEMBER, 'true')
          sessionStorage.setItem(SS_ACTIVE, '1')
          dispatch({ type: 'SET_USER', payload: user })
          return user
        }
      }

      // Email confirmation required → user must verify before signing in
      dispatch({ type: 'SET_LOADING', payload: false })
      return null
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
