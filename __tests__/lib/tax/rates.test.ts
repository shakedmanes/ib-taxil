import { describe, it, expect } from 'vitest'
import {
  getYearRates, SUPPORTED_YEARS, MIN_SUPPORTED_YEAR, LATEST_KNOWN_YEAR,
  isYearProvisional, selectableYears,
} from '@/lib/tax/rates'

describe('rate table', () => {
  it('supports the officially-confirmed years only (2024-2025)', () => {
    expect(SUPPORTED_YEARS).toEqual([2024, 2025])
    expect(MIN_SUPPORTED_YEAR).toBe(2024)
    expect(LATEST_KNOWN_YEAR).toBe(2025)
  })
  it('has stable 25/30 rates every confirmed year', () => {
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
    expect(getYearRates(2024).surtaxThresholdIls).toBe('721560')
    expect(getYearRates(2025).surtaxThresholdIls).toBe('721560')
  })
  it('adds the 2% capital surtax only from 2025', () => {
    expect(getYearRates(2024).capitalSurtaxRate).toBe('0')
    expect(getYearRates(2025).capitalSurtaxRate).toBe('2')
  })
  it('throws for a year before the earliest supported year', () => {
    expect(() => getYearRates(2023)).toThrow(/not supported/i)
    expect(() => getYearRates(2021)).toThrow(/not supported/i)
  })

  describe('future (provisional) years', () => {
    it('flags any year beyond the latest confirmed year as provisional', () => {
      expect(isYearProvisional(2025)).toBe(false)
      expect(isYearProvisional(2026)).toBe(true)
      expect(isYearProvisional(2030)).toBe(true)
    })
    it('carries the latest confirmed constants forward for a future year', () => {
      const future = getYearRates(2026)
      expect(future).toEqual(getYearRates(LATEST_KNOWN_YEAR))
    })
    it('returns a fresh copy (immutability) — not the shared table row', () => {
      expect(getYearRates(2025)).not.toBe(getYearRates(2025))
    })
  })

  describe('selectableYears', () => {
    it('offers confirmed years, newest first, never a hard-blocked year', () => {
      expect(selectableYears(new Date('2026-08-07'))).toEqual([2025, 2024])
    })
    it('includes the new filing year as provisional once the calendar advances', () => {
      const years = selectableYears(new Date('2027-05-01'))
      expect(years).toEqual([2026, 2025, 2024])
      expect(isYearProvisional(years[0])).toBe(true)
    })
  })
})
