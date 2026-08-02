import { describe, it, expect } from 'vitest'
import { getYearRates, SUPPORTED_YEARS } from '@/lib/tax/rates'

describe('rate table', () => {
  it('supports 2022-2025', () => {
    expect(SUPPORTED_YEARS).toEqual([2022, 2023, 2024, 2025])
  })
  it('has stable 25/30 rates every year', () => {
    for (const y of SUPPORTED_YEARS) {
      const r = getYearRates(y)
      expect(r.capitalGainsRate).toBe('25')
      expect(r.substantialHolderRate).toBe('30')
      expect(r.dividendRate).toBe('25')
      expect(r.interestRate).toBe('25')
      expect(r.surtaxBaseRate).toBe('3')
    }
  })
  it('has per-year surtax thresholds', () => {
    expect(getYearRates(2022).surtaxThresholdIls).toBe('663240')
    expect(getYearRates(2023).surtaxThresholdIls).toBe('698280')
    expect(getYearRates(2024).surtaxThresholdIls).toBe('721560')
    expect(getYearRates(2025).surtaxThresholdIls).toBe('721560')
  })
  it('adds the 2% capital surtax only from 2025', () => {
    expect(getYearRates(2024).capitalSurtaxRate).toBe('0')
    expect(getYearRates(2025).capitalSurtaxRate).toBe('2')
  })
  it('throws for an unsupported year', () => {
    expect(() => getYearRates(2021)).toThrow(/not supported/i)
  })
})
