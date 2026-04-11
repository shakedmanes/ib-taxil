import { parseFlexXml } from '@/lib/ibkr/parser-xml'

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<FlexQueryResponse queryName="Tax2024" type="AF">
  <FlexStatements count="1">
    <FlexStatement accountId="U1234567" fromDate="2024-01-01" toDate="2024-12-31" currency="USD">
      <Trades>
        <Trade accountId="U1234567" currency="USD" symbol="AAPL" description="APPLE INC"
          dateTime="2024-03-15;10:30:00" tradeDate="2024-03-15" buySell="SELL"
          quantity="-10" tradePrice="175.50" proceeds="1755.00" cost="-1200.00"
          fifoPnlRealized="555.00" transactionID="tx001" />
      </Trades>
      <CashTransactions>
        <CashTransaction accountId="U1234567" currency="USD" symbol="MSFT"
          description="MSFT (US5949181045) CASH DIVIDEND USD 0.75 PER SHARE"
          dateTime="2024-06-15;00:00:00" settleDate="2024-06-15"
          amount="75.00" type="Dividends" transactionID="tx002" />
        <CashTransaction accountId="U1234567" currency="USD" symbol="MSFT"
          description="MSFT (US5949181045) CASH DIVIDEND - US TAX"
          dateTime="2024-06-15;00:00:00" settleDate="2024-06-15"
          amount="-11.25" type="Withholding Tax" transactionID="tx003" />
      </CashTransactions>
    </FlexStatement>
  </FlexStatements>
</FlexQueryResponse>`

describe('parseFlexXml', () => {
  it('parses account metadata', () => {
    const result = parseFlexXml(SAMPLE_XML)
    expect(result.accountId).toBe('U1234567')
    expect(result.fromDate).toBe('2024-01-01')
    expect(result.toDate).toBe('2024-12-31')
  })

  it('parses trades', () => {
    const result = parseFlexXml(SAMPLE_XML)
    expect(result.trades).toHaveLength(1)
    const trade = result.trades[0]
    expect(trade.ticker).toBe('AAPL')
    expect(trade.tradeType).toBe('sell')
    expect(trade.proceedsUsd).toBe('1755.00')
    expect(trade.gainLossUsd).toBe('555.00')
    expect(trade.date).toBe('2024-03-15')
  })

  it('parses dividends and pairs withholding tax', () => {
    const result = parseFlexXml(SAMPLE_XML)
    expect(result.dividends).toHaveLength(1)
    const div = result.dividends[0]
    expect(div.ticker).toBe('MSFT')
    expect(div.amountUsd).toBe('75.00')
    expect(div.withheldTaxUsd).toBe('11.25')
  })

  it('throws on invalid XML', () => {
    expect(() => parseFlexXml('<not-flex-xml/>')).toThrow('Invalid Flex Query XML')
  })
})
