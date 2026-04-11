'use client'

import { useState } from 'react'
import { formatIls } from '@/lib/tax/decimal'
import type { TaxResult } from '@/lib/tax/types'

interface Props { result: TaxResult }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-5 py-4 bg-white dark:bg-slate-900 text-left font-semibold text-slate-900 dark:text-white text-sm"
      >
        {title}
        <span className="text-slate-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-5 pb-4 bg-white dark:bg-slate-900">{children}</div>}
    </div>
  )
}

export function TaxBreakdown({ result }: Props) {
  return (
    <div>
      <Section title={`Capital Gains — Tax: ${formatIls(result.capitalGainsTaxIls)}`}>
        <table className="w-full text-xs mt-2">
          <thead>
            <tr className="text-slate-400">
              <th className="text-left pb-2">Ticker</th>
              <th className="text-left pb-2">Sale Date</th>
              <th className="text-right pb-2">Proceeds (₪)</th>
              <th className="text-right pb-2">Cost (₪)</th>
              <th className="text-right pb-2">Gain/Loss (₪)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {result.capitalGainLines.map((l, i) => (
              <tr key={i}>
                <td className="py-2 font-mono font-semibold">{l.ticker}</td>
                <td className="py-2 text-slate-500">{l.saleDateStr}</td>
                <td className="py-2 text-right">{formatIls(l.proceedsIls)}</td>
                <td className="py-2 text-right">{formatIls(l.costIls)}</td>
                <td className={`py-2 text-right font-semibold ${Number(l.gainLossIls) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatIls(l.gainLossIls)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-slate-400 mt-2">
          Tax rate: 25% × {formatIls(result.netCapitalGainIls)} = {formatIls(result.capitalGainsTaxIls)}
        </p>
      </Section>

      <Section title={`Dividends — Net Tax Due: ${formatIls(result.dividendsTaxIls)}`}>
        <table className="w-full text-xs mt-2">
          <thead>
            <tr className="text-slate-400">
              <th className="text-left pb-2">Ticker</th>
              <th className="text-left pb-2">Date</th>
              <th className="text-right pb-2">Gross (₪)</th>
              <th className="text-right pb-2">Israeli Tax (₪)</th>
              <th className="text-right pb-2">Credit (₪)</th>
              <th className="text-right pb-2">Net Due (₪)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {result.dividendLines.map((l, i) => (
              <tr key={i}>
                <td className="py-2 font-mono font-semibold">{l.ticker}</td>
                <td className="py-2 text-slate-500">{l.date}</td>
                <td className="py-2 text-right">{formatIls(l.grossIls)}</td>
                <td className="py-2 text-right">{formatIls(l.israeliTaxDue)}</td>
                <td className="py-2 text-right text-green-600">-{formatIls(l.creditApplied)}</td>
                <td className="py-2 text-right font-semibold">{formatIls(l.netTaxDue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Exchange Rates Used (Bank of Israel)">
        <table className="w-full text-xs mt-2">
          <thead>
            <tr className="text-slate-400">
              <th className="text-left pb-2">Date</th>
              <th className="text-right pb-2">1 USD = ILS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {result.exchangeRatesUsed.map((r, i) => (
              <tr key={i}>
                <td className="py-2 text-slate-500">{r.date}</td>
                <td className="py-2 text-right font-mono">₪{r.rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-slate-400 mt-2">Source: Bank of Israel representative exchange rates.</p>
      </Section>
    </div>
  )
}
