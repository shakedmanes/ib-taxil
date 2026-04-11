import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Step2Import } from '@/components/wizard/Step2Import'
import { IBKRApiCard } from '@/components/import/IBKRApiCard'
import { FileUploadCard } from '@/components/import/FileUploadCard'

vi.mock('@/lib/ibkr/parser-xml', () => ({
  parseFlexXml: vi.fn(() => ({
    accountId: 'U123',
    currency: 'USD',
    fromDate: '2024-01-01',
    toDate: '2024-12-31',
    trades: [],
    dividends: [],
    foreignIncome: [],
  })),
}))

vi.mock('@/lib/ibkr/parser-csv', () => ({
  parseCsv: vi.fn(() => ({
    accountId: 'U123',
    currency: 'USD',
    fromDate: '2024-01-01',
    toDate: '2024-12-31',
    trades: [],
    dividends: [],
    foreignIncome: [],
  })),
}))

describe('Step2Import', () => {
  const setup = () => {
    const onData = vi.fn()
    const onNext = vi.fn()
    render(<Step2Import taxYear={2024} onData={onData} onNext={onNext} />)
    return { onData, onNext }
  }

  it('renders "Import your IBKR data" heading', () => {
    setup()
    expect(screen.getByText('Import your IBKR data')).toBeInTheDocument()
  })

  it('renders the privacy note with "Learn more" button', () => {
    setup()
    expect(screen.getByText(/processed entirely in your browser/i)).toBeInTheDocument()
    expect(screen.getByText('Learn more →')).toBeInTheDocument()
  })

  it('opens PrivacyModal when "Learn more" is clicked', () => {
    setup()
    fireEvent.click(screen.getByText('Learn more →'))
    expect(screen.getByText('How your data is protected')).toBeInTheDocument()
  })

  it('closes PrivacyModal when Escape is pressed', () => {
    setup()
    fireEvent.click(screen.getByText('Learn more →'))
    expect(screen.getByText('How your data is protected')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByText('How your data is protected')).not.toBeInTheDocument()
  })

  it('closes PrivacyModal when "Got it" button is clicked', () => {
    setup()
    fireEvent.click(screen.getByText('Learn more →'))
    expect(screen.getByText('How your data is protected')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Got it'))
    expect(screen.queryByText('How your data is protected')).not.toBeInTheDocument()
  })

  it('shows and dismisses an error message', () => {
    setup()
    // Trigger an error through IBKRApiCard empty submit
    fireEvent.click(screen.getByText('Fetch My Data →'))
    expect(screen.getByText(/Please enter both/i)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Dismiss'))
    expect(screen.queryByText(/Please enter both/i)).not.toBeInTheDocument()
  })
})

describe('IBKRApiCard', () => {
  const setup = () => {
    const onData = vi.fn()
    const onError = vi.fn()
    render(<IBKRApiCard taxYear={2024} onData={onData} onError={onError} />)
    return { onData, onError }
  }

  it('renders "Connect via IBKR API" heading', () => {
    setup()
    expect(screen.getByText('Connect via IBKR API')).toBeInTheDocument()
  })

  it('shows validation error when form is submitted with empty fields', () => {
    const { onError } = setup()
    fireEvent.click(screen.getByText('Fetch My Data →'))
    expect(onError).toHaveBeenCalledWith('Please enter both your Flex Query token and Query ID.')
  })

  it('shows validation error when only token is provided', async () => {
    const { onError } = setup()
    const tokenInput = screen.getByPlaceholderText('Paste your token here')
    await userEvent.type(tokenInput, 'mytoken')
    fireEvent.click(screen.getByText('Fetch My Data →'))
    expect(onError).toHaveBeenCalledWith('Please enter both your Flex Query token and Query ID.')
  })

  it('shows validation error when only queryId is provided', async () => {
    const { onError } = setup()
    const queryInput = screen.getByPlaceholderText('e.g. 123456')
    await userEvent.type(queryInput, '123456')
    fireEvent.click(screen.getByText('Fetch My Data →'))
    expect(onError).toHaveBeenCalledWith('Please enter both your Flex Query token and Query ID.')
  })

  it('fetches data and calls onData on success', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })

    const { parseFlexXml } = await import('@/lib/ibkr/parser-xml')
    const mockData = {
      accountId: 'U999',
      currency: 'USD',
      fromDate: '2024-01-01',
      toDate: '2024-12-31',
      trades: [],
      dividends: [],
      foreignIncome: [],
    }
    vi.mocked(parseFlexXml).mockReturnValue(mockData)

    const sendXml = '<FlexStatementResponse><ReferenceCode>ABC123</ReferenceCode></FlexStatementResponse>'
    const reportXml = '<FlexQueryResponse />'

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ text: async () => sendXml })
      .mockResolvedValueOnce({ text: async () => reportXml })
    vi.stubGlobal('fetch', mockFetch)

    const { onData } = setup()

    const tokenInput = screen.getByPlaceholderText('Paste your token here')
    const queryInput = screen.getByPlaceholderText('e.g. 123456')
    fireEvent.change(tokenInput, { target: { value: 'mytoken' } })
    fireEvent.change(queryInput, { target: { value: '123456' } })
    fireEvent.click(screen.getByText('Fetch My Data →'))

    // Wait for phase 1 fetch to complete
    await act(async () => {
      await Promise.resolve()
    })

    // Advance the 2000ms setTimeout
    await act(async () => {
      vi.advanceTimersByTime(2000)
      await Promise.resolve()
    })

    // Wait for phase 2 and parser
    await act(async () => {
      await Promise.resolve()
    })

    expect(onData).toHaveBeenCalledWith(mockData)

    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('calls onError when IBKR does not return a reference code', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ text: async () => '<FlexStatementResponse><Status>Error</Status></FlexStatementResponse>' })
    vi.stubGlobal('fetch', mockFetch)

    const { onError } = setup()

    fireEvent.change(screen.getByPlaceholderText('Paste your token here'), { target: { value: 'mytoken' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 123456'), { target: { value: '123456' } })
    fireEvent.click(screen.getByText('Fetch My Data →'))

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(onError).toHaveBeenCalledWith(
      'Could not get reference code from IBKR. Check your token and Query ID.'
    )

    vi.useRealTimers()
    vi.unstubAllGlobals()
  })
})

