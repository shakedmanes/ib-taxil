import { describe, it, expect } from 'vitest'
import { itaFieldCode, isYearVerified } from '@/lib/reports/field-codes'

describe('itaFieldCode', () => {
  it('returns the verified 1301/1324 codes for 2024 and 2025', () => {
    expect(itaFieldCode('capitalGainsTurnover', 2024)).toMatchObject({ form: '1301', code: '256', status: 'verified' })
    expect(itaFieldCode('dividend25', 2025)).toMatchObject({ form: '1301', code: '141', status: 'verified' })
    expect(itaFieldCode('interest25', 2024)).toMatchObject({ form: '1301', code: '157', status: 'verified' })
    expect(itaFieldCode('foreignIncomeTotal', 2024)).toMatchObject({ form: '1301', code: '290', status: 'verified' })
    expect(itaFieldCode('ftcDividendTax', 2024)).toMatchObject({ form: '1324', code: '431', status: 'verified' })
  })

  it('keeps the code but flags it unverified for unconfirmed years', () => {
    const f = itaFieldCode('dividend25', 2022)
    expect(f.code).toBe('141')
    expect(f.status).toBe('unverified')
    expect(isYearVerified(2022)).toBe(false)
    expect(isYearVerified(2024)).toBe(true)
  })

  it('marks surtax as system-computed with no field', () => {
    const f = itaFieldCode('surtax', 2025)
    expect(f.status).toBe('system')
    expect(f.code).toBeUndefined()
  })
})
