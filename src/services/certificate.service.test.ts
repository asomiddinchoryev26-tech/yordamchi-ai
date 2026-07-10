import { describe, it, expect } from 'vitest'
import { buildCertId, buildPeriodLabel } from '@/services/certificate.service'

describe('buildCertId', () => {
  it('returns the achievement id unchanged', () => {
    expect(buildCertId('ach-123')).toBe('ach-123')
  })
})

describe('buildPeriodLabel', () => {
  it('maps a month number to the Uzbek month name + year', () => {
    expect(buildPeriodLabel(2026, 1)).toBe('Yanvar 2026')
    expect(buildPeriodLabel(2026, 7)).toBe('Iyul 2026')
    expect(buildPeriodLabel(2025, 12)).toBe('Dekabr 2025')
  })
})
