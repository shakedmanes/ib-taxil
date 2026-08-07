import type { IBKRData } from '@/lib/ibkr/types'

export function neededCurrencies(data: IBKRData): string[] {
  const set = new Set<string>()
  data.closedLots.forEach(l => set.add(l.currency))
  data.dividends.forEach(d => set.add(d.currency))
  data.interest.forEach(i => set.add(i.currency))
  return [...set]
}

export function dateSpan(data: IBKRData, taxYear: number): { start: string; end: string } {
  // Start no later than mid-December of the prior year so getRate always has a
  // published rate on or before any early-January income date (BOI publishes no
  // Jan-1 rate; without this buffer an income-only file could block on 'missing-rate').
  const buffer = `${taxYear - 1}-12-15`
  const dates = [buffer, ...data.closedLots.map(l => l.openDate)].filter(Boolean)
  const start = dates.sort()[0]
  return { start, end: `${taxYear}-12-31` }
}
