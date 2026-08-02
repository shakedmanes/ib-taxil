import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Step3Review } from '@/components/wizard/Step3Review'
vi.mock('next-intl')

const data = {
  accountId: 'U1', baseCurrency: 'USD', lotMethod: 'FIFO', hasClosedLotSection: true,
  closedLots: [
    { id: 'l', ticker: 'AAPL', description: 'Apple', currency: 'USD', quantity: 100,
      openDate: '2019-05-01', saleDate: '2024-03-10', proceeds: '12000', cost: '10000', method: 'FIFO' },
    { id: 'l2', ticker: 'NVDA', description: 'NVIDIA', currency: 'USD', quantity: 10,
      openDate: '2024-11-01', saleDate: '2025-02-10', proceeds: '9000', cost: '8000', method: 'FIFO' },
  ],
  dividends: [], interest: [],
  outOfScope: [{ id: 'o', kind: 'option', description: 'AAPL call', raw: 'opt' }],
}

const renderReview = (onToggle = vi.fn()) => render(
  <Step3Review
    data={data as any}
    taxYear={2024}
    substantialHoldings={[]}
    onToggleSubstantial={onToggle}
    onNext={vi.fn()}
    onBack={vi.fn()}
  />,
)

describe('Step3Review', () => {
  it('lists quarantined items and toggles substantial holder', async () => {
    const onToggle = vi.fn()
    renderReview(onToggle)
    expect(screen.getByText(/AAPL call/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox', { name: /Mark AAPL/i }))
    expect(onToggle).toHaveBeenCalledWith('AAPL')
  })

  it('shows every closed lot but marks only the chosen year as included', () => {
    renderReview()
    // Both sales are listed for the full picture...
    expect(screen.getAllByText('AAPL').length).toBeGreaterThan(0)
    expect(screen.getAllByText('NVDA').length).toBeGreaterThan(0)
    // ...one is in 2024 (included), the other in 2025 (reference only) => a warning shows.
    expect(screen.getByText(/other tax years/i)).toBeInTheDocument()
    expect(screen.getByText(/Year 2025/)).toBeInTheDocument()
  })
})
