import { add, sub, min, abs, isNeg, zero } from './decimal'
import { explainLossOffset } from './explain'
import type { CapitalGainLine } from './types'
import type { Explanation } from './explain'

export interface LossOutcome {
  totalGainsIls: string
  totalLossesIls: string
  currentLossUsedAgainstGainsIls: string
  broughtForwardUsedIls: string
  netCapitalGainIls: string
  currentLossUsedAgainstIncomeIls: string
  incomeOffsetRemainingIls: string
  carryForwardLossIls: string
  explanation: Explanation
}

export function offsetLosses(input: {
  gainLines: CapitalGainLine[]
  broughtForwardLoss: string
  dividendIncomeIls: string
  interestIncomeIls: string
}): LossOutcome {
  const totalGainsIls = input.gainLines
    .filter(l => !isNeg(l.gainIls)).reduce((s, l) => add(s, l.gainIls), zero)
  const totalLossesIls = input.gainLines
    .filter(l => isNeg(l.gainIls)).reduce((s, l) => add(s, abs(l.gainIls)), zero)

  // 1. current losses offset current gains
  const currentLossUsedAgainstGainsIls = min(totalLossesIls, totalGainsIls)
  const gainsAfterCurrent = sub(totalGainsIls, currentLossUsedAgainstGainsIls)
  let currentLossRemaining = sub(totalLossesIls, currentLossUsedAgainstGainsIls)

  // 2. brought-forward losses offset remaining current gains ONLY
  const broughtForwardUsedIls = min(input.broughtForwardLoss, gainsAfterCurrent)
  const netCapitalGainIls = sub(gainsAfterCurrent, broughtForwardUsedIls)
  const broughtForwardRemaining = sub(input.broughtForwardLoss, broughtForwardUsedIls)

  // 3. remaining CURRENT losses spill onto dividend+interest income (not BF)
  const incomeBase = add(input.dividendIncomeIls, input.interestIncomeIls)
  const currentLossUsedAgainstIncomeIls = min(currentLossRemaining, incomeBase)
  const incomeOffsetRemainingIls = sub(incomeBase, currentLossUsedAgainstIncomeIls)
  currentLossRemaining = sub(currentLossRemaining, currentLossUsedAgainstIncomeIls)

  // 4. anything left (current + BF) carries forward
  const carryForwardLossIls = add(currentLossRemaining, broughtForwardRemaining)

  return {
    totalGainsIls, totalLossesIls,
    currentLossUsedAgainstGainsIls, broughtForwardUsedIls, netCapitalGainIls,
    currentLossUsedAgainstIncomeIls, incomeOffsetRemainingIls, carryForwardLossIls,
    explanation: explainLossOffset({
      currentLossIls: totalLossesIls,
      broughtForwardIls: input.broughtForwardLoss,
      usedAgainstGainsIls: add(currentLossUsedAgainstGainsIls, broughtForwardUsedIls),
      usedAgainstIncomeIls: currentLossUsedAgainstIncomeIls,
      carryForwardIls: carryForwardLossIls,
    }),
  }
}
