import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Step3Review } from '@/components/wizard/Step3Review'
vi.mock('next-intl')

const data = {
  accountId: 'U1', baseCurrency: 'USD', lotMethod: 'FIFO', hasClosedLotSection: true,
  closedLots: [{
    id: 'l', ticker: 'AAPL', description: 'Apple', currency: 'USD', quantity: 100,
    openDate: '2019-05-01', saleDate: '2024-03-10', proceeds: '12000', cost: '10000', method: 'FIFO',
  }],
  dividends: [], interest: [],
  outOfScope: [{ id: 'o', kind: 'option', description: 'AAPL call', raw: 'opt' }],
}

describe('Step3Review', () => {
  it('lists quarantined items and toggles substantial holder', async () => {
    const onToggle = vi.fn()
    render(
      <Step3Review
        data={data as any}
        substantialHoldings={[]}
        onToggleSubstantial={onToggle}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    )
    expect(screen.getByText(/AAPL call/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox', { name: /substantial/i }))
    expect(onToggle).toHaveBeenCalledWith('AAPL')
  })
})
