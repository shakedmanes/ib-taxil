import { describe, it, expect } from 'vitest'
import { getRate } from '@/lib/boi/lookup'
import type { RatesMap } from '@/lib/boi/types'

const rates: RatesMap = {
  USD: { '2024-03-07': '3.60', '2024-03-08': '3.65', '2024-03-11': '3.70' },
}

describe('getRate', () => {
  it('returns the exact-date rate', () => {
    expect(getRate(rates, 'USD', '2024-03-08')).toBe('3.65')
  })
  it('falls back to the last published prior rate (weekend)', () => {
    // 2024-03-09 (Sat) and 03-10 (Sun) unpublished -> use 03-08
    expect(getRate(rates, 'USD', '2024-03-10')).toBe('3.65')
  })
  it('walks back with no arbitrary cap', () => {
    expect(getRate(rates, 'USD', '2024-12-31')).toBe('3.70')
  })
  it('throws when no rate exists at or before the date', () => {
    expect(() => getRate(rates, 'USD', '2024-03-06')).toThrow(/no .*rate/i)
  })
  it('throws for an unknown currency', () => {
    expect(() => getRate(rates, 'JPY', '2024-03-08')).toThrow(/JPY/)
  })
})
