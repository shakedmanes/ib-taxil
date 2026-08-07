import { describe, it, expect } from 'vitest'
import { applyForeignTaxCredit } from '@/lib/tax/foreign-tax-credit'
import type { DividendLine, InterestLine } from '@/lib/tax/types'

const dLine = (o: Partial<DividendLine>): DividendLine => ({
  ticker: 'X', payDate: '', fxRate: '1', grossIls: '1000', rate: '25',
  israeliTaxIls: '250', withheldIls: '250', creditIls: '0', netTaxIls: '250',
  overWithheldIls: '0', sourceCountry: 'US', explanation: { code: '', params: {} }, ...o,
})
const iLine = (o: Partial<InterestLine>): InterestLine => ({
  description: 'int', payDate: '', fxRate: '1', grossIls: '1000', rate: '25',
  israeliTaxIls: '250', withheldIls: '0', creditIls: '0', netTaxIls: '250',
  overWithheldIls: '0', sourceCountry: 'US', explanation: { code: '', params: {} }, ...o,
})

describe('applyForeignTaxCredit', () => {
  it('credits US dividend withholding up to the Israeli liability (nets to zero)', () => {
    const r = applyForeignTaxCredit([dLine({})], [])
    expect(r.dividendLines[0].creditIls).toBe('250')
    expect(r.dividendLines[0].netTaxIls).toBe('0')
    expect(r.totalCreditIls).toBe('250')
  })
  it('pools within a country basket: over-withheld line helps an under-withheld line', () => {
    // two US dividends, each Israeli tax 250; one withheld 250, one withheld 150 -> pooled 400 vs ceiling 500 => credit 400
    const r = applyForeignTaxCredit([dLine({ withheldIls: '250' }), dLine({ withheldIls: '150' })], [])
    expect(r.totalCreditIls).toBe('400')
    // credit is distributed proportionally to each line's Israeli tax (250/250),
    // so both lines share it equally — not greedily assigned to one line.
    expect(r.dividendLines[0].creditIls).toBe('200')
    expect(r.dividendLines[1].creditIls).toBe('200')
    expect(r.dividendLines[0].netTaxIls).toBe('50')
    expect(r.dividendLines[1].netTaxIls).toBe('50')
  })
  it('distributes credit proportionally to each line Israeli tax, remainder on the last line', () => {
    // ceiling 300 (100+200); pooled withholding 120 credit -> 40 / 80 split
    const r = applyForeignTaxCredit(
      [dLine({ grossIls: '400', israeliTaxIls: '100', withheldIls: '60' }),
       dLine({ grossIls: '800', israeliTaxIls: '200', withheldIls: '60' })], [])
    expect(r.totalCreditIls).toBe('120')
    expect(r.dividendLines[0].creditIls).toBe('40')  // 120 * 100/300
    expect(r.dividendLines[1].creditIls).toBe('80')  // remainder
  })
  it('flags dividend over-withholding above the 25% treaty cap', () => {
    // withheld 300 on gross 1000 -> cap 250; 50 is over-withheld, credit capped at 250
    const r = applyForeignTaxCredit([dLine({ withheldIls: '300' })], [])
    expect(r.dividendLines[0].overWithheldIls).toBe('50')
    expect(r.dividendLines[0].creditIls).toBe('250')
  })
  it('caps interest credit at the 17.5% treaty rate, leaving residual Israeli tax', () => {
    // interest gross 1000, Israeli tax 250, withheld 250 -> treaty cap 175 credit; net 75 due; 75 over-withheld
    const r = applyForeignTaxCredit([], [iLine({ withheldIls: '250' })])
    expect(r.interestLines[0].creditIls).toBe('175')
    expect(r.interestLines[0].netTaxIls).toBe('75')
    expect(r.interestLines[0].overWithheldIls).toBe('75')
  })
  it('separates baskets by country', () => {
    const r = applyForeignTaxCredit([dLine({ sourceCountry: 'US', withheldIls: '250' }), dLine({ sourceCountry: 'DE', withheldIls: '0' })], [])
    const de = r.countryCredits.find(c => c.country === 'DE' && c.basket === 'dividend')
    expect(de?.creditedIls).toBe('0')
  })
})
