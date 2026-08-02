import { mul, pct } from './decimal'
import { getRate } from '@/lib/boi/lookup'
import { getYearRates } from './rates'
import { explainDividend } from './explain'
import type { DividendRecord } from '@/lib/ibkr/types'
import type { RatesMap, ExchangeRateUsed } from '@/lib/boi/types'
import type { DividendLine } from './types'

export function computeDividends(
  divs: DividendRecord[],
  rates: RatesMap,
  taxYear: number,
  substantialHoldings: string[],
): { lines: DividendLine[]; usedRates: ExchangeRateUsed[] } {
  const y = getYearRates(taxYear)
  const used: ExchangeRateUsed[] = []
  const record = (c: string, d: string, r: string) => {
    if (!used.find(u => u.currency === c && u.date === d)) used.push({ currency: c, date: d, rate: r })
  }
  const inYear = (d: string) => d.startsWith(String(taxYear))

  const lines = divs.filter(d => inYear(d.payDate)).map((d): DividendLine => {
    const fxRate = getRate(rates, d.currency, d.payDate)
    record(d.currency, d.payDate, fxRate)
    const grossIls = mul(d.gross, fxRate)
    const withheldIls = mul(d.withheldTax, fxRate)
    const rate = substantialHoldings.includes(d.ticker) ? y.substantialHolderRate : y.dividendRate
    const israeliTaxIls = pct(grossIls, rate)
    return {
      ticker: d.ticker, payDate: d.payDate, fxRate, grossIls, rate,
      israeliTaxIls, withheldIls, creditIls: '0', netTaxIls: israeliTaxIls,
      overWithheldIls: '0', sourceCountry: d.sourceCountry || 'UNKNOWN',
      explanation: explainDividend({
        ticker: d.ticker, grossIls, rate, israeliTaxIls,
        creditIls: '0', netTaxIls: israeliTaxIls, payDate: d.payDate, fxRate,
      }),
    }
  })
  return { lines, usedRates: used }
}
