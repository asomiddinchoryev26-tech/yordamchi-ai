// Shared constants for the Asomiddin AI design system

export const NEON_RING  = 'conic-gradient(from 200deg, #7c3aed 0%, #3b82f6 30%, #06b6d4 52%, #8b5cf6 72%, #7c3aed 100%)'
export const AVATAR_SRC = `/asomiddin.jpg?_=${Date.now()}`

// Inject global keyframes once
let stylesInjected = false
export function injectAIStyles(): void {
  if (stylesInjected || typeof document === 'undefined') return
  stylesInjected = true
  if (document.getElementById('asomiddin-ai-styles')) return
  const s = document.createElement('style')
  s.id = 'asomiddin-ai-styles'
  s.textContent = [
    '@keyframes aiCursor{0%,100%{opacity:1}50%{opacity:0}}',
    '@keyframes aiFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}',
  ].join('')
  document.head.appendChild(s)
}
