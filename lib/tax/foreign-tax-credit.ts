import { add, sub, min, pct, max, zero } from './decimal'
import { explainCredit } from './explain'
import type { DividendLine, InterestLine, CountryCreditLine } from './types'

const DIVIDEND_TREATY_CAP = '25'    // % of gross (US-Israel Art.12)
const INTEREST_TREATY_CAP = '17.5'  // % of gross (US-Israel Art.13)

export function applyForeignTaxCredit(
  dividendLines: DividendLine[],
  interestLines: InterestLine[],
): {
  dividendLines: DividendLine[]
  interestLines: InterestLine[]
  countryCredits: CountryCreditLine[]
  totalCreditIls: string
  totalExcessCarryForwardIls: string
} {
  const divs = dividendLines.map(l => ({ ...l }))
  const ints = interestLines.map(l => ({ ...l }))
  const countryCredits: CountryCreditLine[] = []
  let totalCreditIls = zero
  let totalExcessCarryForwardIls = zero

  const processBasket = (
    basket: 'dividend' | 'interest',
    lines: Array<DividendLine | InterestLine>,
    capRate: string,
  ) => {
    const byCountry = new Map<string, number[]>()
    lines.forEach((l, i) => {
      const arr = byCountry.get(l.sourceCountry) ?? []
      arr.push(i); byCountry.set(l.sourceCountry, arr)
    })
    for (const [country, idxs] of byCountry) {
      // per-line: creditable withholding is capped at the treaty rate on that line's gross
      let poolCreditable = zero
      let ceiling = zero
      for (const i of idxs) {
        const l = lines[i]
        const lineCap = pct(l.grossIls, capRate)
        const over = max(sub(l.withheldIls, lineCap), zero)
        l.overWithheldIls = over
        const creditableWithheld = min(l.withheldIls, lineCap)
        poolCreditable = add(poolCreditable, creditableWithheld)
        ceiling = add(ceiling, l.israeliTaxIls)
      }
      const credited = min(poolCreditable, ceiling)
      const excess = max(sub(poolCreditable, ceiling), zero)
      // distribute credit across lines proportional to each line's Israeli tax
      let creditLeft = credited
      idxs.forEach((i, k) => {
        const l = lines[i]
        const share = k === idxs.length - 1 ? creditLeft : min(l.israeliTaxIls, creditLeft)
        l.creditIls = share
        l.netTaxIls = sub(l.israeliTaxIls, share)
        creditLeft = sub(creditLeft, share)
      })
      totalCreditIls = add(totalCreditIls, credited)
      totalExcessCarryForwardIls = add(totalExcessCarryForwardIls, excess)
      countryCredits.push({
        country, basket,
        foreignTaxIls: poolCreditable, ceilingIls: ceiling,
        creditedIls: credited, excessCarryForwardIls: excess,
        explanation: explainCredit({
          country, foreignTaxIls: poolCreditable, ceilingIls: ceiling,
          creditedIls: credited, excessCarryForwardIls: excess,
        }),
      })
    }
  }

  processBasket('dividend', divs, DIVIDEND_TREATY_CAP)
  processBasket('interest', ints, INTEREST_TREATY_CAP)

  return {
    dividendLines: divs as DividendLine[],
    interestLines: ints as InterestLine[],
    countryCredits, totalCreditIls, totalExcessCarryForwardIls,
  }
}
