import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn (class merge helper)', () => {
  it('joins plain class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('ignores falsy values', () => {
    expect(cn('a', false, null, undefined, 'c')).toBe('a c')
  })

  it('supports arrays and conditional objects (clsx)', () => {
    expect(cn(['a', 'b'], { c: true, d: false })).toBe('a b c')
  })

  it('dedupes conflicting Tailwind utilities (tailwind-merge)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })
})
