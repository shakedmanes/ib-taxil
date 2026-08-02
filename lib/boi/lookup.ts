import type { RatesMap } from './types'
import type { Currency } from '@/lib/ibkr/types'

/**
 * Rate for a currency on a date; if none published that day, the most recent
 * prior published rate (ADR-0009: no arbitrary look-back cap). Throws if there
 * is no rate at or before the date, or the currency is absent.
 */
export function getRate(rates: RatesMap, currency: Currency, date: string): string {
  const forCurrency = rates[currency]
  if (!forCurrency) throw new Error(`No exchange rates loaded for currency ${currency}`)
  if (forCurrency[date]) return forCurrency[date]
  const priorDates = Object.keys(forCurrency).filter(d => d <= date).sort()
  const last = priorDates[priorDates.length - 1]
  if (!last) throw new Error(`No ${currency} rate published on or before ${date}`)
  return forCurrency[last]
}
