import { describe, it, expect } from 'vitest'
import { computeCapitalGains } from '@/lib/tax/capital-gains'
import type { ClosedLot } from '@/lib/ibkr/types'
import type { RatesMap } from '@/lib/boi/types'

const rates: RatesMap = {
  USD: { '2019-05-01': '3.20', '2024-03-10': '3.70', '2024-06-01': '3.75' },
}
const lot = (o: Partial<ClosedLot>): ClosedLot => ({
  id: 'l', ticker: 'AAPL', description: 'Apple', currency: 'USD', quantity: 100,
  openDate: '2019-05-01', saleDate: '2024-03-10', proceeds: '12000', cost: '10000',
  method: 'FIFO', ...o,
})

describe('computeCapitalGains', () => {
  it('computes shekel real gain using open-date and sale-date rates', () => {
    const { lines } = computeCapitalGains([lot({})], rates, 2024, [])
    expect(lines).toHaveLength(1)
    // 12000*3.70 - 10000*3.20 = 44400 - 32000 = 12400
    expect(lines[0].gainIls).toBe('12400')
    expect(lines[0].openRate).toBe('3.20')
    expect(lines[0].saleRate).toBe('3.70')
    expect(lines[0].isSubstantial).toBe(false)
  })
  it('produces a positive gain from FX even when USD proceeds < cost', () => {
    const { lines } = computeCapitalGains(
      [lot({ proceeds: '9000', cost: '10000' })], rates, 2024, [])
    // 9000*3.70 - 10000*3.20 = 33300 - 32000 = 1300  (still a gain via FX!)
    expect(lines[0].gainIls).toBe('1300')
  })
  it('marks substantial holdings', () => {
    const { lines } = computeCapitalGains([lot({})], rates, 2024, ['AAPL'])
    expect(lines[0].isSubstantial).toBe(true)
  })
  it('includes only lots sold in the tax year', () => {
    const other = lot({ id: 'l2', saleDate: '2023-11-01' })
    const { lines } = computeCapitalGains([lot({}), other], rates, 2024, [])
    expect(lines).toHaveLength(1)
  })
})
