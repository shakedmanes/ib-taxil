import { describe, it, expect } from 'vitest'
import { neededCurrencies, dateSpan } from '@/lib/boi/plan'
import type { IBKRData } from '@/lib/ibkr/types'

const data: IBKRData = {
  accountId: 'U1', baseCurrency: 'USD', lotMethod: 'FIFO', hasClosedLotSection: true,
  closedLots: [
    { id: 'a', ticker: 'AAPL', description: '', currency: 'USD', quantity: 1, openDate: '2019-05-01', saleDate: '2024-03-10', proceeds: '1', cost: '1', method: 'FIFO' },
    { id: 'b', ticker: 'SAP', description: '', currency: 'EUR', quantity: 1, openDate: '2022-01-03', saleDate: '2024-06-01', proceeds: '1', cost: '1', method: 'FIFO' },
  ],
  dividends: [], interest: [], outOfScope: [],
}

describe('boi plan', () => {
  it('collects distinct currencies', () => {
    expect(neededCurrencies(data).sort()).toEqual(['EUR', 'USD'])
  })
  it('spans from earliest open date to tax-year end', () => {
    expect(dateSpan(data, 2024)).toEqual({ start: '2019-05-01', end: '2024-12-31' })
  })
})
