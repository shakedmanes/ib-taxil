import { describe, it, expect } from 'vitest'
import { XMLParser } from 'fast-xml-parser'
import { hasClosedLotDetail } from '@/lib/ibkr/detect'

const parse = (xml: string) => new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' }).parse(xml)

describe('hasClosedLotDetail', () => {
  it('is true when a CLOSED_LOT trade exists', () => {
    const xml = `<FlexQueryResponse><FlexStatements><FlexStatement><Trades>
      <Trade levelOfDetail="EXECUTION" symbol="AAPL"/>
      <Trade levelOfDetail="CLOSED_LOT" symbol="AAPL" openDateTime="20190501"/>
    </Trades></FlexStatement></FlexStatements></FlexQueryResponse>`
    expect(hasClosedLotDetail(parse(xml))).toBe(true)
  })
  it('is false with only execution rows', () => {
    const xml = `<FlexQueryResponse><FlexStatements><FlexStatement><Trades>
      <Trade levelOfDetail="EXECUTION" symbol="AAPL"/>
    </Trades></FlexStatement></FlexStatements></FlexQueryResponse>`
    expect(hasClosedLotDetail(parse(xml))).toBe(false)
  })
})
