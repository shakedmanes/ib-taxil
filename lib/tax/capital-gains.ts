import { mul, sub } from './decimal'
import { getRate } from '@/lib/boi/lookup'
import { explainCapitalGain } from './explain'
import type { ClosedLot } from '@/lib/ibkr/types'
import type { RatesMap, ExchangeRateUsed } from '@/lib/boi/types'
import type { CapitalGainLine } from './types'

export function computeCapitalGains(
  lots: ClosedLot[],
  rates: RatesMap,
  taxYear: number,
  substantialHoldings: string[],
): { lines: CapitalGainLine[]; usedRates: ExchangeRateUsed[] } {
  const used: ExchangeRateUsed[] = []
  const record = (currency: string, date: string, rate: string) => {
    if (!used.find(u => u.currency === currency && u.date === date)) {
      used.push({ currency, date, rate })
    }
  }
  const inYear = (d: string) => d.startsWith(String(taxYear))

  const lines = lots
    .filter(l => inYear(l.saleDate))
    .map((l): CapitalGainLine => {
      const saleRate = getRate(rates, l.currency, l.saleDate)
      const openRate = getRate(rates, l.currency, l.openDate)
      record(l.currency, l.saleDate, saleRate)
      record(l.currency, l.openDate, openRate)
      const proceedsIls = mul(l.proceeds, saleRate)
      const costIls = mul(l.cost, openRate)
      const gainIls = sub(proceedsIls, costIls)
      const isSubstantial = substantialHoldings.includes(l.ticker)
      return {
        ticker: l.ticker, description: l.description,
        openDate: l.openDate, saleDate: l.saleDate, openRate, saleRate,
        proceedsIls, costIls, gainIls, isSubstantial,
        explanation: explainCapitalGain({
          ticker: l.ticker, proceedsIls, costIls, gainIls,
          saleDate: l.saleDate, saleRate, openDate: l.openDate, openRate,
        }),
      }
    })

  return { lines, usedRates: used }
}
