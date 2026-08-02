import { describe, it, expect } from 'vitest'
import { computeDividends } from '@/lib/tax/dividends'
import type { DividendRecord } from '@/lib/ibkr/types'
import type { RatesMap } from '@/lib/boi/types'

const rates: RatesMap = { USD: { '2024-02-15': '3.60' } }
const div = (o: Partial<DividendRecord> = {}): DividendRecord => ({
  id: 'd', ticker: 'KO', description: 'Coca-Cola', currency: 'USD',
  payDate: '2024-02-15', gross: '100', withheldTax: '25', sourceCountry: 'US', ...o,
})

describe('computeDividends', () => {
  it('converts gross and withholding at the pay-date rate, taxes at 25%', () => {
    const { lines } = computeDividends([div()], rates, 2024, [])
    expect(lines[0].grossIls).toBe('360')          // 100*3.60
    expect(lines[0].rate).toBe('25')
    expect(lines[0].israeliTaxIls).toBe('90')      // 360*25%
    expect(lines[0].withheldIls).toBe('90')        // 25*3.60
  })
  it('uses 30% for a substantial holding', () => {
    const { lines } = computeDividends([div({ ticker: 'KO' })], rates, 2024, ['KO'])
    expect(lines[0].rate).toBe('30')
    expect(lines[0].israeliTaxIls).toBe('108')     // 360*30%
  })
  it('filters to the tax year by pay date', () => {
    const { lines } = computeDividends([div({ payDate: '2023-12-15' })], rates, 2024, [])
    expect(lines).toHaveLength(0)
  })
})
