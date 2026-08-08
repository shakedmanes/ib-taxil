import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { EngineOutput } from '@/lib/tax/types'
import { Step5Summary } from '@/components/wizard/Step5Summary'
vi.mock('next-intl')

describe('Step5Summary', () => {
  it('shows fix-it guidance and no totals when blocked', () => {
    render(
      <Step5Summary
        output={{
          status: 'blocked',
          issues: [{ code: 'missing-closed-lots', count: 3, explanation: { code: 'block.missingClosedLots', params: { count: '3' } } }],
        }}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />,
    )
    expect(screen.getByText(/closed-lot|flex query/i)).toBeInTheDocument()
    expect(screen.queryByText(/estimated tax liability/i)).not.toBeInTheDocument()
  })

  it('shows totals when ok', () => {
    render(
      <Step5Summary
        output={{
          status: 'ok', taxYear: 2024, totalTaxLiabilityIlsRounded: '3100',
          capitalGainLines: [], dividendLines: [], interestLines: [], countryCredits: [],
          quarantined: [], exchangeRatesUsed: [], netCapitalGainIls: '12400',
          capitalGainsTaxIls: '3100', dividendsTaxIls: '0', interestTaxIls: '0',
          totalCreditIls: '0', surtaxIls: '0', totalExcessCreditCarryForwardIls: '0',
          carryForwardLossIls: '0', totalGainsIls: '12400', totalLossesIls: '0',
          currentLossUsedAgainstGainsIls: '0', currentLossUsedAgainstIncomeIls: '0',
          broughtForwardUsedIls: '0', surtaxExplanation: null,
          lossOffsetExplanation: { code: 'explain.lossOffset', params: {} },
        } as unknown as EngineOutput}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />,
    )
    expect(screen.getAllByText(/3,?100/).length).toBeGreaterThan(0)
  })
})
