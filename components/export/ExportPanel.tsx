'use client'

import { generatePdf } from '@/lib/reports/pdf'
import { generateExcel } from '@/lib/reports/excel'
import { formatIls } from '@/lib/tax/decimal'
import type { TaxResult } from '@/lib/tax/types'

interface Props { result: TaxResult; taxYear: number }

const ITA_FIELDS = [
  {
    field: 'Schedule B, Line 1',
    labelHe: 'נספח ב, שורה 1 — רווח הון',
    description: 'Net capital gain in ILS',
    getValue: (r: TaxResult) => r.netCapitalGainIls,
  },
  {
    field: 'Schedule B, Line 2',
    labelHe: 'נספח ב, שורה 2 — מס רווח הון',
    description: 'Capital gains tax (25%)',
    getValue: (r: TaxResult) => r.capitalGainsTaxIls,
  },
  {
    field: 'Dividends, Line 1',
    labelHe: 'דיבידנדים — סה"כ',
    description: 'Total dividends in ILS',
    getValue: (r: TaxResult) => r.totalDividendsIls,
  },
  {
    field: 'Foreign Tax Credit',
    labelHe: 'זיכוי מס זר',
    description: 'Total foreign tax credit applied',
    getValue: (r: TaxResult) => r.totalForeignTaxCreditIls,
  },
]

export function ExportPanel({ result, taxYear }: Props) {
  const handleExcel = async () => {
    await generateExcel(result, taxYear)
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => generatePdf(result, taxYear)}
          className="flex flex-col items-center gap-2 p-6 bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800 rounded-2xl hover:border-red-400 transition-colors"
        >
          <span className="text-3xl">📄</span>
          <span className="font-semibold text-red-800 dark:text-red-200">Download PDF</span>
          <span className="text-xs text-red-600 dark:text-red-400">Pre-filled tax form</span>
        </button>

        <button
          onClick={handleExcel}
          className="flex flex-col items-center gap-2 p-6 bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800 rounded-2xl hover:border-green-400 transition-colors"
        >
          <span className="text-3xl">📊</span>
          <span className="font-semibold text-green-800 dark:text-green-200">Download Excel</span>
          <span className="text-xs text-green-600 dark:text-green-400">Full breakdown workbook</span>
        </button>

        <div className="flex flex-col items-center gap-2 p-6 bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-2xl">
          <span className="text-3xl">🖥️</span>
          <span className="font-semibold text-blue-800 dark:text-blue-200">On-Screen Form</span>
          <span className="text-xs text-blue-600 dark:text-blue-400">Field-by-field guide below</span>
        </div>
      </div>

      <h3 className="font-bold text-slate-900 dark:text-white mb-4">
        ITA Portal Field Guide — enter these values when filing
      </h3>
      <div className="space-y-3">
        {ITA_FIELDS.map(f => (
          <div key={f.field} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500">{f.field}</p>
              <p className="text-sm text-slate-900 dark:text-white">{f.labelHe}</p>
              <p className="text-xs text-slate-400 mt-0.5">{f.description}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300 font-mono">
                {formatIls(f.getValue(result))}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
