import { add, sub, mul, pct, abs, min, gt, isNeg, toIls, zero } from './decimal'
import type { IBKRData } from '@/lib/ibkr/types'
import type { RatesMap } from '@/lib/boi/types'
import type { TaxResult, CapitalGainLine, DividendLine, ForeignIncomeLine } from './types'
import { getRateForDate } from '@/lib/boi/rates'

const CAPITAL_GAINS_RATE = '25'
const DIVIDEND_RATE = '25'
const FOREIGN_INCOME_RATE = '25'

export function calculateTax(data: IBKRData, rates: RatesMap, taxYear: number): TaxResult {
  const exchangeRatesUsed: Array<{ date: string; rate: string }> = []

  function convert(amountUsd: string, date: string): string {
    const rate = getRateForDate(rates, date)
    if (!exchangeRatesUsed.find(r => r.date === date)) {
      exchangeRatesUsed.push({ date, rate })
    }
    return toIls(mul(amountUsd, rate))
  }

  // --- Capital Gains ---
  const capitalGainLines: CapitalGainLine[] = []
  let totalGains = zero
  let totalLosses = zero

  for (const trade of data.trades.filter(t => t.tradeType === 'sell')) {
    const gainLossIls = convert(trade.gainLossUsd, trade.date)
    const proceedsIls = convert(trade.proceedsUsd, trade.date)
    const costIls = convert(trade.costUsd, trade.date)
    const rate = getRateForDate(rates, trade.date)

    capitalGainLines.push({
      ticker: trade.ticker,
      description: trade.description,
      saleDateStr: trade.date,
      buyDateStr: '',
      proceedsIls,
      costIls,
      gainLossIls,
      taxUsd: trade.gainLossUsd,
      exchangeRateUsed: rate,
    })

    if (isNeg(gainLossIls)) {
      totalLosses = add(totalLosses, abs(gainLossIls))
    } else {
      totalGains = add(totalGains, gainLossIls)
    }
  }

  const netCapitalGainIls = gt(totalGains, totalLosses)
    ? toIls(sub(totalGains, totalLosses))
    : '0'
  const capitalGainsTaxIls = toIls(pct(netCapitalGainIls, CAPITAL_GAINS_RATE))

  // --- Dividends ---
  const dividendLines: DividendLine[] = []
  let totalDividendsIls = zero
  let totalDividendsTaxIls = zero

  for (const div of data.dividends) {
    const grossIls = convert(div.amountUsd, div.date)
    const withheldIls = convert(div.withheldTaxUsd, div.date)
    const israeliTaxDue = toIls(pct(grossIls, DIVIDEND_RATE))
    const creditApplied = toIls(min(withheldIls, israeliTaxDue))
    const netTaxDue = toIls(sub(israeliTaxDue, creditApplied))

    dividendLines.push({
      ticker: div.ticker,
      date: div.date,
      grossIls,
      withheldTaxIls: withheldIls,
      israeliTaxDue,
      creditApplied,
      netTaxDue,
    })

    totalDividendsIls = add(totalDividendsIls, grossIls)
    totalDividendsTaxIls = add(totalDividendsTaxIls, netTaxDue)
  }

  // --- Foreign Income ---
  const foreignIncomeLines: ForeignIncomeLine[] = []
  let totalForeignIncomeIls = zero
  let totalForeignIncomeTaxIls = zero

  for (const inc of data.foreignIncome) {
    const grossIls = convert(inc.amountUsd, inc.date)
    const withheldIls = convert(inc.withheldTaxUsd, inc.date)
    const israeliTaxDue = toIls(pct(grossIls, FOREIGN_INCOME_RATE))
    const creditApplied = toIls(min(withheldIls, israeliTaxDue))
    const netTaxDue = toIls(sub(israeliTaxDue, creditApplied))

    foreignIncomeLines.push({
      description: inc.description,
      date: inc.date,
      grossIls,
      withheldTaxIls: withheldIls,
      israeliTaxDue,
      creditApplied,
      netTaxDue,
    })

    totalForeignIncomeIls = add(totalForeignIncomeIls, grossIls)
    totalForeignIncomeTaxIls = add(totalForeignIncomeTaxIls, netTaxDue)
  }

  const totalForeignTaxCreditIls = toIls(
    add(
      dividendLines.reduce((s, d) => add(s, d.creditApplied), zero),
      foreignIncomeLines.reduce((s, f) => add(s, f.creditApplied), zero),
    ),
  )

  const totalTaxLiabilityIls = toIls(
    add(add(capitalGainsTaxIls, totalDividendsTaxIls), totalForeignIncomeTaxIls),
  )

  return {
    taxYear,
    totalCapitalGainsIls: toIls(totalGains),
    totalCapitalLossesIls: toIls(totalLosses),
    netCapitalGainIls,
    capitalGainsTaxIls,
    totalDividendsIls: toIls(totalDividendsIls),
    dividendsTaxIls: toIls(totalDividendsTaxIls),
    totalForeignIncomeIls: toIls(totalForeignIncomeIls),
    foreignIncomeTaxIls: toIls(totalForeignIncomeTaxIls),
    totalForeignTaxCreditIls,
    totalTaxLiabilityIls,
    capitalGainLines,
    dividendLines,
    foreignIncomeLines,
    exchangeRatesUsed,
  }
}
