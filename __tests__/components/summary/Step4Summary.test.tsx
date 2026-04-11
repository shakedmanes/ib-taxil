import { render, screen, fireEvent } from '@testing-library/react'
import { TaxSummaryHero } from '@/components/summary/TaxSummaryHero'
import { TaxBreakdown } from '@/components/summary/TaxBreakdown'
import { Step4Summary } from '@/components/wizard/Step4Summary'
import type { TaxResult } from '@/lib/tax/types'

const mockResult: TaxResult = {
  taxYear: 2024,
  totalCapitalGainsIls: '10000.00',
  totalCapitalLossesIls: '2000.00',
  netCapitalGainIls: '8000.00',
  capitalGainsTaxIls: '2000.00',
  totalDividendsIls: '500.00',
  dividendsTaxIls: '87.50',
  totalForeignIncomeIls: '0.00',
  foreignIncomeTaxIls: '0.00',
  totalForeignTaxCreditIls: '62.50',
  totalTaxLiabilityIls: '2025.00',
  capitalGainLines: [
    {
      ticker: 'AAPL',
      description: 'Apple Inc.',
      saleDateStr: '2024-03-15',
      buyDateStr: '2023-01-10',
      proceedsIls: '18000.00',
      costIls: '14400.00',
      gainLossIls: '3600.00',
      taxUsd: '240.00',
      exchangeRateUsed: '3.7',
    },
  ],
  dividendLines: [
    {
      ticker: 'AAPL',
      date: '2024-01-10',
      grossIls: '92.50',
      withheldTaxIls: '13.88',
      israeliTaxDue: '23.13',
      creditApplied: '13.88',
      netTaxDue: '9.25',
    },
  ],
  foreignIncomeLines: [],
  exchangeRatesUsed: [
    { date: '2024-03-15', rate: '3.7' },
  ],
}

describe('TaxSummaryHero', () => {
  it('renders the tax year in the "In {year}" sentence', () => {
    render(<TaxSummaryHero result={mockResult} taxYear={2024} />)
    expect(screen.getByText('2024')).toBeInTheDocument()
  })

  it('renders "Net Capital Gain" card with formatted ILS value', () => {
    render(<TaxSummaryHero result={mockResult} taxYear={2024} />)
    expect(screen.getByText('Net Capital Gain')).toBeInTheDocument()
    // formatIls('8000.00') → ₪8,000.00
    const cards = screen.getAllByText(/₪8,000\.00/)
    expect(cards.length).toBeGreaterThan(0)
  })

  it('renders "Estimated Tax Liability" card', () => {
    render(<TaxSummaryHero result={mockResult} taxYear={2024} />)
    expect(screen.getByText('Estimated Tax Liability')).toBeInTheDocument()
    const liabilityValues = screen.getAllByText(/₪2,025\.00/)
    expect(liabilityValues.length).toBeGreaterThan(0)
  })
})

describe('TaxBreakdown', () => {
  it('renders the Capital Gains section title (collapsed by default)', () => {
    render(<TaxBreakdown result={mockResult} />)
    expect(screen.getByText(/Capital Gains — Tax:/)).toBeInTheDocument()
  })

  it('expands Capital Gains section when clicked and shows ticker rows', () => {
    render(<TaxBreakdown result={mockResult} />)
    const capitalGainsButton = screen.getByText(/Capital Gains — Tax:/)
    fireEvent.click(capitalGainsButton)
    expect(screen.getByText('AAPL')).toBeInTheDocument()
    expect(screen.getByText('2024-03-15')).toBeInTheDocument()
  })

  it('expands Dividends section when clicked and shows ticker rows', () => {
    render(<TaxBreakdown result={mockResult} />)
    const dividendsButton = screen.getByText(/Dividends — Net Tax Due:/)
    fireEvent.click(dividendsButton)
    // After clicking, AAPL appears in dividends table
    const appleRows = screen.getAllByText('AAPL')
    expect(appleRows.length).toBeGreaterThan(0)
    expect(screen.getByText('2024-01-10')).toBeInTheDocument()
  })
})

describe('Step4Summary', () => {
  it('renders the "Tax Summary — {year}" heading', () => {
    const onNext = vi.fn()
    render(<Step4Summary result={mockResult} taxYear={2024} onNext={onNext} />)
    expect(screen.getByText('Tax Summary — 2024')).toBeInTheDocument()
  })

  it('calls onNext when "Generate Reports →" is clicked', () => {
    const onNext = vi.fn()
    render(<Step4Summary result={mockResult} taxYear={2024} onNext={onNext} />)
    fireEvent.click(screen.getByText('Generate Reports →'))
    expect(onNext).toHaveBeenCalledTimes(1)
  })
})
