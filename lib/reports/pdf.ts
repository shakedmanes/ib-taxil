import { jsPDF } from 'jspdf'
import { mapToFields } from './field-map'
import type { FilingPackage } from './filing-package'

// Renders the Filing Package summary + ITA field map + disclaimer.
// Pure output: never computes tax — it reads the package only (ADR-0007).
export async function generatePdf(pkg: FilingPackage): Promise<Blob> {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(`IB-Taxil — Investment Portion ${pkg.summary.taxYear}`, 14, 18)

  doc.setFontSize(11)
  let y = 30
  const line = (k: string, v: string) => {
    doc.text(`${k}: ${v}`, 14, y)
    y += 8
  }
  line('Net capital gain (ILS)', pkg.summary.netCapitalGainIls)
  line('Capital gains tax (ILS)', pkg.summary.capitalGainsTaxIls)
  line('Foreign tax credit (ILS)', pkg.summary.totalCreditIls)
  line('Surtax (ILS)', pkg.summary.surtaxIls)
  line('Total tax liability (ILS)', pkg.summary.totalTaxLiabilityIls)

  y += 6
  doc.text('ITA form fields:', 14, y)
  y += 8
  for (const f of mapToFields(pkg.result)) {
    doc.text(`${f.form} · ${f.field}: ${f.valueIls}`, 14, y)
    y += 7
  }

  y += 6
  doc.setFontSize(9)
  doc.text(
    'Calculation aid only — verify with a licensed tax advisor before filing.',
    14,
    y,
  )
  return doc.output('blob')
}
