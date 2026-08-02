'use client'

import { useTranslations } from 'next-intl'
import type { IBKRData } from '@/lib/ibkr/types'

interface Props { data: IBKRData }

// High-level counts of what was parsed from the Flex Query (pre-calculation).
export function SummaryCards({ data }: Props) {
  const t = useTranslations('summaryCards')

  const cards = [
    { label: t('closedLots'), value: String(data.closedLots.length) },
    { label: t('dividends'), value: String(data.dividends.length) },
    { label: t('interest'), value: String(data.interest.length) },
    { label: t('quarantined'), value: String(data.outOfScope.length) },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {cards.map(c => (
        <div key={c.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{c.label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{c.value}</p>
        </div>
      ))}
    </div>
  )
}
