'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { sub, isNeg } from '@/lib/tax/decimal'
import type { IBKRData } from '@/lib/ibkr/types'

interface Props { data: IBKRData; taxYear: number }

const fmt = (x: string) =>
  Number(x).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function YearBadge({ inYear, label }: { inYear: boolean; label: string }) {
  const cls = inYear
    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
  return <span className={`whitespace-nowrap px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{label}</span>
}

// Read-only preview of parsed records in their native currency. Rows are marked
// as included in the chosen tax year or shown only for reference. Shekel figures
// appear after calculation (rates are fetched at the calculation gate).
export function TradeTable({ data, taxYear }: Props) {
  const t = useTranslations('tradeTable')
  const [search, setSearch] = useState('')
  const yr = String(taxYear)
  const matches = (...fields: string[]) =>
    !search || fields.some(f => f.toLowerCase().includes(search.toLowerCase()))

  const lots = data.closedLots
    .filter(l => matches(l.ticker, l.description))
    .map(l => ({ ...l, inYear: l.saleDate.startsWith(yr), gl: sub(l.proceeds, l.cost) }))
    .sort((a, b) => Number(b.inYear) - Number(a.inYear) || a.saleDate.localeCompare(b.saleDate))

  const income = [
    ...data.dividends.map(d => ({ id: d.id, ticker: d.ticker, desc: d.description, date: d.payDate, kind: t('kindDividend'), amount: d.gross, currency: d.currency })),
    ...data.interest.map(i => ({ id: i.id, ticker: i.description, desc: i.description, date: i.payDate, kind: t('kindInterest'), amount: i.gross, currency: i.currency })),
  ]
    .filter(r => matches(r.ticker, r.desc))
    .map(r => ({ ...r, inYear: r.date.startsWith(yr) }))
    .sort((a, b) => Number(b.inYear) - Number(a.inYear) || a.date.localeCompare(b.date))

  const lotsIn = lots.filter(l => l.inYear).length
  const lotsOut = lots.length - lotsIn

  return (
    <div className="space-y-6">
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={t('searchPlaceholder')}
        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
      />

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('closedLotsTitle')}</h4>
          <span className="text-xs text-slate-500">{t('lotsCount', { inYear: lotsIn, total: lots.length, year: taxYear })}</span>
        </div>

        {lotsOut > 0 && (
          <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200">
            {t('otherYearWarning', { outCount: lotsOut, year: taxYear })}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                {[t('colTicker'), t('colOpen'), t('colSale'), t('colQty'), t('colProceeds'), t('colCost'), t('colGainLoss'), t('colCurrency'), t('colStatus')].map(h => (
                  <th key={h} className="px-3 py-2 text-start text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {lots.map(l => {
                const loss = isNeg(l.gl)
                return (
                  <tr key={l.id} className={l.inYear ? '' : 'opacity-60'}>
                    <td className="px-3 py-2">
                      <div className="font-mono font-semibold text-slate-900 dark:text-white">{l.ticker}</div>
                      {l.description && <div className="text-xs text-slate-400 truncate max-w-[16rem]">{l.description}</div>}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{l.openDate}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{l.saleDate}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300 text-end">{l.quantity}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300 text-end whitespace-nowrap">{fmt(l.proceeds)}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300 text-end whitespace-nowrap">{fmt(l.cost)}</td>
                    <td className={`px-3 py-2 text-end whitespace-nowrap font-semibold ${loss ? 'text-red-600' : 'text-green-600'}`}>
                      {loss ? '' : '+'}{fmt(l.gl)}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{l.currency}</td>
                    <td className="px-3 py-2"><YearBadge inYear={l.inYear} label={l.inYear ? t('inYearBadge', { year: taxYear }) : t('otherYearBadge', { year: l.saleDate.slice(0, 4) })} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {lots.length === 0 && <p className="text-center py-6 text-slate-400 text-sm">{t('noRecords')}</p>}
        </div>
        <p className="mt-2 text-xs text-slate-400">{t('nativeGainNote')}</p>
      </div>

      {income.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{t('incomeTitle')}</h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  {[t('colTicker'), t('colDate'), t('colType'), t('colAmount'), t('colCurrency'), t('colStatus')].map(h => (
                    <th key={h} className="px-3 py-2 text-start text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {income.map(r => (
                  <tr key={r.id} className={r.inYear ? '' : 'opacity-60'}>
                    <td className="px-3 py-2 font-mono font-semibold text-slate-900 dark:text-white">{r.ticker}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.date}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{r.kind}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300 text-end whitespace-nowrap">{fmt(r.amount)}</td>
                    <td className="px-3 py-2 text-slate-500">{r.currency}</td>
                    <td className="px-3 py-2"><YearBadge inYear={r.inYear} label={r.inYear ? t('inYearBadge', { year: taxYear }) : t('otherYearBadge', { year: r.date.slice(0, 4) })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
