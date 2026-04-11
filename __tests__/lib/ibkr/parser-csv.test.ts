import { parseCsv } from '@/lib/ibkr/parser-csv'

const SAMPLE_CSV = `Statement,Header,Field Name,Field Value
Statement,Data,Account,U1234567
Statement,Data,Period,"January 1, 2024 - December 31, 2024"

Trades,Header,DataDiscriminator,Asset Category,Currency,Symbol,Date/Time,Quantity,T. Price,Proceeds,Comm/Fee,Basis,Realized P/L,MTM P/L,Code
Trades,Data,Order,Stocks,USD,AAPL,"2024-03-15, 10:30:00",-10,175.50,1755.00,-1.00,-1200.00,555.00,0,O

Dividends,Header,Currency,Date,Description,Amount
Dividends,Data,USD,2024-06-15,MSFT (US5949181045) Cash Dividend USD 0.75 per Share (Ordinary Dividend),75.00

Withholding Tax,Header,Currency,Date,Description,Amount
Withholding Tax,Data,USD,2024-06-15,MSFT (US5949181045) Cash Dividend USD 0.75 per Share - US Tax,-11.25`

describe('parseCsv', () => {
  it('parses account id', () => {
    expect(parseCsv(SAMPLE_CSV).accountId).toBe('U1234567')
  })

  it('parses date range', () => {
    const result = parseCsv(SAMPLE_CSV)
    expect(result.fromDate).toBe('2024-01-01')
    expect(result.toDate).toBe('2024-12-31')
  })

  it('parses trade', () => {
    const { trades } = parseCsv(SAMPLE_CSV)
    expect(trades).toHaveLength(1)
    expect(trades[0].ticker).toBe('AAPL')
    expect(trades[0].tradeType).toBe('sell')
    expect(trades[0].gainLossUsd).toBe('555.00')
    expect(trades[0].date).toBe('2024-03-15')
  })

  it('parses dividend with withholding tax', () => {
    const { dividends } = parseCsv(SAMPLE_CSV)
    expect(dividends).toHaveLength(1)
    expect(dividends[0].ticker).toBe('MSFT')
    expect(dividends[0].amountUsd).toBe('75.00')
    expect(dividends[0].withheldTaxUsd).toBe('11.25')
  })

  it('returns empty arrays for missing sections', () => {
    const minimal = `Statement,Header,Field Name,Field Value\nStatement,Data,Account,U9999999`
    const result = parseCsv(minimal)
    expect(result.trades).toHaveLength(0)
    expect(result.dividends).toHaveLength(0)
  })
})
