import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Step4Details } from '@/components/wizard/Step4Details'
vi.mock('next-intl')

describe('Step4Details', () => {
  it('captures a prior-year loss', async () => {
    const onChange = vi.fn()
    render(
      <Step4Details
        inputs={{ substantialHoldings: [], broughtForwardLoss: '0' }}
        onChange={onChange}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    )
    await userEvent.type(screen.getByLabelText(/prior-year loss|carried/i), '5000')
    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls.at(-1)![0]
    expect(last.broughtForwardLoss).toBe('5000')
  })

  it('leaves surtax skipped when other income is blank', async () => {
    const onChange = vi.fn()
    render(
      <Step4Details
        inputs={{ substantialHoldings: [], broughtForwardLoss: '0' }}
        onChange={onChange}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    )
    await userEvent.type(screen.getByLabelText(/other.*income/i), '120000')
    const last = onChange.mock.calls.at(-1)![0]
    expect(last.otherIncomeIls).toBe('120000')
  })
})
