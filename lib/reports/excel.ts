import ExcelJS from 'exceljs'
import { toIls } from '@/lib/tax/decimal'
import type { TaxResult } from '@/lib/tax/types'

export async function generateExcel(result: TaxResult, taxYear: number): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'IB-Taxil'
  wb.created = new Date()

  // Sheet 1: Summary
  const summary = wb.addWorksheet('Summary')
  summary.addRows([
    [`IB-Taxil Tax Report`, `Tax Year ${taxYear}`],
    [],
    ['Category', 'Amount (ILS)'],
    ['Total Capital Gains', toIls(result.totalCapitalGainsIls)],
    ['Total Capital Losses', toIls(result.totalCapitalLossesIls)],
    ['Net Capital Gain', toIls(result.netCapitalGainIls)],
    ['Capital Gains Tax (25%)', toIls(result.capitalGainsTaxIls)],
    ['Total Dividends', toIls(result.totalDividendsIls)],
    ['Dividends Tax', toIls(result.dividendsTaxIls)],
    ['Foreign Tax Credits', toIls(result.totalForeignTaxCreditIls)],
    ['TOTAL TAX LIABILITY', toIls(result.totalTaxLiabilityIls)],
  ])

  // Sheet 2: Capital Gains
  const gains = wb.addWorksheet('Capital Gains')
  gains.addRow(['Ticker', 'Sale Date', 'Buy Date', 'Proceeds (ILS)', 'Cost (ILS)', 'Gain/Loss (ILS)', 'Exchange Rate'])
  for (const l of result.capitalGainLines) {
    gains.addRow([l.ticker, l.saleDateStr, l.buyDateStr, l.proceedsIls, l.costIls, l.gainLossIls, l.exchangeRateUsed])
  }

  // Sheet 3: Dividends
  const divs = wb.addWorksheet('Dividends')
  divs.addRow(['Ticker', 'Date', 'Gross (ILS)', 'Withheld Tax (ILS)', 'Israeli Tax', 'Foreign Credit', 'Net Tax Due'])
  for (const l of result.dividendLines) {
    divs.addRow([l.ticker, l.date, l.grossIls, l.withheldTaxIls, l.israeliTaxDue, l.creditApplied, l.netTaxDue])
  }

  // Sheet 4: Exchange Rates
  const rates = wb.addWorksheet('Exchange Rates')
  rates.addRow(['Date', 'USD to ILS (BOI)'])
  for (const r of result.exchangeRatesUsed) {
    rates.addRow([r.date, r.rate])
  }

  // Write to buffer and trigger browser download
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `IB-Taxil-${taxYear}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
