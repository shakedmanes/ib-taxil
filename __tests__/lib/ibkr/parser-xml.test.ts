import { describe, it, expect } from 'vitest'
import { parseFlexXml } from '@/lib/ibkr/parser-xml'

const xml = `<FlexQueryResponse><FlexStatements><FlexStatement accountId="U1" currency="USD" fromDate="20240101" toDate="20241231">
  <Trades>
    <Trade levelOfDetail="CLOSED_LOT" assetCategory="STK" symbol="AAPL" description="Apple" currency="USD"
           openDateTime="20190501;120000" tradeDate="20240310" proceeds="12000" cost="10000" quantity="-100" fifoPnlRealized="2000"/>
    <Trade levelOfDetail="CLOSED_LOT" assetCategory="OPT" symbol="AAPL240119C" description="AAPL call" currency="USD"
           openDateTime="20231001" tradeDate="20240310" proceeds="500" cost="200" quantity="-1"/>
  </Trades>
  <CashTransactions>
    <CashTransaction type="Dividends" symbol="KO" description="COCA-COLA" currency="USD" amount="100" settleDate="20240215" issuerCountryCode="US"/>
    <CashTransaction type="Withholding Tax" symbol="KO" description="COCA-COLA" currency="USD" amount="-25" settleDate="20240215"/>
    <CashTransaction type="Broker Interest Received" description="USD Interest" currency="USD" amount="40" settleDate="20240630"/>
    <CashTransaction type="Bond Interest" description="Some bond" currency="USD" amount="15" settleDate="20240401"/>
  </CashTransactions>
</FlexStatement></FlexStatements></FlexQueryResponse>`

describe('parseFlexXml', () => {
  const data = parseFlexXml(xml)
  it('extracts the security closed lot with open + sale dates', () => {
    expect(data.closedLots).toHaveLength(1)
    expect(data.closedLots[0]).toMatchObject({ ticker: 'AAPL', openDate: '2019-05-01', saleDate: '2024-03-10', proceeds: '12000', cost: '10000', currency: 'USD' })
    expect(data.hasClosedLotSection).toBe(true)
  })
  it('pairs dividend with withholding', () => {
    expect(data.dividends).toHaveLength(1)
    expect(data.dividends[0]).toMatchObject({ ticker: 'KO', gross: '100', withheldTax: '25', payDate: '2024-02-15', sourceCountry: 'US' })
  })
  it('extracts broker interest', () => {
    expect(data.interest).toHaveLength(1)
    expect(data.interest[0]).toMatchObject({ gross: '40', payDate: '2024-06-30' })
  })
  it('quarantines the option lot and bond interest', () => {
    const kinds = data.outOfScope.map(o => o.kind).sort()
    expect(kinds).toContain('option')
    expect(kinds).toContain('bond-interest')
  })
})
