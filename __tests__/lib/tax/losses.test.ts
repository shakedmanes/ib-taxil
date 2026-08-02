import { describe, it, expect } from 'vitest'
import { offsetLosses } from '@/lib/tax/losses'
import type { CapitalGainLine } from '@/lib/tax/types'

const line = (gainIls: string): CapitalGainLine => ({
  ticker: 'X', description: '', openDate: '', saleDate: '', openRate: '', saleRate: '',
  proceedsIls: '0', costIls: '0', gainIls, isSubstantial: false,
  explanation: { code: '', params: {} },
})

describe('offsetLosses', () => {
  it('nets current gains and losses', () => {
    const o = offsetLosses({ gainLines: [line('10000'), line('-4000')], broughtForwardLoss: '0', dividendIncomeIls: '0', interestIncomeIls: '0' })
    expect(o.totalGainsIls).toBe('10000')
    expect(o.totalLossesIls).toBe('4000')
    expect(o.netCapitalGainIls).toBe('6000')
    expect(o.carryForwardLossIls).toBe('0')
  })
  it('spills excess current loss onto dividend+interest income', () => {
    const o = offsetLosses({ gainLines: [line('2000'), line('-9000')], broughtForwardLoss: '0', dividendIncomeIls: '5000', interestIncomeIls: '1000' })
    // loss 9000 - gains 2000 = 7000 remaining; offsets 6000 income -> income base 0; 1000 carries fwd
    expect(o.netCapitalGainIls).toBe('0')
    expect(o.currentLossUsedAgainstIncomeIls).toBe('6000')
    expect(o.incomeOffsetRemainingIls).toBe('0')
    expect(o.carryForwardLossIls).toBe('1000')
  })
  it('applies brought-forward loss to gains ONLY, never to income', () => {
    const o = offsetLosses({ gainLines: [line('3000')], broughtForwardLoss: '10000', dividendIncomeIls: '8000', interestIncomeIls: '0' })
    // BF offsets the 3000 gain only; 7000 BF carries forward; dividends untouched
    expect(o.netCapitalGainIls).toBe('0')
    expect(o.broughtForwardUsedIls).toBe('3000')
    expect(o.currentLossUsedAgainstIncomeIls).toBe('0')
    expect(o.incomeOffsetRemainingIls).toBe('8000')
    expect(o.carryForwardLossIls).toBe('7000')
  })
  it('uses current losses before brought-forward against gains', () => {
    const o = offsetLosses({ gainLines: [line('10000'), line('-4000')], broughtForwardLoss: '5000', dividendIncomeIls: '0', interestIncomeIls: '0' })
    // current loss 4000 -> gains 10000 = 6000; BF 5000 -> 6000 = 1000 net; BF fully used
    expect(o.netCapitalGainIls).toBe('1000')
    expect(o.broughtForwardUsedIls).toBe('5000')
    expect(o.carryForwardLossIls).toBe('0')
  })
})
