'use client'

import { useTranslations } from 'next-intl'
import { add, formatIls, gt, zero } from '@/lib/tax/decimal'
import { Explain } from '@/components/common/Explain'
import type { TaxResult, DividendLine, InterestLine } from '@/lib/tax/types'

interface Props { result: TaxResult; onBack: () => void }

function Stage({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className="flex-none w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">{n}</span>
        <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">{children}</div>
    </div>
  )
}

function FieldRow({ form, label, value }: { form: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
      <div>
        <span className="inline-block text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 rounded px-1.5 py-0.5 me-2">{form}</span>
        <span className="text-slate-800 dark:text-slate-100">{label}</span>
      </div>
      <span className="font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">{value}</span>
    </div>
  )
}

// Optional final step: a deep, field-by-field walkthrough of filling the Israeli
// annual return for the investment portion, with the user's computed figures.
// Form names are reliable; exact box numbers are a verify item (see the caveat).
export function Step7Filing({ result, onBack }: Props) {
  const t = useTranslations('filingGuide')

  const F = { capitalAppendix: '1325 · נספח ג(1)', foreignAppendix: '1324 · נספח ד׳', main: '1301' }
  const sumGross = (lines: (DividendLine | InterestLine)[]) => lines.reduce((s, l) => add(s, l.grossIls), zero)
  const dividendsGross = sumGross(result.dividendLines)
  const interestGross = sumGross(result.interestLines)
  const overWithheld = [...result.dividendLines, ...result.interestLines].filter(l => gt(l.overWithheldIls, '0'))

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{t('title', { year: result.taxYear })}</h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{t('subtitle')}</p>

      <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl">
        <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">{t('disclaimerTitle')}</p>
        <p className="text-sm text-amber-800 dark:text-amber-200">{t('disclaimer')}</p>
      </div>

      <div className="space-y-4">
        <Stage n={1} title={t('stage1Title')}>
          <p>{t('stage1Body')}</p>
          <p className="text-xs text-slate-500">{t('scopeNote')}</p>
        </Stage>

        <Stage n={2} title={t('stage2Title')}>
          <p>{t('stage2Body')}</p>
          {result.capitalGainLines.length === 0 ? (
            <p className="text-slate-400">{t('noCapitalGains')}</p>
          ) : (
            <>
              <p className="font-medium text-slate-700 dark:text-slate-200">{t('perLotIntro')}</p>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      {[t('colSecurity'), t('colBuyDate'), t('colSellDate'), t('colProceeds'), t('colCost'), t('colGain')].map(h => (
                        <th key={h} className="px-3 py-2 text-start font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {result.capitalGainLines.map((l, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-mono font-semibold text-slate-900 dark:text-white">{l.ticker}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{l.openDate}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{l.saleDate}</td>
                        <td className="px-3 py-2 text-end whitespace-nowrap">{formatIls(l.proceedsIls)}</td>
                        <td className="px-3 py-2 text-end whitespace-nowrap">{formatIls(l.costIls)}</td>
                        <td className={`px-3 py-2 text-end whitespace-nowrap font-semibold ${gt(l.gainIls, '0') ? 'text-green-600' : 'text-red-600'}`}>{formatIls(l.gainIls)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <FieldRow form={F.capitalAppendix} label={t('netGainLabel')} value={formatIls(result.netCapitalGainIls)} />
              <FieldRow form={F.capitalAppendix} label={t('capitalTaxLabel')} value={formatIls(result.capitalGainsTaxIls)} />
              <p className="text-xs text-slate-500">{t('lossNote')}</p>
              <Explain explanation={result.lossOffsetExplanation} />
            </>
          )}
        </Stage>

        <Stage n={3} title={t('stage3Title')}>
          <p>{t('stage3Body')}</p>
          <FieldRow form={F.foreignAppendix} label={t('dividendsGrossLabel')} value={formatIls(dividendsGross)} />
          <FieldRow form={F.foreignAppendix} label={t('interestGrossLabel')} value={formatIls(interestGross)} />
          {result.countryCredits.length > 0 && (
            <>
              <p className="font-medium text-slate-700 dark:text-slate-200">{t('creditIntro')}</p>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      {[t('colCountry'), t('colBasket'), t('colForeignTax'), t('colCeiling'), t('colCredited'), t('colExcess')].map(h => (
                        <th key={h} className="px-3 py-2 text-start font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {result.countryCredits.map((c, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">{c.country || '—'}</td>
                        <td className="px-3 py-2">{c.basket}</td>
                        <td className="px-3 py-2 text-end whitespace-nowrap">{formatIls(c.foreignTaxIls)}</td>
                        <td className="px-3 py-2 text-end whitespace-nowrap">{formatIls(c.ceilingIls)}</td>
                        <td className="px-3 py-2 text-end whitespace-nowrap">{formatIls(c.creditedIls)}</td>
                        <td className="px-3 py-2 text-end whitespace-nowrap">{formatIls(c.excessCarryForwardIls)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <FieldRow form={F.foreignAppendix} label={t('creditTotalLabel')} value={formatIls(result.totalCreditIls)} />
        </Stage>

        <Stage n={4} title={t('stage4Title')}>
          <p>{t('stage4Body')}</p>
          {result.surtaxExplanation
            ? <Explain explanation={result.surtaxExplanation} />
            : <p className="text-slate-400">{t('surtaxSkipped')}</p>}
          <FieldRow form={F.main} label={t('surtaxLabel')} value={formatIls(result.surtaxIls)} />
        </Stage>

        <Stage n={5} title={t('stage5Title')}>
          <p>{t('stage5Body')}</p>
          <FieldRow form={t('recordKeep')} label={t('carryLossLabel')} value={formatIls(result.carryForwardLossIls)} />
          <FieldRow form={t('recordKeep')} label={t('excessCreditLabel')} value={formatIls(result.totalExcessCreditCarryForwardIls)} />
        </Stage>

        <Stage n={6} title={t('stage6Title')}>
          {overWithheld.length === 0 ? (
            <p className="text-slate-400">{t('noOverWithheld')}</p>
          ) : (
            <>
              <p>{t('overWithheldBody')}</p>
              <ul className="list-disc ms-5 space-y-1">
                {overWithheld.map((l, i) => (
                  <li key={i}>
                    <span className="font-mono font-semibold">{'ticker' in l ? l.ticker : l.description}</span>
                    {' — '}{t('overWithheldItem', { amount: formatIls(l.overWithheldIls), country: l.sourceCountry || '—' })}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Stage>

        <Stage n={7} title={t('stage7Title')}>
          <p>{t('stage7Body')}</p>
          <FieldRow form={F.main} label={t('totalLabel')} value={formatIls(result.totalTaxLiabilityIlsRounded)} />
          <p className="text-xs text-slate-500">{t('signOffNote')}</p>
        </Stage>
      </div>

      <div className="flex justify-start mt-8">
        <button onClick={onBack} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:underline">
          {t('back')}
        </button>
      </div>
    </div>
  )
}
