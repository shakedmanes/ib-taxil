import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Explain } from '@/components/common/Explain'
vi.mock('next-intl')

describe('Explain', () => {
  it('renders the message for a capital-gain explanation', () => {
    render(
      <Explain
        explanation={{
          code: 'explain.capitalGain',
          params: {
            ticker: 'AAPL', gainIls: '12400', openRate: '3.20', saleRate: '3.70',
            proceedsIls: '44400', costIls: '32000', saleDate: '2024-03-10', openDate: '2019-05-01',
          },
        }}
      />,
    )
    expect(screen.getByText(/AAPL/)).toBeInTheDocument()
    expect(screen.getByText(/12,?400|12400/)).toBeInTheDocument()
  })
})
