/** Manual, in-memory-only inputs collected in the "Additional details" step. */
export interface UserInputs {
  /** Tickers the user declared as a substantial holding (30% instead of 25%). */
  substantialHoldings: string[]
  /** Prior-year capital loss carried in (ILS decimal string). Offsets current gains ONLY. */
  broughtForwardLoss: string
  /** Total other annual taxable income (ILS) for surtax; undefined => skip surtax. */
  otherIncomeIls?: string
}
