export interface Explanation {
  code: string
  params: Record<string, string>
}

export const explainCapitalGain = (p: {
  ticker: string; proceedsIls: string; costIls: string; gainIls: string
  saleDate: string; saleRate: string; openDate: string; openRate: string
}): Explanation => ({ code: 'explain.capitalGain', params: { ...p } })

export const explainDividend = (p: {
  ticker: string; grossIls: string; rate: string; israeliTaxIls: string
  creditIls: string; netTaxIls: string; payDate: string; fxRate: string
}): Explanation => ({ code: 'explain.dividend', params: { ...p } })

export const explainInterest = (p: {
  description: string; grossIls: string; rate: string; israeliTaxIls: string
  creditIls: string; netTaxIls: string; payDate: string; fxRate: string
}): Explanation => ({ code: 'explain.interest', params: { ...p } })

export const explainOverWithholding = (p: {
  ticker: string; excessIls: string; capRate: string
}): Explanation => ({ code: 'explain.overWithholding', params: { ...p } })

export const explainLossOffset = (p: {
  currentLossIls: string; broughtForwardIls: string; usedAgainstGainsIls: string
  usedAgainstIncomeIls: string; carryForwardIls: string
}): Explanation => ({ code: 'explain.lossOffset', params: { ...p } })

export const explainSurtax = (p: {
  otherIncomeIls: string; capitalIncomeIls: string; thresholdIls: string
  baseSurtaxIls: string; capitalSurtaxIls: string; totalSurtaxIls: string
}): Explanation => ({ code: 'explain.surtax', params: { ...p } })

export const explainCredit = (p: {
  country: string; foreignTaxIls: string; ceilingIls: string
  creditedIls: string; excessCarryForwardIls: string
}): Explanation => ({ code: 'explain.credit', params: { ...p } })
