export type TradeType = 'buy' | 'sell'
export type RecordType = 'trade' | 'dividend' | 'income'

export interface Trade {
  id: string
  date: string          // ISO date YYYY-MM-DD
  ticker: string
  description: string
  tradeType: TradeType
  quantity: number
  priceUsd: string      // decimal string, never a float
  proceedsUsd: string
  costUsd: string
  gainLossUsd: string
  currency: string
}

export interface Dividend {
  id: string
  date: string
  ticker: string
  description: string
  amountUsd: string
  withheldTaxUsd: string
  currency: string
}

export interface ForeignIncome {
  id: string
  date: string
  description: string
  amountUsd: string
  withheldTaxUsd: string
  currency: string
}

export interface IBKRData {
  accountId: string
  currency: string
  fromDate: string
  toDate: string
  trades: Trade[]
  dividends: Dividend[]
  foreignIncome: ForeignIncome[]
}
