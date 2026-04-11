'use client'

import { useState } from 'react'
import type { IBKRData } from '@/lib/ibkr/types'

interface Props { data: IBKRData }

type Row = { id: string; date: string; ticker: string; type: string; amountUsd: string; gainLoss?: string }

export function TradeTable({ data }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'trade' | 'dividend'>('all')

  const rows: Row[] = [
    ...data.trades.filter(t => t.tradeType === 'sell').map(t => ({
      id: t.id, date: t.date, ticker: t.ticker,
      type: 'trade', amountUsd: t.proceedsUsd, gainLoss: t.gainLossUsd,
    })),
    ...data.dividends.map(d => ({
      id: d.id, date: d.date, ticker: d.ticker,
      type: 'dividend', amountUsd: d.amountUsd,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  const visible = rows.filter(r => {
    if (filter !== 'all' && r.type !== filter) return false
    if (search && !r.ticker.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const badge = (row: Row) => {
    if (row.type === 'dividend') return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">Dividend</span>
    const gl = Number(row.gainLoss ?? '0')
    if (gl > 0) return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Gain</span>
    if (gl < 0) return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">Loss</span>
    return <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">Flat</span>
  }

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search ticker…"
          className="flex-1 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as 'all' | 'trade' | 'dividend')}
          className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
        >
          <option value="all">All</option>
          <option value="trade">Trades</option>
          <option value="dividend">Dividends</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              {['Date', 'Ticker', 'Type', 'Amount (USD)', 'Gain/Loss (USD)'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {visible.map(row => (
              <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.date}</td>
                <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white">{row.ticker}</td>
                <td className="px-4 py-3">{badge(row)}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">${Number(row.amountUsd).toLocaleString()}</td>
                <td className="px-4 py-3">
                  {row.gainLoss != null && (
                    <span className={Number(row.gainLoss) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {Number(row.gainLoss) >= 0 ? '+' : ''}${Number(row.gainLoss).toLocaleString()}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="text-center py-8 text-slate-400 text-sm">No records match your filter.</p>
        )}
      </div>
    </div>
  )
}
