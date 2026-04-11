import { render, screen, fireEvent } from '@testing-library/react'
import { Step1TaxYear } from '@/components/wizard/Step1TaxYear'

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

  it('renders 5 year buttons', () => {
    setup()
    const currentYear = new Date().getFullYear()
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(String(currentYear - i))).toBeInTheDocument()
    }
  })

  it('highlights the selected year', () => {
    const currentYear = new Date().getFullYear()
    setup(currentYear - 1)
    const btn = screen.getByText(String(currentYear - 1))
    expect(btn.className).toContain('border-blue-600')
  })

  it('calls onTaxYearChange when a year is clicked', () => {
    const { onTaxYearChange } = setup()
    const currentYear = new Date().getFullYear()
    fireEvent.click(screen.getByText(String(currentYear - 2)))
    expect(onTaxYearChange).toHaveBeenCalledWith(currentYear - 2)
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
