import { describe, it, expect } from 'vitest'
import { calculateTax } from '@/lib/tax/calculator'
import type { IBKRData } from '@/lib/ibkr/types'
import type { RatesMap } from '@/lib/boi/types'
import type { UserInputs } from '@/lib/tax/user-inputs'

const rates: RatesMap = {
  USD: { '2019-05-01': '3.20', '2024-02-15': '3.60', '2024-03-10': '3.70', '2024-06-30': '3.75' },
}
const baseInputs: UserInputs = { substantialHoldings: [], broughtForwardLoss: '0' }
const data = (o: Partial<IBKRData> = {}): IBKRData => ({
  accountId: 'U1', baseCurrency: 'USD', lotMethod: 'FIFO', hasClosedLotSection: true,
  closedLots: [{ id: 'l1', ticker: 'AAPL', description: 'Apple', currency: 'USD', quantity: 100, openDate: '2019-05-01', saleDate: '2024-03-10', proceeds: '12000', cost: '10000', method: 'FIFO' }],
  dividends: [], interest: [], outOfScope: [], ...o,
})

describe('calculateTax', () => {
  it('blocks on an unsupported year', () => {
    const out = calculateTax(data(), rates, 2019, baseInputs)
    expect(out.status).toBe('blocked')
    if (out.status === 'blocked') expect(out.issues[0].code).toBe('unsupported-year')
  })
  it('blocks when closed-lot section is missing but sales exist', () => {
    const out = calculateTax(data({ hasClosedLotSection: false }), rates, 2024, baseInputs)
    expect(out.status).toBe('blocked')
    if (out.status === 'blocked') expect(out.issues[0].code).toBe('missing-closed-lots')
  })
  it('computes capital gains tax at 25%', () => {
    const out = calculateTax(data(), rates, 2024, baseInputs)
    expect(out.status).toBe('ok')
    if (out.status === 'ok') {
      expect(out.netCapitalGainIls).toBe('12400')
      expect(out.capitalGainsTaxIls).toBe('3100')       // 12400*25%
      expect(out.totalTaxLiabilityIlsRounded).toBe('3100')
    }
  })
  it('quarantines out-of-scope items without blocking', () => {
    const out = calculateTax(data({ outOfScope: [{ id: 'o1', kind: 'option', description: 'AAPL call', raw: 'opt' }] }), rates, 2024, baseInputs)
    expect(out.status).toBe('ok')
    if (out.status === 'ok') expect(out.quarantined).toHaveLength(1)
  })
  it('converts a missing rate into a blocking issue, not a crash', () => {
    const noRates: RatesMap = { USD: { '2024-03-10': '3.70' } } // missing 2019 open-date rate
    const out = calculateTax(data(), noRates, 2024, baseInputs)
    expect(out.status).toBe('blocked')
    if (out.status === 'blocked') expect(out.issues[0].code).toBe('missing-rate')
  })
})
