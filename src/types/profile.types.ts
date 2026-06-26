/**
 * Global Identity System — Core Types
 * Single source of truth for every user across the entire platform.
 * All pages, components, and services read from these types.
 */

import type { UserRole } from './auth.types'

// ─── Avatar ───────────────────────────────────────────────────────────────────

export type AvatarMode =
  | 'uploaded'   // real uploaded photo → highest priority
  | 'generated'  // gradient preset    → second priority
  | 'initials'   // text fallback       → lowest priority

export interface GradientPreset {
  id:    string
  from:  string
  to:    string
  label: string
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { id: 'violet-blue',   from: '#7c3aed', to: '#3b82f6', label: 'Violet Blue'  },
  { id: 'rose-orange',   from: '#f43f5e', to: '#f97316', label: 'Rose Orange'  },
  { id: 'emerald-teal',  from: '#10b981', to: '#14b8a6', label: 'Emerald Teal' },
  { id: 'blue-cyan',     from: '#2563eb', to: '#06b6d4', label: 'Blue Cyan'    },
  { id: 'purple-pink',   from: '#9333ea', to: '#ec4899', label: 'Purple Pink'  },
  { id: 'amber-red',     from: '#d97706', to: '#ef4444', label: 'Amber Red'    },
  { id: 'slate-indigo',  from: '#475569', to: '#6366f1', label: 'Slate Indigo' },
  { id: 'green-lime',    from: '#16a34a', to: '#65a30d', label: 'Green Lime'   },
]

export interface AvatarConfig {
  mode:           AvatarMode
  uploadedUrl?:   string | null
  gradientPreset?: string          // GradientPreset.id
}

// ─── Notification settings ────────────────────────────────────────────────────

export interface NotificationSettings {
  email:    boolean
  push:     boolean
  sms:      boolean
  inApp:    boolean
}

// ─── Social links ─────────────────────────────────────────────────────────────

export interface SocialLinks {
  website?:   string
  github?:    string
  linkedin?:  string
  telegram?:  string
  twitter?:   string
}

// ─── Preferences ─────────────────────────────────────────────────────────────

export interface UserPreferences {
  language:            'uz' | 'ru' | 'en'
  theme:               'light' | 'dark' | 'system'
  compactMode:         boolean
  showOnlineStatus:    boolean
  autoPlayMedia:       boolean
}

// ─── Core profile (maps to Supabase profiles table + auth metadata) ───────────

export interface UserProfile {
  // Core identity
  id:        string
  fullName:  string
  email:     string
  role:      UserRole
  status:    'active' | 'inactive'
  createdAt: string
  updatedAt?: string

  // Extended fields (from profiles table)
  username?:  string | null
  phone?:     string | null
  bio?:       string | null

  // Avatar
  avatarUrl?:     string | null
  avatarMode:     AvatarMode
  gradientPreset: string          // default: 'violet-blue'

  // Preferences
  preferences: UserPreferences

  // Future-ready
  lastLogin?:            string | null
  isVerified?:           boolean
  socialLinks?:          SocialLinks
  notificationSettings?: NotificationSettings
}

// ─── Profile update payload ───────────────────────────────────────────────────

export interface UserProfileUpdate {
  fullName?:    string
  username?:    string
  phone?:       string
  bio?:         string
  avatarUrl?:   string | null
  avatarMode?:  AvatarMode
  gradientPreset?: string
  preferences?: Partial<UserPreferences>
  socialLinks?: Partial<SocialLinks>
  notificationSettings?: Partial<NotificationSettings>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map(w => w.charAt(0).toUpperCase())
    .join('')
}

export function getGradient(presetId: string): GradientPreset {
  return GRADIENT_PRESETS.find(p => p.id === presetId) ?? GRADIENT_PRESETS[0]!
}

export function buildDefaultProfile(
  id: string,
  email: string,
  fullName: string,
  role: UserRole,
  createdAt: string,
  avatarUrl?: string | null,
): UserProfile {
  return {
    id,
    fullName,
    email,
    role,
    status:    'active',
    createdAt,
    avatarUrl:      avatarUrl ?? null,
    avatarMode:     avatarUrl ? 'uploaded' : 'initials',
    gradientPreset: 'violet-blue',
    preferences: {
      language:         'uz',
      theme:            'system',
      compactMode:      false,
      showOnlineStatus: true,
      autoPlayMedia:    true,
    },
  }
}
