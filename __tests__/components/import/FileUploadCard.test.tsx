import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUploadCard } from '@/components/import/FileUploadCard'
vi.mock('next-intl')

describe('FileUploadCard', () => {
  it('rejects an Activity Statement with Flex Query guidance', async () => {
    render(<FileUploadCard onData={vi.fn()} />)
    const file = new File(['Statement,Header,Field Name,Field Value'], 'act.csv', { type: 'text/csv' })
    const input = screen.getByLabelText(/upload|browse/i)
    await userEvent.upload(input, file)
    await waitFor(() => expect(screen.getAllByText(/flex query/i).length).toBeGreaterThan(0))
  })

  it('parses a Flex XML file and calls onData', async () => {
    const parser = await import('@/lib/ibkr/parser-xml')
    const mockData = {
      accountId: 'U1', baseCurrency: 'USD', lotMethod: 'FIFO', hasClosedLotSection: true,
      closedLots: [], dividends: [], interest: [], outOfScope: [],
    }
    const spy = vi.spyOn(parser, 'parseFlexXml').mockReturnValue(mockData)
    const onData = vi.fn()
    render(<FileUploadCard onData={onData} />)
    const file = new File(['<FlexQueryResponse />'], 'report.xml', { type: 'text/xml' })
    await userEvent.upload(screen.getByLabelText(/upload|browse/i), file)
    await waitFor(() => expect(onData).toHaveBeenCalledWith(mockData))
    spy.mockRestore()
  })
})
