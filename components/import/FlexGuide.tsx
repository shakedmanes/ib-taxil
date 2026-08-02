'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

// Collapsible "How to build your Flex Query" guide, shown in the import step and
// when an Activity Statement is rejected (ADR-0003 — Flex Query is required).
export function FlexGuide({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const t = useTranslations('flexGuide')
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100"
      >
        {t('toggle')}
        <span className="text-slate-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300 space-y-2">
          <p>{t('intro')}</p>
          <ol className="list-decimal ms-5 space-y-1">
            <li>{t('step1')}</li>
            <li>{t('step2')}</li>
            <li>{t('step3')}</li>
            <li>{t('step4')}</li>
            <li>{t('step5')}</li>
          </ol>
          <p className="text-xs text-slate-400">{t('note')}</p>
        </div>
      )}
    </div>
  )
}
