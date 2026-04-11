export interface ExchangeRate {
  date: string    // YYYY-MM-DD
  usdToIls: string // decimal string
}

export type RatesMap = Map<string, string>  // date → ILS rate (decimal string)
