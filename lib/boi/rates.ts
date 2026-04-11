import type { ExchangeRate, RatesMap } from './types'

const BOI_API =
  'https://edge.boi.gov.il/FusionEdgeServer/sdmx/v2/data/dataflow/BOI.STATISTICS/EXR/1.0/RER_USD_ILS'

export async function fetchBoiRates(year: number): Promise<ExchangeRate[]> {
  const url = `${BOI_API}?startperiod=${year}-01-01&endperiod=${year}-12-31&format=jsondata`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`BOI API error: ${res.status} ${res.statusText}`)
  const json = await res.json() as any

  // BOI SDMX-JSON structure: dates in dimensions, values in dataSets
  const dates: string[] =
    json?.structure?.dimensions?.observation?.[0]?.values?.map(
      (v: { id: string }) => v.id,
    ) ?? []
  const observations: Record<string, [number]> =
    json?.dataSets?.[0]?.series?.['0:0:0:0']?.observations ?? {}

  return dates
    .map((date, i) => ({
      date,
      usdToIls: String(observations[String(i)]?.[0] ?? ''),
    }))
    .filter((r) => r.usdToIls !== '')
}

export function buildRatesMap(rates: ExchangeRate[]): RatesMap {
  const map: RatesMap = new Map()
  for (const r of rates) map.set(r.date, r.usdToIls)
  return map
}

export function getRateForDate(map: RatesMap, date: string): string {
  if (map.has(date)) return map.get(date)!

  // Walk back up to 7 days to handle weekends and Israeli holidays
  const d = new Date(date)
  for (let i = 1; i <= 7; i++) {
    d.setDate(d.getDate() - 1)
    const key = d.toISOString().slice(0, 10)
    if (map.has(key)) return map.get(key)!
  }

  throw new Error(`No BOI exchange rate found for ${date} or the 7 days prior`)
}
