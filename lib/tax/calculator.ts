import { add, sub, pct, mul, div, roundShekels, isNeg, gt, zero } from './decimal'
import { MIN_SUPPORTED_YEAR, LATEST_KNOWN_YEAR, isYearProvisional } from './rates'
import { computeCapitalGains } from './capital-gains'
import { offsetLosses } from './losses'
import { computeDividends } from './dividends'
import { computeInterest } from './interest'
import { applyForeignTaxCredit } from './foreign-tax-credit'
import { computeSurtax } from './surtax'
import type { IBKRData } from '@/lib/ibkr/types'
import type { UserInputs } from './user-inputs'
import type { RatesMap, ExchangeRateUsed } from '@/lib/boi/types'
import type { EngineOutput, BlockingIssue, QuarantinedItem, CapitalGainLine } from './types'

/**
 * Weighted capital-gains tax: apply each positive lot's rate (25/30) to its
 * share of the post-offset net gain. If net gain is zero, tax is zero.
 */
function capitalGainsTax(lines: CapitalGainLine[], netGainIls: string): string {
  const positives = lines.filter(l => !isNeg(l.gainIls) && gt(l.gainIls, '0'))
  const grossPositive = positives.reduce((s, l) => add(s, l.gainIls), zero)
  if (grossPositive === '0' || netGainIls === '0') return zero
  return positives.reduce((sum, l) => {
    const share = mul(netGainIls, div(l.gainIls, grossPositive))
    const rate = l.isSubstantial ? '30' : '25'
    return add(sum, pct(share, rate))
  }, zero)
}

