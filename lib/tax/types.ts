import type { Explanation } from './explain'
import type { ExchangeRateUsed } from '@/lib/boi/types'

export interface CapitalGainLine {
  ticker: string
  description: string
  openDate: string
  saleDate: string
  openRate: string
  saleRate: string
  proceedsIls: string
  costIls: string
  gainIls: string       // signed real gain (may be negative)
  isSubstantial: boolean
  explanation: Explanation
}

export interface DividendLine {
  ticker: string
  payDate: string
  fxRate: string
  grossIls: string
  rate: string          // 25 or 30
  israeliTaxIls: string
  withheldIls: string
  creditIls: string
  netTaxIls: string
  overWithheldIls: string // >0 => reclaimable, flagged
  sourceCountry: string
  explanation: Explanation
}

export interface InterestLine {
  description: string
  payDate: string
  fxRate: string
  grossIls: string
  rate: string
  israeliTaxIls: string
  withheldIls: string
  creditIls: string
  netTaxIls: string
  overWithheldIls: string
  sourceCountry: string
  explanation: Explanation
}

export interface CountryCreditLine {
  country: string
  basket: 'dividend' | 'interest'
  foreignTaxIls: string
  ceilingIls: string
  creditedIls: string
  excessCarryForwardIls: string   // §205א 5-year carry
  explanation: Explanation
}

export interface QuarantinedItem {
  kind: string
  description: string
  explanation: Explanation
}

export interface BlockingIssue {
  code: 'missing-closed-lots' | 'missing-rate' | 'unsupported-currency' | 'unsupported-year'
  count: number
  explanation: Explanation
}

export interface TaxResult {
  status: 'ok'
  taxYear: number
  // capital gains
  capitalGainLines: CapitalGainLine[]
  totalGainsIls: string
  totalLossesIls: string
  // losses (ADR-0004)
  currentLossUsedAgainstGainsIls: string
  currentLossUsedAgainstIncomeIls: string
  broughtForwardUsedIls: string
  carryForwardLossIls: string
  netCapitalGainIls: string
  capitalGainsTaxIls: string
  // income
  dividendLines: DividendLine[]
  interestLines: InterestLine[]
  dividendsTaxIls: string       // net of credit
  interestTaxIls: string        // net of credit
  // credits
  countryCredits: CountryCreditLine[]
  totalCreditIls: string
  totalExcessCreditCarryForwardIls: string
  // surtax
  surtaxIls: string
  surtaxExplanation: Explanation | null
  // totals (output-rounded to whole shekels)
  totalTaxLiabilityIlsRounded: string
  lossOffsetExplanation: Explanation
  quarantined: QuarantinedItem[]
  exchangeRatesUsed: ExchangeRateUsed[]
}

export interface BlockedResult {
  status: 'blocked'
  issues: BlockingIssue[]
}

export type EngineOutput = TaxResult | BlockedResult
