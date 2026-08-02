import { add, sub, min, max, pct, zero } from './decimal'
import { getYearRates } from './rates'
import { explainSurtax } from './explain'
import type { Explanation } from './explain'

export function computeSurtax(input: {
  taxYear: number
  otherIncomeIls?: string
  capitalIncomeIls: string
}): { surtaxIls: string; explanation: Explanation | null } {
  if (input.otherIncomeIls === undefined) {
    return { surtaxIls: '0', explanation: null }
  }
  const y = getYearRates(input.taxYear)
  const total = add(input.otherIncomeIls, input.capitalIncomeIls)
  const overThreshold = max(sub(total, y.surtaxThresholdIls), zero)
  const baseSurtaxIls = pct(overThreshold, y.surtaxBaseRate)
  const capitalAboveThreshold = max(min(input.capitalIncomeIls, overThreshold), zero)
  const capitalSurtaxIls = pct(capitalAboveThreshold, y.capitalSurtaxRate)
  const totalSurtaxIls = add(baseSurtaxIls, capitalSurtaxIls)
  return {
    surtaxIls: totalSurtaxIls,
    explanation: explainSurtax({
      otherIncomeIls: input.otherIncomeIls, capitalIncomeIls: input.capitalIncomeIls,
      thresholdIls: y.surtaxThresholdIls, baseSurtaxIls, capitalSurtaxIls, totalSurtaxIls,
    }),
  }
}
