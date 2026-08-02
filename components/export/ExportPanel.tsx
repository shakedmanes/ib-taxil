'use client'

import { useTranslations } from 'next-intl'
import { generatePdf } from '@/lib/reports/pdf'
import { generateExcel } from '@/lib/reports/excel'
import { buildFilingPackage } from '@/lib/reports/filing-package'
import { mapToFields } from '@/lib/reports/field-map'
import { formatIls } from '@/lib/tax/decimal'
import type { TaxResult } from '@/lib/tax/types'

interface Props { result: TaxResult }

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Consumes an OK TaxResult, builds the versioned Filing Package (Plan D), and
// offers the three downloads plus the on-screen ITA field guide (mapToFields).
export function ExportPanel({ result }: Props) {
  const t = useTranslations('exportPanel')
  const tField = useTranslations()  // field.* labels live at the message root

  const buildPackage = () => buildFilingPackage(result, { generatedAt: new Date().toISOString() })
  const base = `ib-taxil-${result.taxYear}`

  const handlePdf = async () => download(await generatePdf(buildPackage()), `${base}.pdf`)
  const handleExcel = async () => download(await generateExcel(buildPackage()), `${base}.xlsx`)
  const handleJson = () =>
    download(
      new Blob([JSON.stringify(buildPackage(), null, 2)], { type: 'application/json' }),
      `${base}.json`,
    )

  const fields = mapToFields(result)

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={handlePdf}
          className="flex flex-col items-center gap-2 p-6 bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800 rounded-2xl hover:border-red-400 transition-colors"
        >
          <span className="text-3xl">📄</span>
          <span className="font-semibold text-red-800 dark:text-red-200">{t('downloadPdf')}</span>
          <span className="text-xs text-red-600 dark:text-red-400">{t('pdfSubtitle')}</span>
        </button>

        <button
          onClick={handleExcel}
          className="flex flex-col items-center gap-2 p-6 bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800 rounded-2xl hover:border-green-400 transition-colors"
        >
          <span className="text-3xl">📊</span>
          <span className="font-semibold text-green-800 dark:text-green-200">{t('downloadExcel')}</span>
          <span className="text-xs text-green-600 dark:text-green-400">{t('excelSubtitle')}</span>
        </button>

        <button
          onClick={handleJson}
          className="flex flex-col items-center gap-2 p-6 bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-2xl hover:border-blue-400 transition-colors"
        >
          <span className="text-3xl">🧾</span>
          <span className="font-semibold text-blue-800 dark:text-blue-200">{t('downloadJson')}</span>
          <span className="text-xs text-blue-600 dark:text-blue-400">{t('jsonSubtitle')}</span>
        </button>
      </div>

      <h3 className="font-bold text-slate-900 dark:text-white mb-1">{t('itaFieldGuide')}</h3>
      <p className="text-xs text-slate-500 mb-4">{t('itaFieldGuideHelp')}</p>
      <div className="space-y-3">
        {fields.map((f, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex justify-between items-center gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                {f.code ? t('formField', { form: f.form, code: f.code }) : t('formLabel', { form: f.form })}
                {f.code && f.status === 'unverified' && <span className="text-amber-600 dark:text-amber-400"> · {t('confirmCode')}</span>}
              </p>
              <p className="text-sm text-slate-900 dark:text-white">{tField(f.labelKey)}</p>
            </div>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300 font-mono whitespace-nowrap">
              {formatIls(f.valueIls)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
