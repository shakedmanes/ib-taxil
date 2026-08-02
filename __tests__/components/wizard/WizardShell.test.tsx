import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WizardShell } from '@/components/wizard/WizardShell'
vi.mock('next-intl')

describe('WizardShell', () => {
  it('shows six steps and starts on the tax-year step', () => {
    render(<WizardShell />)
    expect(screen.getAllByText(/tax year/i).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(6)
  })
})