export function calculateTax(
  data: IBKRData,
  rates: RatesMap,
  taxYear: number,
  inputs: UserInputs,
): EngineOutput {
  const issues: BlockingIssue[] = []

  if (taxYear < MIN_SUPPORTED_YEAR) {
    issues.push({ code: 'unsupported-year', count: 1, explanation: { code: 'block.unsupportedYear', params: { year: String(taxYear) } } })
    return { status: 'blocked', issues }
  }
  if (!data.hasClosedLotSection) {
    const salesInYear = data.closedLots.filter(l => l.saleDate.startsWith(String(taxYear)))
    issues.push({ code: 'missing-closed-lots', count: salesInYear.length, explanation: { code: 'block.missingClosedLots', params: { count: String(salesInYear.length) } } })
    return { status: 'blocked', issues }
  }

  const usedRates: ExchangeRateUsed[] = []
  const mergeRates = (rs: ExchangeRateUsed[]) => {
    for (const r of rs) if (!usedRates.find(u => u.currency === r.currency && u.date === r.date)) usedRates.push(r)
  }

  try {
    const cg = computeCapitalGains(data.closedLots, rates, taxYear, inputs.substantialHoldings)
    mergeRates(cg.usedRates)
    const dv = computeDividends(data.dividends, rates, taxYear, inputs.substantialHoldings)
    mergeRates(dv.usedRates)
    const it = computeInterest(data.interest, rates, taxYear)
    mergeRates(it.usedRates)

    const dividendIncomeIls = dv.lines.reduce((s, l) => add(s, l.grossIls), zero)
    const interestIncomeIls = it.lines.reduce((s, l) => add(s, l.grossIls), zero)

    const loss = offsetLosses({
      gainLines: cg.lines,
      broughtForwardLoss: inputs.broughtForwardLoss,
      dividendIncomeIls, interestIncomeIls,
    })

    const ftc = applyForeignTaxCredit(dv.lines, it.lines)

    const capitalGainsTaxIls = capitalGainsTax(cg.lines, loss.netCapitalGainIls)

    // Net dividend/interest tax after loss income-offset (scaled proportionally) and credit.
    const incomeBase = add(dividendIncomeIls, interestIncomeIls)
    const incomeAfterLoss = loss.incomeOffsetRemainingIls
    const incomeScale = incomeBase === '0' ? '0' : div(incomeAfterLoss, incomeBase)
    const dividendsGrossTax = ftc.dividendLines.reduce((s, l) => add(s, l.netTaxIls), zero)
    const interestGrossTax = ftc.interestLines.reduce((s, l) => add(s, l.netTaxIls), zero)
    const dividendsTaxIls = mul(dividendsGrossTax, incomeScale)
    const interestTaxIls = mul(interestGrossTax, incomeScale)

    // Keep the reported credit in sync with the loss-scaled tax: when current-year
    // losses offset dividend/interest income, that income is no longer taxed, so the
    // foreign tax credited against it can't be used this year — report only the
    // usable credit and carry the rest forward (§205א). incomeScale is 1 when no
    // losses spill onto income, leaving the common case unchanged.
    const usedCreditIls = mul(ftc.totalCreditIls, incomeScale)
    const excessCreditCarryForwardIls = add(ftc.totalExcessCarryForwardIls, sub(ftc.totalCreditIls, usedCreditIls))

    const capitalIncomeIls = add(loss.netCapitalGainIls, incomeAfterLoss)
    const surtax = computeSurtax({ taxYear, otherIncomeIls: inputs.otherIncomeIls, capitalIncomeIls })

    const totalTax = add(add(add(capitalGainsTaxIls, dividendsTaxIls), interestTaxIls), surtax.surtaxIls)

    const quarantined: QuarantinedItem[] = data.outOfScope.map(o => ({
      kind: o.kind, description: o.description,
      explanation: { code: 'explain.quarantined', params: { kind: o.kind, description: o.description } },
    }))

    const provisional = isYearProvisional(taxYear)
      ? {
          basedOnYear: LATEST_KNOWN_YEAR,
          explanation: { code: 'explain.provisionalYear', params: { year: String(taxYear), basedOn: String(LATEST_KNOWN_YEAR) } },
        }
      : null

    return {
      status: 'ok',
      taxYear,
      provisional,
      capitalGainLines: cg.lines,
      totalGainsIls: loss.totalGainsIls,
      totalLossesIls: loss.totalLossesIls,
      currentLossUsedAgainstGainsIls: loss.currentLossUsedAgainstGainsIls,
      currentLossUsedAgainstIncomeIls: loss.currentLossUsedAgainstIncomeIls,
      broughtForwardUsedIls: loss.broughtForwardUsedIls,
      carryForwardLossIls: loss.carryForwardLossIls,
      netCapitalGainIls: loss.netCapitalGainIls,
      capitalGainsTaxIls,
      dividendLines: ftc.dividendLines,
      interestLines: ftc.interestLines,
      dividendsTaxIls, interestTaxIls,
      countryCredits: ftc.countryCredits,
      totalCreditIls: usedCreditIls,
      totalExcessCreditCarryForwardIls: excessCreditCarryForwardIls,
      surtaxIls: surtax.surtaxIls,
      surtaxExplanation: surtax.explanation,
      totalTaxLiabilityIlsRounded: roundShekels(totalTax),
      lossOffsetExplanation: loss.explanation,
      quarantined,
      exchangeRatesUsed: usedRates,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // A currency with no rates at all is a scope problem, not a missing day.
    if (/No exchange rates loaded for currency|Unsupported currency/i.test(msg)) {
      issues.push({ code: 'unsupported-currency', count: 1, explanation: { code: 'block.unsupportedCurrency', params: {} } })
      return { status: 'blocked', issues }
    }
    // A specific date with no rate on or before it is a genuine data gap.
    if (/rate published on or before|exchange rate/i.test(msg)) {
      issues.push({ code: 'missing-rate', count: 1, explanation: { code: 'block.missingRate', params: { detail: msg } } })
      return { status: 'blocked', issues }
    }
    // Anything else is a real bug — surface it instead of mislabeling it as data.
    throw err
  }
}
