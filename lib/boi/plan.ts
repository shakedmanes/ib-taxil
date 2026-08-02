import type { IBKRData } from '@/lib/ibkr/types'

export function neededCurrencies(data: IBKRData): string[] {
  const set = new Set<string>()
  data.closedLots.forEach(l => set.add(l.currency))
  data.dividends.forEach(d => set.add(d.currency))
  data.interest.forEach(i => set.add(i.currency))
  return [...set]
}

export function dateSpan(data: IBKRData, taxYear: number): { start: string; end: string } {
  const dates = [`${taxYear}-01-01`, ...data.closedLots.map(l => l.openDate)].filter(Boolean)
  const start = dates.sort()[0]
  return { start, end: `${taxYear}-12-31` }
}
