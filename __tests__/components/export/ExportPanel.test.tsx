import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExportPanel } from '@/components/export/ExportPanel'
import { Step5Export } from '@/components/wizard/Step5Export'
import type { TaxResult } from '@/lib/tax/types'

vi.mock('@/lib/reports/pdf', () => ({ generatePdf: vi.fn() }))
vi.mock('@/lib/reports/excel', () => ({ generateExcel: vi.fn().mockResolvedValue(undefined) }))

import { generatePdf } from '@/lib/reports/pdf'
import { generateExcel } from '@/lib/reports/excel'

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
  capitalGainLines: [],
  dividendLines: [],
  foreignIncomeLines: [],
  exchangeRatesUsed: [],
}

describe('ExportPanel', () => {
  it('renders "Download PDF" button', () => {
    render(<ExportPanel result={mockResult} taxYear={2024} />)
    expect(screen.getByText('Download PDF')).toBeInTheDocument()
  })

  it('renders "Download Excel" button', () => {
    render(<ExportPanel result={mockResult} taxYear={2024} />)
    expect(screen.getByText('Download Excel')).toBeInTheDocument()
  })

  it('renders "On-Screen Form" section', () => {
    render(<ExportPanel result={mockResult} taxYear={2024} />)
    expect(screen.getByText('On-Screen Form')).toBeInTheDocument()
  })

  it('renders all 4 ITA field guide rows', () => {
    render(<ExportPanel result={mockResult} taxYear={2024} />)
    expect(screen.getByText('Schedule B, Line 1')).toBeInTheDocument()
    expect(screen.getByText('Schedule B, Line 2')).toBeInTheDocument()
    expect(screen.getByText('Dividends, Line 1')).toBeInTheDocument()
    expect(screen.getByText('Foreign Tax Credit')).toBeInTheDocument()
  })

  it('calls generatePdf when PDF button is clicked', () => {
    render(<ExportPanel result={mockResult} taxYear={2024} />)
    fireEvent.click(screen.getByText('Download PDF'))
    expect(generatePdf).toHaveBeenCalledWith(mockResult, 2024)
  })

  it('calls generateExcel when Excel button is clicked', async () => {
    render(<ExportPanel result={mockResult} taxYear={2024} />)
    fireEvent.click(screen.getByText('Download Excel'))
    await waitFor(() => {
      expect(generateExcel).toHaveBeenCalledWith(mockResult, 2024)
    })
  })
})

describe('Step5Export', () => {
  it('renders the "Your {year} Tax Reports" heading', () => {
    render(<Step5Export result={mockResult} taxYear={2024} />)
    expect(screen.getByText('Your 2024 Tax Reports')).toBeInTheDocument()
  })
})
