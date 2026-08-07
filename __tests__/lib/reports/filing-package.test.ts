import { describe, it, expect } from 'vitest'
import { buildFilingPackage, FILING_PACKAGE_VERSION } from '@/lib/reports/filing-package'
import type { TaxResult } from '@/lib/tax/types'

const result = {
  status: 'ok', taxYear: 2024, provisional: null,
  capitalGainLines: [], totalGainsIls: '12400', totalLossesIls: '0',
  currentLossUsedAgainstGainsIls: '0', currentLossUsedAgainstIncomeIls: '0',
  broughtForwardUsedIls: '0', carryForwardLossIls: '0',
  netCapitalGainIls: '12400', capitalGainsTaxIls: '3100',
  dividendLines: [], interestLines: [], dividendsTaxIls: '0', interestTaxIls: '0',
  countryCredits: [], totalCreditIls: '0', totalExcessCreditCarryForwardIls: '0',
  surtaxIls: '0', surtaxExplanation: null,
  totalTaxLiabilityIlsRounded: '3100',
  lossOffsetExplanation: { code: 'explain.lossOffset', params: {} },
  quarantined: [], exchangeRatesUsed: [],
} as TaxResult

describe('buildFilingPackage', () => {
  const pkg = buildFilingPackage(result, { generatedAt: '2026-08-01T00:00:00Z' })
  it('is versioned and JSON-serializable', () => {
    expect(pkg.schemaVersion).toBe(FILING_PACKAGE_VERSION)
    expect(() => JSON.parse(JSON.stringify(pkg))).not.toThrow()
  })
  it('carries the summary and full result', () => {
    expect(pkg.summary.totalTaxLiabilityIls).toBe('3100')
    expect(pkg.summary.netCapitalGainIls).toBe('12400')
    expect(pkg.result.taxYear).toBe(2024)
  })
})
