import { render, screen, fireEvent } from '@testing-library/react'
import { Step1TaxYear } from '@/components/wizard/Step1TaxYear'
import { selectableYears, MIN_SUPPORTED_YEAR } from '@/lib/tax/rates'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({
    title: 'Select Tax Year',
    subtitle: 'Choose the tax year',
    privacyNote: 'Your data is safe',
    next: 'Continue',
  }[key] ?? key),
}))

describe('Step1TaxYear', () => {
  const setup = (year = 2024) => {
    const onTaxYearChange = vi.fn()
    const onNext = vi.fn()
    render(
      <Step1TaxYear taxYear={year} onTaxYearChange={onTaxYearChange} onNext={onNext} />
    )
    return { onTaxYearChange, onNext }
  }

  it('renders only selectable (non-blocked) year buttons', () => {
    setup()
    for (const y of selectableYears()) {
      expect(screen.getByText(String(y))).toBeInTheDocument()
    }
    // a year before the earliest supported year is never offered
    expect(screen.queryByText(String(MIN_SUPPORTED_YEAR - 1))).toBeNull()
  })

  it('highlights the selected year', () => {
    const y = selectableYears()[0]
    setup(y)
    const btn = screen.getByText(String(y))
    expect(btn.className).toContain('border-blue-600')
  })

  it('calls onTaxYearChange when a year is clicked', () => {
    const { onTaxYearChange } = setup()
    const y = selectableYears()[0]
    fireEvent.click(screen.getByText(String(y)))
    expect(onTaxYearChange).toHaveBeenCalledWith(y)
  })

  it('calls onNext when Continue is clicked', () => {
    const { onNext } = setup()
    fireEvent.click(screen.getByText('Continue →'))
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('shows privacy note', () => {
    setup()
    expect(screen.getByText(/Your data is safe/)).toBeInTheDocument()
  })
})
