import { mul, pct } from './decimal'
import { getRate } from '@/lib/boi/lookup'
import { getYearRates } from './rates'
import { explainInterest } from './explain'
import type { InterestRecord } from '@/lib/ibkr/types'
import type { RatesMap, ExchangeRateUsed } from '@/lib/boi/types'
import type { InterestLine } from './types'

export function computeInterest(
  items: InterestRecord[],
  rates: RatesMap,
  taxYear: number,
): { lines: InterestLine[]; usedRates: ExchangeRateUsed[] } {
  const y = getYearRates(taxYear)
  const used: ExchangeRateUsed[] = []
  const record = (c: string, d: string, r: string) => {
    if (!used.find(u => u.currency === c && u.date === d)) used.push({ currency: c, date: d, rate: r })
  }
  const inYear = (d: string) => d.startsWith(String(taxYear))

  const lines = items.filter(i => inYear(i.payDate)).map((i): InterestLine => {
    const fxRate = getRate(rates, i.currency, i.payDate)
    record(i.currency, i.payDate, fxRate)
    const grossIls = mul(i.gross, fxRate)
    const withheldIls = mul(i.withheldTax, fxRate)
    const israeliTaxIls = pct(grossIls, y.interestRate)
    return {
      description: i.description, payDate: i.payDate, fxRate, grossIls, rate: y.interestRate,
      israeliTaxIls, withheldIls, creditIls: '0', netTaxIls: israeliTaxIls,
      overWithheldIls: '0', sourceCountry: i.sourceCountry || 'UNKNOWN',
      explanation: explainInterest({
        description: i.description, grossIls, rate: y.interestRate, israeliTaxIls,
        creditIls: '0', netTaxIls: israeliTaxIls, payDate: i.payDate, fxRate,
      }),
    }
  })
  return { lines, usedRates: used }
}
