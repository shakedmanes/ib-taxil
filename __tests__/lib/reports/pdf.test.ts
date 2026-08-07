import { describe, it, expect } from 'vitest'
import { generatePdf } from '@/lib/reports/pdf'
import { buildFilingPackage } from '@/lib/reports/filing-package'
import type { TaxResult } from '@/lib/tax/types'

const result = {
  status: 'ok', taxYear: 2024, provisional: null, capitalGainLines: [], dividendLines: [], interestLines: [],
  netCapitalGainIls: '12400', capitalGainsTaxIls: '3100', dividendsTaxIls: '0', interestTaxIls: '0',
  totalCreditIls: '0', surtaxIls: '0', totalTaxLiabilityIlsRounded: '3100', countryCredits: [],
  totalExcessCreditCarryForwardIls: '0', carryForwardLossIls: '0', quarantined: [], exchangeRatesUsed: [],
  totalGainsIls: '12400', totalLossesIls: '0', currentLossUsedAgainstGainsIls: '0',
  currentLossUsedAgainstIncomeIls: '0', broughtForwardUsedIls: '0', surtaxExplanation: null,
  lossOffsetExplanation: { code: '', params: {} },
} as TaxResult

describe('generatePdf', () => {
  it('produces a non-empty PDF blob', async () => {
    const blob = await generatePdf(buildFilingPackage(result, { generatedAt: '2026-08-01' }))
    expect(blob.size).toBeGreaterThan(0)
    expect(blob.type).toContain('pdf')
  })
})
