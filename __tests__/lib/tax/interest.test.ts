import { describe, it, expect } from 'vitest'
import { computeInterest } from '@/lib/tax/interest'
import type { InterestRecord } from '@/lib/ibkr/types'
import type { RatesMap } from '@/lib/boi/types'

const rates: RatesMap = { USD: { '2024-06-30': '3.70' } }
const int = (o: Partial<InterestRecord> = {}): InterestRecord => ({
  id: 'i', description: 'Broker Interest', currency: 'USD',
  payDate: '2024-06-30', gross: '40', withheldTax: '0', sourceCountry: 'US', ...o,
})

describe('computeInterest', () => {
  it('taxes foreign-currency interest at 25%', () => {
    const { lines } = computeInterest([int()], rates, 2024)
    expect(lines[0].grossIls).toBe('148')        // 40*3.70
    expect(lines[0].rate).toBe('25')
    expect(lines[0].israeliTaxIls).toBe('37')    // 148*25%
  })
  it('filters to the tax year', () => {
    const { lines } = computeInterest([int({ payDate: '2025-01-02' })], rates, 2024)
    expect(lines).toHaveLength(0)
  })
})
