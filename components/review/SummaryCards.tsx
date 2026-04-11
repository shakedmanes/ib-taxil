'use client'

import type { IBKRData } from '@/lib/ibkr/types'

interface Props { data: IBKRData }

export function SummaryCards({ data }: Props) {
  const totalTrades = data.trades.length
  const totalDivs   = data.dividends.length
  const sellTrades  = data.trades.filter(t => t.tradeType === 'sell')
  const gains       = sellTrades.filter(t => Number(t.gainLossUsd) > 0)
  const losses      = sellTrades.filter(t => Number(t.gainLossUsd) < 0)

  const cards = [
    { label: 'Total Trades', value: String(totalTrades) },
    { label: 'Gains',        value: String(gains.length) },
    { label: 'Losses',       value: String(losses.length) },
    { label: 'Dividends',    value: String(totalDivs) },
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
