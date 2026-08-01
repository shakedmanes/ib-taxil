/** ISO 4217 currency code, e.g. 'USD', 'EUR'. */
export type Currency = string

/** A quantity of one security bought on openDate and sold on saleDate. */
export interface ClosedLot {
  id: string
  ticker: string
  description: string
  currency: Currency
  quantity: number
  openDate: string   // ISO YYYY-MM-DD (purchase)
  saleDate: string   // ISO YYYY-MM-DD (sale / realization)
  proceeds: string   // decimal string, sale-currency, gross positive
  cost: string       // decimal string, sale-currency, positive
  method: string     // IBKR lot-matching method label, e.g. 'FIFO'
}

export interface DividendRecord {
  id: string
  ticker: string
  description: string
  currency: Currency
  payDate: string        // receipt/payment date
  gross: string          // decimal string, positive
  withheldTax: string    // decimal string, positive
  sourceCountry: string  // ISO country code, '' if unknown
}

export interface InterestRecord {
  id: string
  description: string
  currency: Currency
  payDate: string
  gross: string
  withheldTax: string
  sourceCountry: string
}

/** Any imported record the engine does not compute — quarantined, never guessed. */
export interface OutOfScopeRecord {
  id: string
  kind: string          // 'option' | 'bond' | 'short' | 'forex' | 'unknown-cash'
  description: string
  raw: string           // short human summary for the quarantine list
}

export interface IBKRData {
  accountId: string
  baseCurrency: Currency
  lotMethod: string             // account-configured method label
  hasClosedLotSection: boolean  // false => capital gains cannot be computed
  closedLots: ClosedLot[]
  dividends: DividendRecord[]
  interest: InterestRecord[]
  outOfScope: OutOfScopeRecord[]
}
