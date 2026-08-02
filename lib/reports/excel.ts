import ExcelJS from 'exceljs'
import type { FilingPackage } from './filing-package'

// Renders the Filing Package into a multi-sheet workbook.
// Pure output: never computes tax — it reads the package only (ADR-0007).
export async function generateExcel(pkg: FilingPackage): Promise<Blob> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'IB-Taxil'
  wb.created = new Date()

  const s = wb.addWorksheet('Summary')
  s.addRows([
    ['Tax year', pkg.summary.taxYear],
    ['Net capital gain (ILS)', pkg.summary.netCapitalGainIls],
    ['Capital gains tax (ILS)', pkg.summary.capitalGainsTaxIls],
    ['Dividends tax (ILS)', pkg.summary.dividendsTaxIls],
    ['Interest tax (ILS)', pkg.summary.interestTaxIls],
    ['Foreign tax credit (ILS)', pkg.summary.totalCreditIls],
    ['Surtax (ILS)', pkg.summary.surtaxIls],
    ['Total tax liability (ILS)', pkg.summary.totalTaxLiabilityIls],
    ['Carry-forward loss (ILS)', pkg.summary.carryForwardLossIls],
    ['Excess credit carry-forward (ILS)', pkg.summary.excessCreditCarryForwardIls],
  ])

  const cg = wb.addWorksheet('Capital Gains')
  cg.addRow(['Ticker', 'Open date', 'Sale date', 'Open rate', 'Sale rate', 'Proceeds ILS', 'Cost ILS', 'Gain ILS'])
  pkg.result.capitalGainLines.forEach(l =>
    cg.addRow([l.ticker, l.openDate, l.saleDate, l.openRate, l.saleRate, l.proceedsIls, l.costIls, l.gainIls]),
  )

  const dv = wb.addWorksheet('Dividends')
  dv.addRow(['Ticker', 'Pay date', 'Gross ILS', 'Rate %', 'Israeli tax ILS', 'Credit ILS', 'Net tax ILS', 'Over-withheld ILS'])
  pkg.result.dividendLines.forEach(l =>
    dv.addRow([l.ticker, l.payDate, l.grossIls, l.rate, l.israeliTaxIls, l.creditIls, l.netTaxIls, l.overWithheldIls]),
  )

  const it = wb.addWorksheet('Interest')
  it.addRow(['Description', 'Pay date', 'Gross ILS', 'Israeli tax ILS', 'Credit ILS', 'Net tax ILS'])
  pkg.result.interestLines.forEach(l =>
    it.addRow([l.description, l.payDate, l.grossIls, l.israeliTaxIls, l.creditIls, l.netTaxIls]),
  )

  const cr = wb.addWorksheet('Credits')
  cr.addRow(['Country', 'Basket', 'Foreign tax ILS', 'Ceiling ILS', 'Credited ILS', 'Excess carry-forward ILS'])
  pkg.result.countryCredits.forEach(l =>
    cr.addRow([l.country, l.basket, l.foreignTaxIls, l.ceilingIls, l.creditedIls, l.excessCarryForwardIls]),
  )

  const rt = wb.addWorksheet('Rates Used')
  rt.addRow(['Currency', 'Date', 'Rate'])
  pkg.result.exchangeRatesUsed.forEach(r => rt.addRow([r.currency, r.date, r.rate]))

  const q = wb.addWorksheet('Quarantined')
  q.addRow(['Kind', 'Description'])
  pkg.result.quarantined.forEach(x => q.addRow([x.kind, x.description]))

  const buf = await wb.xlsx.writeBuffer()
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
