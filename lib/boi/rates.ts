import type { RatesMap } from './types'

export function assembleRatesMap(perCurrency: Record<string, { date: string; rate: string }[]>): RatesMap {
  const map: RatesMap = {}
  for (const [currency, rows] of Object.entries(perCurrency)) {
    map[currency] = {}
    for (const r of rows) map[currency][r.date] = r.rate
  }
  return map
}

export async function fetchRatesMap(currencies: string[], start: string, end: string): Promise<RatesMap> {
  const results = await Promise.all(currencies.map(async (currency) => {
    const res = await fetch(`/api/boi-rates?currency=${currency}&startperiod=${start}&endperiod=${end}`)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? `BOI error for ${currency}: ${res.status}`)
    }
    const json = await res.json() as { currency: string; rates: { date: string; rate: string }[] }
    return [currency, json.rates] as const
  }))
  return assembleRatesMap(Object.fromEntries(results))
}
