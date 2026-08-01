import { describe, it, expect } from 'vitest'
import type { ClosedLot, IBKRData, DividendRecord, InterestRecord, OutOfScopeRecord } from '@/lib/ibkr/types'
import type { UserInputs } from '@/lib/tax/user-inputs'

describe('domain types', () => {
  it('constructs an IBKRData with the new shape', () => {
    const lot: ClosedLot = {
      id: 'l1', ticker: 'AAPL', description: 'Apple', currency: 'USD',
      quantity: 10, openDate: '2019-05-01', saleDate: '2024-03-10',
      proceeds: '12000', cost: '10000', method: 'FIFO',
    }
    const div: DividendRecord = {
      id: 'd1', ticker: 'AAPL', description: 'Apple', currency: 'USD',
      payDate: '2024-02-15', gross: '100', withheldTax: '25', sourceCountry: 'US',
    }
    const int: InterestRecord = {
      id: 'i1', description: 'Broker Interest', currency: 'USD',
      payDate: '2024-06-30', gross: '40', withheldTax: '0', sourceCountry: 'US',
    }
    const oos: OutOfScopeRecord = { id: 'o1', kind: 'option', description: 'AAPL 240119C', raw: 'call option' }
    const data: IBKRData = {
      accountId: 'U123', baseCurrency: 'USD', lotMethod: 'FIFO', hasClosedLotSection: true,
      closedLots: [lot], dividends: [div], interest: [int], outOfScope: [oos],
    }
    const inputs: UserInputs = { substantialHoldings: [], broughtForwardLoss: '0' }
    expect(data.closedLots[0].openDate).toBe('2019-05-01')
    expect(inputs.broughtForwardLoss).toBe('0')
    expect(data.outOfScope[0].kind).toBe('option')
  })
})
