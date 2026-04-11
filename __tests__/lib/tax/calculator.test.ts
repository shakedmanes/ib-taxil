import { calculateTax } from '@/lib/tax/calculator'
import type { IBKRData } from '@/lib/ibkr/types'
import type { RatesMap } from '@/lib/boi/types'

const RATES: RatesMap = new Map([
  ['2024-03-15', '3.72'],
  ['2024-06-15', '3.80'],
])

const BASE_DATA: IBKRData = {
  accountId: 'U1234567',
  currency: 'USD',
  fromDate: '2024-01-01',
  toDate: '2024-12-31',
  trades: [
    {
      id: 'tx1',
      date: '2024-03-15',
      ticker: 'AAPL',
      description: 'Apple Inc',
      tradeType: 'sell',
      quantity: 10,
      priceUsd: '175.50',
      proceedsUsd: '1755.00',
      costUsd: '1200.00',
      gainLossUsd: '555.00',
      currency: 'USD',
    },
  ],
  dividends: [
    {
      id: 'dx1',
      date: '2024-06-15',
      ticker: 'MSFT',
      description: 'Microsoft Dividend',
      amountUsd: '100.00',
      withheldTaxUsd: '15.00',
      currency: 'USD',
    },
  ],
  foreignIncome: [],
}

describe('calculateTax', () => {
  it('converts capital gain to ILS using trade date rate', () => {
    const result = calculateTax(BASE_DATA, RATES, 2024)
    // 555.00 USD * 3.72 = 2064.60 ILS
    expect(result.netCapitalGainIls).toBe('2064.60')
  })

  it('applies 25% capital gains tax', () => {
    const result = calculateTax(BASE_DATA, RATES, 2024)
    // 2064.60 * 25% = 516.15
    expect(result.capitalGainsTaxIls).toBe('516.15')
  })

  it('converts dividend to ILS', () => {
    const result = calculateTax(BASE_DATA, RATES, 2024)
    // 100.00 * 3.80 = 380.00
    expect(result.totalDividendsIls).toBe('380.00')
  })

  it('applies 25% dividend tax and credits foreign withholding', () => {
    const result = calculateTax(BASE_DATA, RATES, 2024)
    // Israeli tax: 380.00 * 25% = 95.00
    // Foreign credit: 15.00 * 3.80 = 57.00 (capped at Israeli tax owed)
    // Net dividend tax: 95.00 - 57.00 = 38.00
    expect(result.dividendLines[0].israeliTaxDue).toBe('95.00')
    expect(result.dividendLines[0].creditApplied).toBe('57.00')
    expect(result.dividendLines[0].netTaxDue).toBe('38.00')
  })

  it('offsets capital losses against gains', () => {
    const dataWithLoss: IBKRData = {
      ...BASE_DATA,
      trades: [
        ...BASE_DATA.trades,
        {
          id: 'tx2', date: '2024-03-15', ticker: 'TSLA',
          description: 'Tesla', tradeType: 'sell',
          quantity: 5, priceUsd: '100', proceedsUsd: '500',
          costUsd: '800', gainLossUsd: '-300', currency: 'USD',
        },
      ],
    }
    const result = calculateTax(dataWithLoss, RATES, 2024)
    // Net gain: (555 - 300) * 3.72 = 255 * 3.72 = 948.60
    expect(result.netCapitalGainIls).toBe('948.60')
  })

  it('net gain is zero when losses exceed gains', () => {
    const dataNetLoss: IBKRData = {
      ...BASE_DATA,
      trades: [
        {
          id: 'tx1', date: '2024-03-15', ticker: 'TSLA',
          description: 'Tesla', tradeType: 'sell',
          quantity: 5, priceUsd: '100', proceedsUsd: '500',
          costUsd: '1000', gainLossUsd: '-500', currency: 'USD',
        },
      ],
    }
    const result = calculateTax(dataNetLoss, RATES, 2024)
    expect(result.netCapitalGainIls).toBe('0')
    expect(result.capitalGainsTaxIls).toBe('0.00')
  })

  it('includes exchange rates used in result', () => {
    const result = calculateTax(BASE_DATA, RATES, 2024)
    expect(result.exchangeRatesUsed.length).toBeGreaterThan(0)
    const dates = result.exchangeRatesUsed.map(r => r.date)
    expect(dates).toContain('2024-03-15')
    expect(dates).toContain('2024-06-15')
  })

  it('totals tax liability correctly', () => {
    const result = calculateTax(BASE_DATA, RATES, 2024)
    // capital gains tax (516.15) + dividend net tax (38.00) = 554.15
    expect(result.totalTaxLiabilityIls).toBe('554.15')
  })
})
