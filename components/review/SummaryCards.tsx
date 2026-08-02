'use client'

import { useTranslations } from 'next-intl'
import type { IBKRData } from '@/lib/ibkr/types'

interface Props { data: IBKRData; taxYear: number }

// High-level counts of what was parsed. The headline card highlights how many
// sales actually fall in the chosen tax year (the rest are shown for reference).
export function SummaryCards({ data, taxYear }: Props) {
  const t = useTranslations('summaryCards')
  const yr = String(taxYear)

  const salesInYear = data.closedLots.filter(l => l.saleDate.startsWith(yr)).length
  const divsInYear = data.dividends.filter(d => d.payDate.startsWith(yr)).length
  const interestInYear = data.interest.filter(i => i.payDate.startsWith(yr)).length

  const cards = [
    { label: t('salesInYear', { year: taxYear }), value: String(salesInYear), sub: t('ofTotal', { total: data.closedLots.length }), highlight: true },
    { label: t('dividends'), value: String(divsInYear), sub: t('ofTotal', { total: data.dividends.length }) },
    { label: t('interest'), value: String(interestInYear), sub: t('ofTotal', { total: data.interest.length }) },
    { label: t('quarantined'), value: String(data.outOfScope.length), sub: '' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {cards.map(c => (
        <div
          key={c.label}
          className={`rounded-xl p-4 border ${
            c.highlight
              ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
          }`}
        >
          <p className="text-xs text-slate-500 mb-1">{c.label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{c.value}</p>
          {c.sub && <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>}
        </div>
      ))}
    </div>
  )
}
