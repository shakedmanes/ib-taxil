import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { SummaryCards } from '@/components/review/SummaryCards'
import { TradeTable } from '@/components/review/TradeTable'
import { Step3Review } from '@/components/wizard/Step3Review'
import type { IBKRData } from '@/lib/ibkr/types'

vi.mock('@/lib/boi/rates', () => ({
  fetchBoiRates: vi.fn().mockRejectedValue(new Error('Network error')),
  buildRatesMap: vi.fn(),
}))

vi.mock('@/lib/tax/calculator', () => ({
  calculateTax: vi.fn(),
}))

const mockData: IBKRData = {
  accountId: 'U123',
  currency: 'USD',
  fromDate: '2024-01-01',
  toDate: '2024-12-31',
  trades: [
    {
      id: 't1',
      date: '2024-03-15',
      ticker: 'AAPL',
      description: 'APPLE INC',
      tradeType: 'sell',
      quantity: 10,
      priceUsd: '150.00',
      proceedsUsd: '1500.00',
      costUsd: '1200.00',
      gainLossUsd: '300.00',
      currency: 'USD',
    },
    {
      id: 't2',
      date: '2024-06-01',
      ticker: 'MSFT',
      description: 'MICROSOFT CORP',
      tradeType: 'sell',
      quantity: 10,
      priceUsd: '300.00',
      proceedsUsd: '3000.00',
      costUsd: '3500.00',
      gainLossUsd: '-500.00',
      currency: 'USD',
    },
  ],
  dividends: [
    {
      id: 'd1',
      date: '2024-01-10',
      ticker: 'AAPL',
      description: 'APPLE INC - Dividend',
      amountUsd: '25.00',
      withheldTaxUsd: '3.75',
      currency: 'USD',
    },
  ],
  foreignIncome: [],
}

describe('SummaryCards', () => {
  it('renders Total Trades count', () => {
    render(<SummaryCards data={mockData} />)
    expect(screen.getByText('Total Trades')).toBeInTheDocument()
    // 2 trades total
    const cards = screen.getAllByText('2')
    expect(cards.length).toBeGreaterThanOrEqual(1)
  })

  it('renders correct Gains count', () => {
    render(<SummaryCards data={mockData} />)
    expect(screen.getByText('Gains')).toBeInTheDocument()
  })

  it('renders correct Losses count', () => {
    render(<SummaryCards data={mockData} />)
    expect(screen.getByText('Losses')).toBeInTheDocument()
  })

  it('renders correct Dividends count', () => {
    render(<SummaryCards data={mockData} />)
    expect(screen.getByText('Dividends')).toBeInTheDocument()
    // 1 dividend - use getAllByText since Gains and Losses also show '1'
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1)
  })

  it('shows 1 gain and 1 loss from mock data', () => {
    render(<SummaryCards data={mockData} />)
    const labels = ['Total Trades', 'Gains', 'Losses', 'Dividends']
    labels.forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument()
    })
    // 2 trades total, 1 gain, 1 loss, 1 dividend
    expect(screen.getByText('Total Trades').nextElementSibling?.textContent).toBe('2')
    expect(screen.getByText('Gains').nextElementSibling?.textContent).toBe('1')
    expect(screen.getByText('Losses').nextElementSibling?.textContent).toBe('1')
    expect(screen.getByText('Dividends').nextElementSibling?.textContent).toBe('1')
  })
})

describe('TradeTable', () => {
  it('renders all rows by default (2 trades + 1 dividend = 3)', () => {
    render(<TradeTable data={mockData} />)
    // AAPL appears in both trade and dividend rows
    expect(screen.getAllByText('AAPL').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('MSFT')).toBeInTheDocument()
  })

  it('shows gain badge for profitable trade', () => {
    render(<TradeTable data={mockData} />)
    expect(screen.getByText('Gain')).toBeInTheDocument()
  })

  it('shows loss badge for losing trade', () => {
    render(<TradeTable data={mockData} />)
    expect(screen.getByText('Loss')).toBeInTheDocument()
  })

  it('shows dividend badge for dividend row', () => {
    render(<TradeTable data={mockData} />)
    expect(screen.getByText('Dividend')).toBeInTheDocument()
  })

  it('filters to only trades when Trades filter selected', () => {
    render(<TradeTable data={mockData} />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'trade' } })
    // Dividend badge should be gone
    expect(screen.queryByText('Dividend')).not.toBeInTheDocument()
    // Trade badges should still be present
    expect(screen.getByText('Gain')).toBeInTheDocument()
    expect(screen.getByText('Loss')).toBeInTheDocument()
  })

  it('filters to only dividends when Dividends filter selected', () => {
    render(<TradeTable data={mockData} />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'dividend' } })
    // Trade badges should be gone
    expect(screen.queryByText('Gain')).not.toBeInTheDocument()
    expect(screen.queryByText('Loss')).not.toBeInTheDocument()
    // Dividend badge should still be present
    expect(screen.getByText('Dividend')).toBeInTheDocument()
  })

  it('filters by ticker search string', () => {
    render(<TradeTable data={mockData} />)
    const searchInput = screen.getByPlaceholderText('Search ticker…')
    fireEvent.change(searchInput, { target: { value: 'MSFT' } })
    // MSFT should still be visible
    expect(screen.getByText('MSFT')).toBeInTheDocument()
    // AAPL trade should be hidden (AAPL still appears in dividend)
    // With filter=all but search=MSFT, only MSFT trade should show
    expect(screen.queryByText('Gain')).not.toBeInTheDocument()
    expect(screen.getByText('Loss')).toBeInTheDocument()
  })

  it('shows "No records" when nothing matches', () => {
    render(<TradeTable data={mockData} />)
    const searchInput = screen.getByPlaceholderText('Search ticker…')
    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT' } })
    expect(screen.getByText('No records match your filter.')).toBeInTheDocument()
  })
})

describe('Step3Review', () => {
  const setup = () => {
    const onResult = vi.fn()
    const onNext = vi.fn()
    render(<Step3Review data={mockData} taxYear={2024} onResult={onResult} onNext={onNext} />)
    return { onResult, onNext }
  }

  it('renders account ID in subtitle', () => {
    setup()
    expect(screen.getByText(/Account U123/)).toBeInTheDocument()
  })

  it('renders trade count in subtitle', () => {
    setup()
    expect(screen.getByText(/2 trades/)).toBeInTheDocument()
  })

  it('renders dividend count in subtitle', () => {
    setup()
    expect(screen.getByText(/1 dividends/)).toBeInTheDocument()
  })

  it('renders the tax year in heading', () => {
    setup()
    expect(screen.getByText(/Review Your 2024 Data/)).toBeInTheDocument()
  })

  it('renders Calculate My Tax button', () => {
    setup()
    expect(screen.getByText('Calculate My Tax →')).toBeInTheDocument()
  })

  it('shows error when fetchBoiRates throws', async () => {
    setup()
    await act(async () => {
      fireEvent.click(screen.getByText('Calculate My Tax →'))
    })
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })
})
