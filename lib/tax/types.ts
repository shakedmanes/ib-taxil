export interface CapitalGainLine {
  ticker: string
  description: string
  saleDateStr: string
  buyDateStr: string
  proceedsIls: string
  costIls: string
  gainLossIls: string
  taxUsd: string
  exchangeRateUsed: string
}

export interface DividendLine {
  ticker: string
  date: string
  grossIls: string
  withheldTaxIls: string
  israeliTaxDue: string
  creditApplied: string
  netTaxDue: string
}

export interface ForeignIncomeLine {
  description: string
  date: string
  grossIls: string
  withheldTaxIls: string
  israeliTaxDue: string
  creditApplied: string
  netTaxDue: string
}

export interface TaxResult {
  taxYear: number
  totalCapitalGainsIls: string
  totalCapitalLossesIls: string
  netCapitalGainIls: string
  capitalGainsTaxIls: string
  totalDividendsIls: string
  dividendsTaxIls: string
  totalForeignIncomeIls: string
  foreignIncomeTaxIls: string
  totalForeignTaxCreditIls: string
  totalTaxLiabilityIls: string
  capitalGainLines: CapitalGainLine[]
  dividendLines: DividendLine[]
  foreignIncomeLines: ForeignIncomeLine[]
  exchangeRatesUsed: Array<{ date: string; rate: string }>
}
