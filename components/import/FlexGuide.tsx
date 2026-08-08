'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface Props {
  /** Tax year, used to name the exact date range in the guide. */
  taxYear?: number
  defaultOpen?: boolean
}

// Declared at module scope (not inside render) so it keeps a stable identity.
function Step({ title, body, items }: { title: string; body?: string; items?: string[] }) {
  return (
    <div>
      <p className="font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      {body && <p className="mt-0.5">{body}</p>}
      {items && (
        <ul className="list-disc ms-5 mt-1 space-y-0.5">
          {items.map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      )}
    </div>
  )
}

// Comprehensive, step-by-step "how to build, run and download your Flex Query"
// guide (ADR-0003 — a Flex Query with Closed Lots detail is required; an Activity
// Statement is not enough). Shown in the import step and expanded automatically
// when an Activity Statement is rejected.
export function FlexGuide({ taxYear, defaultOpen = false }: Props) {
  const t = useTranslations('flexGuide')
  const [open, setOpen] = useState(defaultOpen)
  const year = taxYear ?? new Date().getFullYear() - 1

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-4 py-3 text-start text-sm font-semibold text-slate-800 dark:text-slate-100"
      >
        {t('toggle')}
        <span className="text-slate-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300 space-y-4">
          <p>{t('intro')}</p>

          {/* The three settings people most often get wrong. */}
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">{t('criticalTitle')}</p>
            <ul className="list-disc ms-5 space-y-1 text-amber-800 dark:text-amber-200">
              <li>{t('critical1')}</li>
              <li>{t('critical2')}</li>
              <li>{t('critical3', { year })}</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Step title={t('step1Title')} body={t('step1Body')} />
            <Step title={t('step2Title')} body={t('step2Body')} />
            <Step title={t('step3Title', { year })} body={t('step3Body')} />
            <Step
              title={t('step4Title')}
              body={t('step4Body')}
              items={[t('step4Item1'), t('step4Item2'), t('step4Item3')]}
            />
            <Step
              title={t('step5Title')}
              body={t('step5Body')}
              items={[t('step5Item1'), t('step5Item2'), t('step5Item3'), t('step5Item4')]}
            />
            <Step
              title={t('step6Title')}
              body={t('step6Body')}
              items={[t('step6Item1'), t('step6Item2'), t('step6Item3', { year }), t('step6Item4')]}
            />
            <Step title={t('step7Title')} body={t('step7Body')} />
            <Step title={t('step8Title')} body={t('step8Body', { year })} />
            <Step title={t('step9Title')} body={t('step9Body')} />
          </div>

          {/* Map the tool's own error messages back to the setting that caused them. */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
            <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1">{t('troubleshootTitle')}</p>
            <ul className="list-disc ms-5 space-y-1">
              <li>{t('trouble1')}</li>
              <li>{t('trouble2')}</li>
              <li>{t('trouble3', { year })}</li>
            </ul>
          </div>

          <p className="text-xs text-slate-400">{t('note')}</p>
        </div>
      )}
    </div>
  )
}
