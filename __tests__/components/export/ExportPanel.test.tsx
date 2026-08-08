import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { TaxResult } from '@/lib/tax/types'
import { ExportPanel } from '@/components/export/ExportPanel'
vi.mock('next-intl')
vi.mock('@/lib/reports/pdf', () => ({ generatePdf: vi.fn() }))
vi.mock('@/lib/reports/excel', () => ({ generateExcel: vi.fn() }))

describe('ExportPanel', () => {
  const result = {
    taxYear: 2024, netCapitalGainIls: '12400', capitalGainsTaxIls: '3100',
    dividendLines: [], interestLines: [], totalCreditIls: '0', surtaxIls: '0',
    totalTaxLiabilityIlsRounded: '3100',
  } as unknown as TaxResult

  it('renders the field guide rows from the result', () => {
    render(<ExportPanel result={result} />)
    expect(screen.getByText(/1325/)).toBeInTheDocument()
    expect(screen.getByText(/12,?400/)).toBeInTheDocument()
  })

  it('offers PDF, Excel and Filing Package downloads', () => {
    render(<ExportPanel result={result} />)
    expect(screen.getByText('Download PDF')).toBeInTheDocument()
    expect(screen.getByText('Download Excel')).toBeInTheDocument()
    expect(screen.getByText('Filing Package (JSON)')).toBeInTheDocument()
  })
})
