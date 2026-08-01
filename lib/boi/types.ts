import type { Currency } from '@/lib/ibkr/types'

/** currency -> (ISO date 'YYYY-MM-DD') -> representative rate as decimal string. */
export type RatesMap = Record<Currency, Record<string, string>>

export interface ExchangeRateUsed {
  currency: Currency
  date: string
  rate: string
}
