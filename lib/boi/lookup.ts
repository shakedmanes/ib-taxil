import type { RatesMap } from './types'
import type { Currency } from '@/lib/ibkr/types'

// Cache the ascending date index per per-currency map so repeated lookups on a
// hot path (getRate is called ~2× per closed lot) don't re-sort every time.
// Keyed by the map object itself, so a new rates map naturally gets a fresh index.
const sortedIndex = new WeakMap<Record<string, string>, string[]>()

function ascendingDates(forCurrency: Record<string, string>): string[] {
  let dates = sortedIndex.get(forCurrency)
  if (!dates) {
    dates = Object.keys(forCurrency).sort() // ISO dates sort chronologically
    sortedIndex.set(forCurrency, dates)
  }
  return dates
}

/**
 * Rate for a currency on a date; if none published that day, the most recent
 * prior published rate (ADR-0009: no arbitrary look-back cap). Throws if there
 * is no rate at or before the date, or the currency is absent.
 */
export function getRate(rates: RatesMap, currency: Currency, date: string): string {
  const forCurrency = rates[currency]
  if (!forCurrency) throw new Error(`No exchange rates loaded for currency ${currency}`)
  if (forCurrency[date]) return forCurrency[date]

  // Binary search for the rightmost published date on or before `date`.
  const dates = ascendingDates(forCurrency)
  let lo = 0, hi = dates.length - 1, found = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (dates[mid] <= date) { found = mid; lo = mid + 1 } else { hi = mid - 1 }
  }
  if (found < 0) throw new Error(`No ${currency} rate published on or before ${date}`)
  return forCurrency[dates[found]]
}
