import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Step7Filing } from '@/components/wizard/Step7Filing'
import type { TaxResult } from '@/lib/tax/types'

vi.mock('next-intl')

const result = {
  status: 'ok', taxYear: 2025,
  capitalGainLines: [{
    ticker: 'NVDA', description: 'NVIDIA', openDate: '2024-11-01', saleDate: '2025-02-10',
    openRate: '3.6', saleRate: '3.7', proceedsIls: '33000', costIls: '29000', gainIls: '4000',
    isSubstantial: false, explanation: { code: 'explain.capitalGain', params: {} },
  }],
  totalGainsIls: '4000', totalLossesIls: '0',
  currentLossUsedAgainstGainsIls: '0', currentLossUsedAgainstIncomeIls: '0',
  broughtForwardUsedIls: '0', carryForwardLossIls: '0',
  netCapitalGainIls: '4000', capitalGainsTaxIls: '1000',
  dividendLines: [{
    ticker: 'KO', payDate: '2025-03-01', fxRate: '3.7', grossIls: '370', rate: '25',
    israeliTaxIls: '92.5', withheldIls: '55.5', creditIls: '55.5', netTaxIls: '37',
    overWithheldIls: '18.5', sourceCountry: 'US', explanation: { code: 'explain.dividend', params: {} },
  }],
  interestLines: [],
  dividendsTaxIls: '37', interestTaxIls: '0',
  countryCredits: [{
    country: 'US', basket: 'dividend', foreignTaxIls: '55.5', ceilingIls: '92.5',
    creditedIls: '55.5', excessCarryForwardIls: '0', explanation: { code: 'explain.credit', params: {} },
  }],
  totalCreditIls: '55.5', totalExcessCreditCarryForwardIls: '0',
  surtaxIls: '0', surtaxExplanation: null,
  totalTaxLiabilityIlsRounded: '1037',
  lossOffsetExplanation: { code: 'explain.lossOffset', params: {} },
  quarantined: [], exchangeRatesUsed: [],
} as unknown as TaxResult

describe('Step7Filing', () => {
  it('walks through each form with the computed figures', () => {
    render(<Step7Filing result={result} onBack={vi.fn()} />)
    // capital-gains appendix + per-lot row + net gain
    expect(screen.getAllByText(/1325/).length).toBeGreaterThan(0)
    expect(screen.getByText('NVDA')).toBeInTheDocument()
    expect(screen.getAllByText(/4,000/).length).toBeGreaterThan(0)
    // foreign-income appendix + total tax
    expect(screen.getAllByText(/1324/).length).toBeGreaterThan(0)
    expect(screen.getByText(/1,037/)).toBeInTheDocument()
  })

  it('flags over-withheld tax to reclaim from the source country', () => {
    render(<Step7Filing result={result} onBack={vi.fn()} />)
    expect(screen.getByText(/above the cap/i)).toBeInTheDocument()
  })
})
