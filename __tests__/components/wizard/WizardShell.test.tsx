import { render, screen, fireEvent } from '@testing-library/react'
import { WizardShell } from '@/components/wizard/WizardShell'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

describe('WizardShell', () => {
  it('renders step 1 content by default', () => {
    render(<WizardShell />)
    expect(screen.getByTestId('wizard-step-1')).toBeInTheDocument()
  })

  it('shows 5 progress steps', () => {
    render(<WizardShell />)
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
  })

  it('back button is hidden on step 1', () => {
    render(<WizardShell />)
    expect(screen.queryByText('Back')).not.toBeInTheDocument()
  })
})
