import type { TaxResult } from '@/lib/tax/types'

export const FILING_PACKAGE_VERSION = '1.0.0'

export interface FilingPackageSummary {
  taxYear: number
  netCapitalGainIls: string
  capitalGainsTaxIls: string
  dividendsTaxIls: string
  interestTaxIls: string
  totalCreditIls: string
  surtaxIls: string
  totalTaxLiabilityIls: string
  carryForwardLossIls: string
  excessCreditCarryForwardIls: string
}

export interface FilingPackage {
  schemaVersion: string
  generatedAt: string
  summary: FilingPackageSummary
  result: TaxResult
}

export function buildFilingPackage(result: TaxResult, meta: { generatedAt: string }): FilingPackage {
  return {
    schemaVersion: FILING_PACKAGE_VERSION,
    generatedAt: meta.generatedAt,
    summary: {
      taxYear: result.taxYear,
      netCapitalGainIls: result.netCapitalGainIls,
      capitalGainsTaxIls: result.capitalGainsTaxIls,
      dividendsTaxIls: result.dividendsTaxIls,
      interestTaxIls: result.interestTaxIls,
      totalCreditIls: result.totalCreditIls,
      surtaxIls: result.surtaxIls,
      totalTaxLiabilityIls: result.totalTaxLiabilityIlsRounded,
      carryForwardLossIls: result.carryForwardLossIls,
      excessCreditCarryForwardIls: result.totalExcessCreditCarryForwardIls,
    },
    result,
  }
}