describe('FileUploadCard', () => {
  const setup = () => {
    const onData = vi.fn()
    const onError = vi.fn()
    render(<FileUploadCard onData={onData} onError={onError} />)
    return { onData, onError }
  }

  it('renders "Upload Files" heading', () => {
    setup()
    expect(screen.getByText('Upload Files')).toBeInTheDocument()
  })

  it('calls onError when unsupported file type is dropped', async () => {
    const { onError } = setup()
    const dropZone = screen.getByText('Drop XML or CSV here').parentElement!

    // Mock file with text() method
    const file = Object.assign(new File(['content'], 'report.pdf', { type: 'application/pdf' }), {
      text: async () => 'content',
    })

    await act(async () => {
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      })
    })

    expect(onError).toHaveBeenCalledWith(
      'Unsupported file type. Please upload an XML (Flex Query) or CSV (Activity Statement) file.'
    )
  })

  it('calls onData when a valid XML file is dropped', async () => {
    const { parseFlexXml } = await import('@/lib/ibkr/parser-xml')
    const mockData = {
      accountId: 'U123',
      currency: 'USD',
      fromDate: '2024-01-01',
      toDate: '2024-12-31',
      trades: [],
      dividends: [],
      foreignIncome: [],
    }
    vi.mocked(parseFlexXml).mockReturnValue(mockData)

    const { onData } = setup()
    const dropZone = screen.getByText('Drop XML or CSV here').parentElement!

    const file = Object.assign(new File(['<xml />'], 'report.xml', { type: 'text/xml' }), {
      text: async () => '<xml />',
    })

    await act(async () => {
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      })
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(onData).toHaveBeenCalledWith(mockData)
  })

  it('calls onData when a valid CSV file is dropped', async () => {
    const { parseCsv } = await import('@/lib/ibkr/parser-csv')
    const mockData = {
      accountId: 'U123',
      currency: 'USD',
      fromDate: '2024-01-01',
      toDate: '2024-12-31',
      trades: [],
      dividends: [],
      foreignIncome: [],
    }
    vi.mocked(parseCsv).mockReturnValue(mockData)

    const { onData } = setup()
    const dropZone = screen.getByText('Drop XML or CSV here').parentElement!

    const file = Object.assign(new File(['col1,col2'], 'report.csv', { type: 'text/csv' }), {
      text: async () => 'col1,col2',
    })

    await act(async () => {
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      })
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(onData).toHaveBeenCalledWith(mockData)
  })
})
